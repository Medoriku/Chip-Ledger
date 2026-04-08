const request = require('supertest');
const { expect } = require('chai');
const { app, db } = require('../src/index');

describe('Server page routes', () => {
	const originalProvider = app.get('sessionProvider');

	after(async () => {
		app.set('sessionProvider', originalProvider);
		await db.end();
	});

	it('GET / returns home page', async () => {
		const res = await request(app).get('/');
		expect(res.status).to.equal(200);
		expect(res.text).to.include('Chip Ledger');
	});

	it('GET /login returns login page', async () => {
		const res = await request(app).get('/login');
		expect(res.status).to.equal(200);
		expect(res.text).to.include('Login');
	});

	it('GET /register returns register page', async () => {
		const res = await request(app).get('/register');
		expect(res.status).to.equal(200);
		expect(res.text).to.include('Register');
	});

	it('POST /logout redirects to home page (positive)', async () => {
		const res = await request(app).post('/logout');
		expect(res.status).to.equal(302);
		expect(res.headers.location).to.equal('/');
	});

	it('POST /login with missing password returns 400 (negative)', async () => {
		const res = await request(app).post('/login').send({ email: 'user@example.com' });
		expect(res.status).to.equal(400);
		expect(res.text).to.include('Missing email or password');
	});

	it('GET /api/sessions/summary returns computed metrics (positive)', async () => {
		app.set('sessionProvider', {
			getSessionsForUser: async () => [
				{
					sessionId: 901,
					userId: 7,
					buyIn: 100,
					cashOut: 160,
					startTime: '2026-04-01T20:00:00.000Z',
					endTime: '2026-04-01T22:00:00.000Z',
					handsPlayed: 120
				}
			]
		});

		const res = await request(app).get('/api/sessions/summary').query({ userId: 7 });

		expect(res.status).to.equal(200);
		expect(res.body.userId).to.equal(7);
		expect(res.body.sessions).to.have.length(1);
		expect(res.body.sessions[0].netProfit).to.equal(-60);
		expect(res.body.sessions[0].timePlayedHours).to.equal(2);
		expect(res.body.sessions[0].handsPlayed).to.equal(120);
		expect(res.body.sessions[0].dollarsPerHour).to.equal(-30);
	});

	it('GET /api/sessions/summary without userId returns 400 (negative)', async () => {
		const res = await request(app).get('/api/sessions/summary');
		expect(res.status).to.equal(400);
		expect(res.body.error).to.include('userId is required');
	});
});
