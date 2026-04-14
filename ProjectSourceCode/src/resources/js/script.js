let sessions = [];
let refreshSessionsSummary = null;

function initVisualEffects() {
	const animatedCards = document.querySelectorAll('.card, .quick-card, .metric-card');
	animatedCards.forEach((card, index) => {
		card.classList.add('card-fly-in');
		card.style.setProperty('--stagger', `${Math.min(index * 80, 560)}ms`);
	});

	const siteHeader = document.querySelector('.site-header');
	if (siteHeader && !siteHeader.querySelector('.header-card-layer')) {
		const headerLayer = document.createElement('div');
		headerLayer.className = 'header-card-layer';
		siteHeader.appendChild(headerLayer);

		if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			const suits = [
				{ symbol: '♠', red: false },
				{ symbol: '♥', red: true },
				{ symbol: '♣', red: false },
				{ symbol: '♦', red: true }
			];
			const ranks = ['A', 'K', 'Q', 'J', '10', '9', '8'];

			function spawnHeaderCard() {
				const card = document.createElement('span');
				const suit = suits[Math.floor(Math.random() * suits.length)];
				const rank = ranks[Math.floor(Math.random() * ranks.length)];
				const leftToRight = Math.random() > 0.5;
				const startX = leftToRight ? -20 - Math.random() * 14 : 104 + Math.random() * 14;
				const endX = leftToRight ? 104 + Math.random() * 14 : -20 - Math.random() * 14;
				const startY = 8 + Math.random() * 44;
				const endY = Math.max(4, startY + (-22 + Math.random() * 44));
				const midX = (startX + endX) / 2 + (-8 + Math.random() * 16);
				const midY = Math.max(2, Math.min(64, Math.min(startY, endY) + (-20 + Math.random() * 40)));

				card.className = `header-card${suit.red ? ' red' : ''}`;
				card.textContent = suit.symbol;
				card.dataset.rank = rank;
				card.dataset.suit = suit.symbol;
				card.style.setProperty('--x-start', `${startX}vw`);
				card.style.setProperty('--x-end', `${endX}vw`);
				card.style.setProperty('--x-mid', `${midX}vw`);
				card.style.setProperty('--y-start', `${startY}px`);
				card.style.setProperty('--y-end', `${endY}px`);
				card.style.setProperty('--y-mid', `${midY}px`);
				card.style.setProperty('--rx-start', `${-20 + Math.random() * 24}deg`);
				card.style.setProperty('--ry-start', `${-24 + Math.random() * 32}deg`);
				card.style.setProperty('--rz-start', `${-26 + Math.random() * 52}deg`);
				card.style.setProperty('--rx-mid', `${-18 + Math.random() * 36}deg`);
				card.style.setProperty('--ry-mid', `${-22 + Math.random() * 36}deg`);
				card.style.setProperty('--rz-mid', `${-20 + Math.random() * 40}deg`);
				card.style.setProperty('--rx-end', `${-24 + Math.random() * 34}deg`);
				card.style.setProperty('--ry-end', `${-28 + Math.random() * 34}deg`);
				card.style.setProperty('--rz-end', `${-26 + Math.random() * 52}deg`);
				card.style.animationDuration = `${24 + Math.random() * 10}s`;

				headerLayer.appendChild(card);

				card.addEventListener('animationend', () => {
					card.remove();
				});
			}

			for (let i = 0; i < 5; i += 1) {
				spawnHeaderCard();
			}

			window.setInterval(spawnHeaderCard, 4600);
		}
	}

	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		return;
	}

	if (document.querySelector('.chip-rain')) {
		return;
	}

	const chipRain = document.createElement('div');
	chipRain.className = 'chip-rain';
	document.body.appendChild(chipRain);

	const chipPalette = ['#1b66aa', '#2aa7bf', '#27b18f', '#f5b946', '#ec5b76', '#8b5cf6'];

	function spawnChip() {
		const chip = document.createElement('span');
		chip.className = 'chip';
		chip.innerHTML = '<span class="chip-face chip-face-front"></span><span class="chip-face chip-face-back"></span><span class="chip-edge"></span>';
		chip.style.left = `${Math.random() * 100}vw`;
		chip.style.setProperty('--chip-color', chipPalette[Math.floor(Math.random() * chipPalette.length)]);
		chip.style.setProperty('--chip-scale', `${(0.75 + Math.random() * 0.7).toFixed(2)}`);
		chip.style.setProperty('--chip-drift', `${(-35 + Math.random() * 70).toFixed(1)}px`);
		chip.style.setProperty('--chip-spin-x', `${(2 + Math.random() * 1.8).toFixed(2)}turn`);
		chip.style.setProperty('--chip-spin-y', `${(0.35 + Math.random() * 0.95).toFixed(2)}turn`);
		chip.style.setProperty('--chip-spin-z', `${(1.8 + Math.random() * 1.8).toFixed(2)}turn`);
		chip.style.animationDuration = `${10 + Math.random() * 8}s`;
		chip.style.animationDelay = `${Math.random() * 0.6}s`;
		chipRain.appendChild(chip);

		chip.addEventListener('animationend', () => {
			chip.remove();
		});
	}

	for (let i = 0; i < 8; i += 1) {
		spawnChip();
	}

	window.setInterval(spawnChip, 1200);
}

