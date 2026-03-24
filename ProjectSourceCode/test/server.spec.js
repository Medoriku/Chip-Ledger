const request = require('supertest');
const { expect } = require('chai');
const { app, db } = require('../src/index');

describe('Server page routes', () => {
	after(async () => {
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
});
