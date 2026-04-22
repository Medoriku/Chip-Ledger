const MOCK_SESSIONS_BY_USER = {
	1: [
		{
			sessionId: 1001,
			userId: 1,
			smallBlind: 2,
			bigBlind: 5,
			rebuyNum: 1,
			rebuyAmt: 100,
			buyIn: 300,
			cashOut: 450,
			startTime: '2026-04-01T18:00:00.000Z',
			endTime: '2026-04-01T21:30:00.000Z',		},
		{
			sessionId: 1002,
			userId: 1,
			smallBlind: 1,
			bigBlind: 3,
			rebuyNum: 0,
			rebuyAmt: 0,
			buyIn: 200,
			cashOut: 120,
			startTime: '2026-04-03T19:15:00.000Z',
			endTime: '2026-04-03T22:15:00.000Z',		}
	],
	2: [
		{
			sessionId: 2001,
			userId: 2,
			smallBlind: 2,
			bigBlind: 5,
			rebuyNum: 2,
			rebuyAmt: 75,
			buyIn: 150,
			cashOut: 210,
			startTime: '2026-04-02T20:00:00.000Z',
			endTime: '2026-04-02T23:00:00.000Z',
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
	const smallBlind = Number(payload.smallBlind);
	const bigBlind = Number(payload.bigBlind);
	const rebuyNum = Number(payload.rebuyNum ?? 0);
	const rebuyAmt = Number(payload.rebuyAmt ?? 0);

	if (!date || Number.isNaN(hours) || Number.isNaN(buyIn) || Number.isNaN(cashOut) || Number.isNaN(smallBlind) || Number.isNaN(bigBlind) || Number.isNaN(rebuyNum) || Number.isNaN(rebuyAmt)) {
		throw new Error('date, hours, buyin, cashout, smallBlind, bigBlind, rebuyNum, and rebuyAmt are required');
	}

	if (hours <= 0) {
		throw new Error('hours must be greater than 0');
	}

	if (smallBlind <= 0 || bigBlind <= 0) {
		throw new Error('smallBlind and bigBlind must be greater than 0');
	}

	if (rebuyNum < 0 || rebuyAmt < 0) {
		throw new Error('rebuyNum and rebuyAmt cannot be negative');
	}

	const startTime = new Date(`${date}T12:00:00.000Z`);
	if (Number.isNaN(startTime.getTime())) {
		throw new Error('Invalid date');
	}

	let locationId = null;
	if (payload.location) {
		const locResult = await dbPool.query(
			`INSERT INTO locations (user_id, name)
			VALUES ($1, $2)
			ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
			RETURNING location_id`,
			[userId, payload.location]
		);
		locationId = locResult.rows[0].location_id;
	}

	const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);
	const newSession = {
		sessionId: getNextSessionId(),
		userId,
		smallBlind,
		bigBlind,
		rebuyNum,
		rebuyAmt,
		buyIn,
		cashOut,
		startTime: startTime.toISOString(),
		endTime: endTime.toISOString(),
		location: payload.location || null,
		notes: payload.notes || null
	};

	if (!SESSION_STORE[userId]) {
		SESSION_STORE[userId] = [];
	}

	SESSION_STORE[userId].push(newSession);
	return newSession;
}

function mapDbRowToSession(row) {
    const sessionDate = normalizeSessionDate(row.sessionDate);
    if (!sessionDate) {
        throw new Error('Invalid session date returned from database');
    }
    
    // Use the hours column from the DB, fallback to 0 or a default if missing
    const hours = Number(row.hours || 0);
    const endTime = new Date(sessionDate.getTime() + hours * 60 * 60 * 1000);

    return {
        sessionId: Number(row.sessionId),
        userId: Number(row.userId),
        smallBlind: row.smallBlind === null ? null : Number(row.smallBlind),
        bigBlind: row.bigBlind === null ? null : Number(row.bigBlind),
        rebuyNum: Number(row.rebuyNum || 0),
        rebuyAmt: Number(row.rebuyAmt || 0),
        buyIn: Number(row.buyIn),
        cashOut: Number(row.cashOut),
        hours: hours, // Pass hours through to the frontend
        startTime: sessionDate.toISOString(),
        endTime: endTime.toISOString(),
        notes: row.notes || null,
		location: row.location || null
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
			const filters = ['s.user_id = $1'];

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
					s.session_id AS "sessionId",
					s.user_id AS "userId",
					s.small_blind AS "smallBlind",
					s.big_blind AS "bigBlind",
					s.rebuy_num AS "rebuyNum",
					s.rebuy_amt AS "rebuyAmt",
					s.buy_in AS "buyIn",
					s.buy_out AS "cashOut",
					s.session_date AS "sessionDate",
					s.session_hours AS "hours",
					s.notes,
					l.name AS "location"
				FROM sessions s
				LEFT JOIN locations l ON s.location_id = l.location_id
				WHERE ${filters.join(' AND ')}
				ORDER BY s.session_date DESC, s.session_id DESC`,
				values
			);

			return result.rows.map((row) => mapDbRowToSession(row));
		},

		async addSessionForUser(userId, payload = {}) {
			const date = payload.date;
			const hours = Number(payload.hours);
			const buyIn = Number(payload.buyin);
			const cashOut = Number(payload.cashout);
			const smallBlind = Number(payload.smallBlind);
			const bigBlind = Number(payload.bigBlind);
			const rebuyNum = Number(payload.rebuyNum ?? 0);
			const rebuyAmt = Number(payload.rebuyAmt ?? 0);

			if (!date || Number.isNaN(hours) || Number.isNaN(buyIn) || Number.isNaN(cashOut) || Number.isNaN(smallBlind) || Number.isNaN(bigBlind) || Number.isNaN(rebuyNum) || Number.isNaN(rebuyAmt)) {
				throw new Error('date, hours, buyin, cashout, smallBlind, bigBlind, rebuyNum, and rebuyAmt are required');
			}

			if (hours <= 0) {
				throw new Error('hours must be greater than 0');
			}

			if (smallBlind <= 0 || bigBlind <= 0) {
				throw new Error('smallBlind and bigBlind must be greater than 0');
			}

			if (rebuyNum < 0 || rebuyAmt < 0) {
				throw new Error('rebuyNum and rebuyAmt cannot be negative');
			}

			const notes = payload.notes || null;

			let locationId = null;
			if (payload.location) {
				const locResult = await dbPool.query(
					`INSERT INTO locations (user_id, name)
					 VALUES ($1, $2)
					 ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
					 RETURNING location_id`,
					[userId, payload.location]
				);
				locationId = locResult.rows[0].location_id;
			}



			const inserted = await dbPool.query(
				`INSERT INTO sessions (user_id, small_blind, big_blind, rebuy_num, rebuy_amt, buy_in, buy_out, session_date, location_id, notes, session_hours)
				 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
				 RETURNING
					session_id AS "sessionId",
					user_id AS "userId",
					small_blind AS "smallBlind",
					big_blind AS "bigBlind",
					rebuy_num AS "rebuyNum",
					rebuy_amt AS "rebuyAmt",
					buy_in AS "buyIn",
					buy_out AS "cashOut",
					session_date AS "sessionDate",
					session_hours AS "hours",
					notes`,
				[userId, smallBlind, bigBlind, rebuyNum, rebuyAmt, buyIn, cashOut, date, locationId, notes, hours]
			);

			inserted.rows[0].location = payload.location || null;

			return mapDbRowToSession(inserted.rows[0], hours);
		}
	};
}

module.exports = {
	getSessionsForUser,
	addSessionForUser,
	createSessionProvider
};