function initSessionsPage() {
	const sessionsRoot = document.getElementById('sessions-root');
	if (!sessionsRoot) {
		return;
	}

	const feedback = document.getElementById('session-summary-feedback');
	const grid = document.getElementById('session-summary-grid');
	const tableBody = document.getElementById('session-summary-table-body');

	function currency(value) {
		if (value === null || value === undefined) {
			return '--';
		}
		return `$${Number(value).toFixed(2)}`;
	}

	function renderTotals(totals) {
		grid.innerHTML = '';

		const cards = [
			{ label: 'Total Net Profit', value: currency(totals.totalNetProfit) },
			{ label: 'Total Hours', value: Number(totals.totalHours).toFixed(2) },
			{ label: 'Total Hands', value: totals.totalHandsPlayed },
			{ label: 'Overall $/hr', value: currency(totals.overallDollarsPerHour) }
		];

		for (const card of cards) {
			const el = document.createElement('article');
			el.className = 'metric-card';
			el.innerHTML = `<p class="metric-label">${card.label}</p><p class="metric-value">${card.value}</p>`;
			grid.appendChild(el);
		}
	}

	function renderSessions(rows) {
		tableBody.innerHTML = '';

		if (!rows.length) {
			tableBody.innerHTML = '<tr><td colspan="7">No sessions logged yet.</td></tr>';
			return;
		}

		rows.forEach((rowData, index) => {
			const row = document.createElement('tr');
			row.innerHTML = `
				<td>${index + 1}</td>
				<td>${currency(rowData.buyIn)}</td>
				<td>${currency(rowData.cashOut)}</td>
				<td>${rowData.handsPlayed}</td>
				<td>${Number(rowData.timePlayedHours).toFixed(2)}</td>
				<td>${currency(rowData.netProfit)}</td>
				<td>${currency(rowData.dollarsPerHour)}</td>
			`;
			tableBody.appendChild(row);
		});
	}

	async function loadSessionSummary() {
		if (feedback) {
			feedback.textContent = 'Loading your session history...';
		}

		try {
			const response = await fetch('/api/sessions/summary');
			if (!response.ok) {
				const errorBody = await response.json();
				throw new Error(errorBody.error || 'Failed to load sessions');
			}

			const payload = await response.json();
			renderTotals(payload.totals);
			renderSessions(payload.sessions);

			if (feedback) {
				feedback.textContent = `Loaded ${payload.sessions.length} session(s).`;
			}
		} catch (err) {
			if (feedback) {
				feedback.textContent = `Could not load sessions: ${err.message}`;
			}
			grid.innerHTML = '';
			tableBody.innerHTML = '';
		}
	}

	refreshSessionsSummary = loadSessionSummary;
	loadSessionSummary();
}

