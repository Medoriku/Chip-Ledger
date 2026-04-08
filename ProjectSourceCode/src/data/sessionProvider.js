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
	const sessions = MOCK_SESSIONS_BY_USER[userId] || [];
	return sessions.filter((session) => inDateRange(session, range));
}

module.exports = {
	getSessionsForUser
};
