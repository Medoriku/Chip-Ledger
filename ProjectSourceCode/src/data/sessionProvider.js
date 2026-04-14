const MOCK_SESSIONS_BY_USER = {
	1: [
		{
			sessionId: 1001,
			userId: 1,
			buyIn: 300,
			cashOut: 450,
			startTime: '2026-04-01T18:00:00.000Z',
			endTime: '2026-04-01T21:30:00.000Z',
			handsPlayed: 220
		},
		{
			sessionId: 1002,
			userId: 1,
			buyIn: 200,
			cashOut: 120,
			startTime: '2026-04-03T19:15:00.000Z',
			endTime: '2026-04-03T22:15:00.000Z',
			handsPlayed: 185
		}
	],
	2: [
		{
			sessionId: 2001,
			userId: 2,
			buyIn: 150,
			cashOut: 210,
			startTime: '2026-04-02T20:00:00.000Z',
			endTime: '2026-04-02T23:00:00.000Z',
			handsPlayed: 160
		}
	]
};

const SESSION_STORE = JSON.parse(JSON.stringify(MOCK_SESSIONS_BY_USER));

function getNextSessionId() {
	const ids = Object.values(SESSION_STORE)
		.flat()
		.map((session) => Number(session.sessionId))
		.filter((id) => Number.isInteger(id));

	if (!ids.length) {
		return 1;
	}

	return Math.max(...ids) + 1;
}

function inDateRange(session, range) {
	if (!range.startDate && !range.endDate) {
		return true;
	}

	const sessionStart = new Date(session.startTime);
	if (Number.isNaN(sessionStart.getTime())) {
		return false;
	}

	if (range.startDate) {
		const start = new Date(range.startDate);
		if (!Number.isNaN(start.getTime()) && sessionStart < start) {
			return false;
		}
	}

	if (range.endDate) {
		const end = new Date(range.endDate);
		if (!Number.isNaN(end.getTime()) && sessionStart > end) {
			return false;
		}
	}

	return true;
}

async function getSessionsForUser(userId, range = {}) {
	const sessions = SESSION_STORE[userId] || [];
	return sessions.filter((session) => inDateRange(session, range));
}

async function addSessionForUser(userId, payload = {}) {
	const date = payload.date;
	const hours = Number(payload.hours);
	const buyIn = Number(payload.buyin);
	const cashOut = Number(payload.cashout);

	if (!date || Number.isNaN(hours) || Number.isNaN(buyIn) || Number.isNaN(cashOut)) {
		throw new Error('date, hours, buyin, and cashout are required');
	}

	if (hours <= 0) {
		throw new Error('hours must be greater than 0');
	}

	const startTime = new Date(`${date}T12:00:00.000Z`);
	if (Number.isNaN(startTime.getTime())) {
		throw new Error('Invalid date');
	}

	const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);
	const newSession = {
		sessionId: getNextSessionId(),
		userId,
		buyIn,
		cashOut,
		startTime: startTime.toISOString(),
		endTime: endTime.toISOString(),
		handsPlayed: 0,
		location: payload.location || null,
		notes: payload.notes || null
	};

	if (!SESSION_STORE[userId]) {
		SESSION_STORE[userId] = [];
	}

	SESSION_STORE[userId].push(newSession);
	return newSession;
}

function mapDbRowToSession(row, hoursOverride = 2) {
	const sessionDate = normalizeSessionDate(row.sessionDate);
	if (!sessionDate) {
		throw new Error('Invalid session date returned from database');
	}
	const safeHours = Number.isFinite(hoursOverride) && hoursOverride > 0 ? hoursOverride : 2;
	const endTime = new Date(sessionDate.getTime() + safeHours * 60 * 60 * 1000);

	return {
		sessionId: Number(row.sessionId),
		userId: Number(row.userId),
		buyIn: Number(row.buyIn),
		cashOut: Number(row.cashOut),
		startTime: sessionDate.toISOString(),
		endTime: endTime.toISOString(),
		handsPlayed: 0,
		notes: row.notes || null
	};
}

function normalizeSessionDate(value) {
	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 12, 0, 0, 0));
	}

	if (typeof value !== 'string') {
		return null;
	}

	const trimmed = value.trim();
	if (!trimmed) {
		return null;
	}

	if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
		const parsedDateOnly = new Date(`${trimmed}T12:00:00.000Z`);
		return Number.isNaN(parsedDateOnly.getTime()) ? null : parsedDateOnly;
	}

	const parsed = new Date(trimmed);
	if (Number.isNaN(parsed.getTime())) {
		return null;
	}

	return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate(), 12, 0, 0, 0));
}

function createSessionProvider(dbPool) {
	if (!dbPool) {
		return {
			getSessionsForUser,
			addSessionForUser
		};
	}

	return {
		async getSessionsForUser(userId, range = {}) {
			const values = [userId];
			const filters = ['user_id = $1'];

			if (range.startDate) {
				values.push(range.startDate);
				filters.push(`session_date >= $${values.length}`);
			}

			if (range.endDate) {
				values.push(range.endDate);
				filters.push(`session_date <= $${values.length}`);
			}

			const result = await dbPool.query(
				`SELECT
					session_id AS "sessionId",
					user_id AS "userId",
					buy_in AS "buyIn",
					buy_out AS "cashOut",
					session_date AS "sessionDate",
					notes
				 FROM sessions
				 WHERE ${filters.join(' AND ')}
				 ORDER BY session_date DESC, session_id DESC`,
				values
			);

			return result.rows.map((row) => mapDbRowToSession(row, 2));
		},

		async addSessionForUser(userId, payload = {}) {
			const date = payload.date;
			const hours = Number(payload.hours);
			const buyIn = Number(payload.buyin);
			const cashOut = Number(payload.cashout);

			if (!date || Number.isNaN(hours) || Number.isNaN(buyIn) || Number.isNaN(cashOut)) {
				throw new Error('date, hours, buyin, and cashout are required');
			}

			if (hours <= 0) {
				throw new Error('hours must be greater than 0');
			}

			const notes = payload.notes || null;
			const inserted = await dbPool.query(
				`INSERT INTO sessions (user_id, buy_in, buy_out, session_date, location_id, notes)
				 VALUES ($1, $2, $3, $4, NULL, $5)
				 RETURNING
					session_id AS "sessionId",
					user_id AS "userId",
					buy_in AS "buyIn",
					buy_out AS "cashOut",
					session_date AS "sessionDate",
					notes`,
				[userId, buyIn, cashOut, date, notes]
			);

			return mapDbRowToSession(inserted.rows[0], hours);
		}
	};
}

module.exports = {
	getSessionsForUser,
	addSessionForUser,
	createSessionProvider
};