document.addEventListener('DOMContentLoaded', () => {
	initVisualEffects();
	initNewsPage();
	initSessionsPage();

	const statsRoot = document.getElementById('stats-root');
	if (!statsRoot) {
		return;
	}

	const loadBtn = document.getElementById('load-stats-btn');
	const feedback = document.getElementById('stats-feedback');
	const grid = document.getElementById('stats-grid');
	const tableBody = document.getElementById('stats-table-body');

	function currency(value) {
		if (value === null || value === undefined) {
			return '--';
		}
		return `$${Number(value).toFixed(2)}`;
	}

	function renderTotals(totals) {
		grid.innerHTML = '';

		const cards = [
			{ label: 'Total Net Profit', value: currency(totals.totalNetProfit) },
			{ label: 'Total Hours', value: Number(totals.totalHours).toFixed(2) },
			{ label: 'Total Hands', value: totals.totalHandsPlayed },
			{ label: 'Overall $/hr', value: currency(totals.overallDollarsPerHour) }
		];

		for (const card of cards) {
			const el = document.createElement('article');
			el.className = 'metric-card';
			el.innerHTML = `<p class="metric-label">${card.label}</p><p class="metric-value">${card.value}</p>`;
			grid.appendChild(el);
		}
	}

	function renderSessions(sessions) {
		tableBody.innerHTML = '';

		if (!sessions.length) {
			tableBody.innerHTML =
				'<tr><td colspan="7">No sessions found for this user/date range.</td></tr>';
			return;
		}

		sessions.forEach((session, index) => {
			const row = document.createElement('tr');
			row.innerHTML = `
				<td>${index + 1}</td>
				<td>${currency(session.buyIn)}</td>
				<td>${currency(session.cashOut)}</td>
				<td>${session.handsPlayed}</td>
				<td>${Number(session.timePlayedHours).toFixed(2)}</td>
				<td>${currency(session.netProfit)}</td>
				<td>${currency(session.dollarsPerHour)}</td>
			`;
			tableBody.appendChild(row);
		});
	}

	async function loadSummary() {
		feedback.textContent = 'Loading statistics...';
		try {
			const response = await fetch('/api/sessions/summary');
			if (!response.ok) {
				const errorBody = await response.json();
				throw new Error(errorBody.error || 'Failed to fetch summary');
			}

			const payload = await response.json();
			renderTotals(payload.totals);
			renderSessions(payload.sessions);
			const targetLabel = payload.username || 'this account';
			feedback.textContent = `Loaded ${payload.sessions.length} session(s) for ${targetLabel}.`;
		} catch (err) {
			feedback.textContent = `Could not load statistics: ${err.message}`;
			grid.innerHTML = '';
			tableBody.innerHTML = '';
		}
	}

	loadBtn.addEventListener('click', loadSummary);
	loadSummary();
});

async function initNewsPage() {
	const list = document.getElementById('news-list');
	const feedback = document.getElementById('news-feedback');

	if (!list || !feedback) {
		return;
	}

	feedback.textContent = 'Loading latest headlines...';

	try {
		const response = await fetch('/api/news');
		if (!response.ok) {
			throw new Error(`News request failed (${response.status})`);
		}

		const articles = await response.json();
		list.innerHTML = '';

		if (!articles.length) {
			feedback.textContent = 'No news articles available right now.';
			return;
		}

		articles.slice(0, 9).forEach((article) => {
			const item = document.createElement('a');
			item.className = 'quick-card';
			item.href = article.url || '#';
			item.target = '_blank';
			item.rel = 'noopener noreferrer';

			const title = article.title || 'Untitled Story';
			const summary = article.summary || 'Open article for full details.';
			item.innerHTML = `<h3>${title}</h3><p>${summary}</p>`;
			list.appendChild(item);
		});

		feedback.textContent = `Loaded ${Math.min(articles.length, 9)} poker headlines.`;
	} catch (err) {
		feedback.textContent = `Could not load news: ${err.message}`;
		list.innerHTML = '';
	}
}

const sessionForm = document.getElementById('session_form');

if (sessionForm) {
	sessionForm.addEventListener('submit', function (event) {
		const form = this;

		if (!form.checkValidity()) {
			event.preventDefault();
			event.stopPropagation();
			form.reportValidity();
		} else {
			event.preventDefault();
			saveSession();
		}
	});
}

async function saveSession() {
	const sessionDetails = {
		date: document.getElementById('session_date').value,
		hours: parseFloat(document.getElementById('session_hours').value) || 0,
		buyin: parseFloat(document.getElementById('session_buyin').value) || 0,
		cashout: parseFloat(document.getElementById('session_cashout').value) || 0,
		rebuyNum: parseInt(document.getElementById('session_rebuyNum').value, 10) || 0,
		rebuyAmt: parseFloat(document.getElementById('session_rebuyAmt').value) || 0,
		location: document.getElementById('session_location').value,
		smallBlind: parseFloat(document.getElementById('session_smallBlind').value) || 0,
		bigBlind: parseFloat(document.getElementById('session_bigBlind').value) || 0
	};

	const feedback = document.getElementById('session-feedback');
	if (feedback) {
		feedback.textContent = 'Saving session...';
	}

	try {
		const response = await fetch('/api/sessions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(sessionDetails)
		});

		const body = await response.json();
		if (!response.ok) {
			throw new Error(body.error || 'Failed to save session');
		}

		sessions.push(body.session);
		document.getElementById('session_form').reset();
		const myModalElement = document.getElementById('session_modal');
		const myModal = bootstrap.Modal.getOrCreateInstance(myModalElement);
		myModal.hide();

		if (feedback) {
			feedback.textContent = 'Session logged successfully.';
		}

		if (typeof refreshSessionsSummary === 'function') {
			refreshSessionsSummary();
		}
	} catch (err) {
		if (feedback) {
			feedback.textContent = `Could not save session: ${err.message}`;
		}
	}
}