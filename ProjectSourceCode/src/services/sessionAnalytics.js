function toNumber(value, fallback = 0) {
	const num = Number(value);
	return Number.isFinite(num) ? num : fallback;
}

function roundTo(value, decimals = 2) {
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
}

function hoursBetween(startTime, endTime) {
	const start = new Date(startTime);
	const end = new Date(endTime);
	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
		return 0;
	}

	const ms = end.getTime() - start.getTime();
	if (ms <= 0) {
		return 0;
	}

	return ms / (1000 * 60 * 60);
}

function summarizeSession(session) {
	const buyIn = toNumber(session.buyIn);
	const cashOut = toNumber(session.cashOut);
	const handsPlayed = toNumber(session.handsPlayed);
	const timePlayedHoursRaw = hoursBetween(session.startTime, session.endTime);
	const netProfitRaw = buyIn - cashOut;
	const dollarsPerHourRaw = timePlayedHoursRaw > 0 ? netProfitRaw / timePlayedHoursRaw : null;

	return {
		sessionId: session.sessionId,
		buyIn,
		cashOut,
		handsPlayed,
		timePlayedHours: roundTo(timePlayedHoursRaw),
		netProfit: roundTo(netProfitRaw),
		dollarsPerHour: dollarsPerHourRaw === null ? null : roundTo(dollarsPerHourRaw)
	};
}

function summarizeSessions(userId, sessions) {
	const computedSessions = sessions.map(summarizeSession);

	const totals = computedSessions.reduce(
		(acc, session) => {
			acc.totalHandsPlayed += session.handsPlayed;
			acc.totalHours += session.timePlayedHours;
			acc.totalNetProfit += session.netProfit;
			return acc;
		},
		{ totalHandsPlayed: 0, totalHours: 0, totalNetProfit: 0 }
	);

	const overallDollarsPerHour =
		totals.totalHours > 0 ? roundTo(totals.totalNetProfit / totals.totalHours) : null;

	return {
		userId,
		sessions: computedSessions,
		totals: {
			totalHandsPlayed: totals.totalHandsPlayed,
			totalHours: roundTo(totals.totalHours),
			totalNetProfit: roundTo(totals.totalNetProfit),
			overallDollarsPerHour
		}
	};
}

module.exports = {
	summarizeSessions
};
