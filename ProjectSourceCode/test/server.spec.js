const request = require('supertest');
const bcrypt = require('bcrypt');
const { app, db } = require('../src/index')
const sinon = require('sinon');
const chai = require('chai'); 
const chaiHttp = require('chai-http');

chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************

describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(app)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });
});

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************
describe('Registration Page Routes', () => {
	afterEach(() => {
    	sinon.restore();
  	});

	it('Returns 400 if required fields are missing', done => {
    	chai
		.request(app)
		.post('/register')
		.send({ username: 'testuser' }) // missing email & password
		.end((err, res) => {
			expect(res).to.have.status(400);
			assert.strictEqual(res.text, 'Missing required fields');
			done();
		});
  	});

  	it('Hashes password, inserts user, and redirects on success', done => {
    // Mock bcrypt.hash and db.query
    const hashStub = sinon.stub(bcrypt, 'hash').resolves('hashedpassword');
    const dbStub = sinon.stub(db, 'query').resolves();

    chai
      .request(app)
      .post('/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      })
      .end((err, res) => {
        expect(hashStub.calledOnce).to.be.true;
        expect(dbStub.calledOnce).to.be.true;

        expect(res).to.redirectTo(/\/login$/); // ends with /login
        done();
      });
  });
});

// ********************************************************************************

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
