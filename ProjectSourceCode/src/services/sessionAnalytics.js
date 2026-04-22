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
    const rebuyNum = toNumber(session.rebuyNum, 0);
    const rebuyAmt = toNumber(session.rebuyAmt, 0);
    
    const timePlayedHoursRaw = session.hours !== undefined 
        ? toNumber(session.hours) 
        : hoursBetween(session.startTime, session.endTime);


    const totalInvested = buyIn + (rebuyNum * rebuyAmt);
    const netProfitRaw = cashOut - totalInvested;
    
    const dollarsPerHourRaw = timePlayedHoursRaw > 0 ? netProfitRaw / timePlayedHoursRaw : null;

    return {
        sessionId: session.sessionId,
        smallBlind: toNumber(session.smallBlind, null),
        bigBlind: toNumber(session.bigBlind, null),
        rebuyNum,
        rebuyAmt,
        buyIn,
        cashOut,
        timePlayedHours: roundTo(timePlayedHoursRaw),
        netProfit: roundTo(netProfitRaw),
        dollarsPerHour: dollarsPerHourRaw === null ? null : roundTo(dollarsPerHourRaw),
		location: session.location,
		startTime: session.startTime
    };
}
function summarizeSessions(userId, sessions) {
	const computedSessions = sessions.map(summarizeSession);

	const totals = computedSessions.reduce(
		(acc, session) => {
			acc.totalHours += session.timePlayedHours;
			acc.totalNetProfit += session.netProfit;
			return acc;
		},
		{ totalHours: 0, totalNetProfit: 0 }
	);

	const overallDollarsPerHour =
		totals.totalHours > 0 ? roundTo(totals.totalNetProfit / totals.totalHours) : null;

	return {
		userId,
		sessions: computedSessions,
		totals: {
			totalHours: roundTo(totals.totalHours),
			totalNetProfit: roundTo(totals.totalNetProfit),
			overallDollarsPerHour
		}
	};
}

module.exports = {
	summarizeSessions
};
