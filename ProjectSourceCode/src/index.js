const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const { create } = require('express-handlebars');
const pg = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

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

const db = new pg.Pool({
	host: process.env.POSTGRES_HOST || 'db',
	port: process.env.POSTGRES_PORT || 5432,
	database: process.env.POSTGRES_DB || 'postgres',
	user: process.env.POSTGRES_USER || 'postgres',
	password: process.env.POSTGRES_PASSWORD || 'postgres'
});

app.get('/', (req, res) => {
	res.render('pages/home', {
		title: 'Chip Ledger',
		user: req.session.user || null
	});
});

app.get('/login', (req, res) => {
	res.render('pages/login', { title: 'Login' });
});

app.get('/register', (req, res) => {
	res.render('pages/register', { title: 'Register' });
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
		return res.redirect('/login');
	} catch (err) {
		return res.status(500).send('Registration failed');
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
			return res.status(401).send('Invalid credentials');
		}

		const isMatch = await bcrypt.compare(password, account.password_hash);
		if (!isMatch) {
			return res.status(401).send('Invalid credentials');
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

if (require.main === module) {
	app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	});
}

module.exports = { app, db };
