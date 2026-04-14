const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const { create } = require('express-handlebars');
const pg = require('pg');
const { createSessionProvider } = require('./data/sessionProvider');
const { summarizeSessions } = require('./services/sessionAnalytics');

const app = express();
const PORT = process.env.PORT || 3000;

const newsRoutes = require("./routes/news");
app.use("/api/news", newsRoutes);

const hbs = create({
	extname: '.hbs',
	layoutsDir: path.join(__dirname, 'views/layouts'),
	partialsDir: path.join(__dirname, 'views/partials')
});

app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
	session({
		secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
		resave: false,
		saveUninitialized: false,
		cookie: { maxAge: 1000 * 60 * 60 }
	})
);

// Required for local assets such as CSS/JS/images in this course setup.
app.use(express.static(__dirname + '/'));

function requireLogin(req, res, next) {
	if (!req.session?.user) {
		return res.redirect('/login');
	}
	next();
}

function requireLoginApi(req, res, next) {
	if (!req.session?.user) {
		return res.status(401).json({ error: 'Login required' });
	}
	next();
}

const db = new pg.Pool({
	host: process.env.POSTGRES_HOST || 'db',
	port: process.env.POSTGRES_PORT || 5432,
	database: process.env.POSTGRES_DB || 'postgres',
	user: process.env.POSTGRES_USER || 'postgres',
	password: process.env.POSTGRES_PASSWORD || 'postgres'
});

async function ensureDatabaseSchema() {
	await db.query(`
		CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			username VARCHAR(50) NOT NULL UNIQUE,
			email VARCHAR(255) NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`);

	await db.query(`
		CREATE TABLE IF NOT EXISTS locations (
			location_id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
			name VARCHAR(255) NOT NULL,
			UNIQUE (user_id, name)
		)
	`);

	await db.query(`
		CREATE TABLE IF NOT EXISTS sessions (
			session_id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
			location_id INTEGER REFERENCES locations(location_id) ON DELETE SET NULL,
			buy_in NUMERIC(10,2) NOT NULL,
			buy_out NUMERIC(10,2) NOT NULL,
			session_date DATE NOT NULL,
			notes TEXT
		)
	`);
}

const isTestRuntime =
	process.env.NODE_ENV === 'test' ||
	process.env.npm_lifecycle_event === 'test' ||
	process.argv.some((arg) => arg.includes('mocha'));

if (!isTestRuntime) {
	ensureDatabaseSchema().catch((err) => {
		console.error('Failed to ensure database schema:', err);
	});
}

// Keep data-access swappable: teammate SQL module can replace this provider.
app.set('sessionProvider', createSessionProvider(db));

app.get('/', (req, res) => {
	res.render('pages/home', {
		title: 'Chip Companion',
		user: req.session.user || null
	});
});

// This is a dummy route for testing of lab-10 code 
app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
});

app.get('/login', (req, res) => {
	res.render('pages/login', {
		title: 'Login',
		justRegistered: req.query.registered === '1'
	});
});

app.get('/register', (req, res) => {
	res.render('pages/register', {
		title: 'Register'
	});
});

app.get('/sessions', (req, res) => {
	res.render('pages/sessions', {
		title: 'Sessions',
		user: req.session.user || null,
		isLoggedIn: Boolean(req.session?.user)
	});
});

app.get('/usersettings', requireLogin, (req, res) => {
	res.render('pages/usersettings', {
		title: 'User Settings',
		user: req.session.user
	});
});

app.get('/news', (req, res) => {
	res.render('pages/news', { title: 'News' });
});

app.post('/register', async (req, res) => {
	const { username, email, password } = req.body;
	if (!username || !email || !password) {
		return res.status(400).send('Missing required fields');
	}

	try {
		const hash = await bcrypt.hash(password, 10);
		await db.query(
			'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)',
			[username, email, hash]
		);
		return res.redirect('/login?registered=1');
	} catch (err) {
		console.error('Registration failed:', err);

		if (err.code === '23505') {
			const conflictingField = String(err.detail || '').toLowerCase().includes('email')
				? 'email'
				: 'username';

			return res.status(409).render('pages/register', {
				title: 'Register',
				registerError:
					conflictingField === 'email'
						? 'That email address is already registered. Try logging in instead.'
						: 'That username is already taken. Please choose another one.',
				username,
				email
			});
		}

		return res.status(500).render('pages/register', {
			title: 'Register',
			registerError: 'Registration failed. Please try again.'
		});
	}
});

app.post('/login', async (req, res) => {
	const { email, password } = req.body;
	if (!email || !password) {
		return res.status(400).send('Missing email or password');
	}

	try {
		const result = await db.query(
			'SELECT id, username, email, password_hash FROM users WHERE email = $1',
			[email]
		);
		const account = result.rows[0];

		if (!account) {
			return res.status(401).render('pages/login', {
				title: 'Login',
				loginError: 'No account found for that email.',
				offerRegister: true,
				email
			});
		}

		const isMatch = await bcrypt.compare(password, account.password_hash);
		if (!isMatch) {
			return res.status(401).render('pages/login', {
				title: 'Login',
				loginError: 'Invalid credentials.',
				email
			});
		}

		req.session.user = {
			id: account.id,
			username: account.username,
			email: account.email
		};

		return res.redirect('/');
	} catch (err) {
		return res.status(500).send('Login failed');
	}
});

app.post('/logout', (req, res) => {
	req.session.destroy(() => {
		res.redirect('/');
	});
});

app.get('/api/sessions/summary', async (req, res) => {
	const sessionUserId = req.session?.user?.id;
	const queryUserId = req.query.userId;
	const resolvedUserId = Number(sessionUserId || queryUserId);

	if (!Number.isInteger(resolvedUserId) || resolvedUserId <= 0) {
		return res.status(400).json({ error: 'userId is required (session or query param)' });
	}

	const range = {
		startDate: req.query.startDate,
		endDate: req.query.endDate
	};

	try {
		const provider = app.get('sessionProvider');
		const sessions = await provider.getSessionsForUser(resolvedUserId, range);
		const payload = summarizeSessions(resolvedUserId, sessions);
		payload.username = req.session?.user?.username || null;
		return res.status(200).json(payload);
	} catch (err) {
		return res.status(500).json({ error: 'Failed to summarize sessions' });
	}
});

app.post('/api/sessions', requireLoginApi, async (req, res) => {
	const userId = req.session.user.id;

	try {
		const provider = app.get('sessionProvider');
		const created = await provider.addSessionForUser(userId, req.body);
		return res.status(201).json({ message: 'Session logged successfully', session: created });
	} catch (err) {
		return res.status(400).json({ error: err.message || 'Could not log session' });
	}
});

if (require.main === module) {
	app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	});
}

module.exports = { app, db };
