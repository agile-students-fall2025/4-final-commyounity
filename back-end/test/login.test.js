// test/login.test.js
import { use, expect } from 'chai';
import { default as chaiHttp, request } from 'chai-http';
import app from '../app.js';

use(chaiHttp);

let loginUsername;
const loginPassword = 'Password123!';

before(async function () {
  this.timeout(10000);
  const ts = Date.now();
  loginUsername = `loginuser_${ts}`;

  const payload = {
    username: loginUsername,
    email: `login_${ts}@example.com`,
    password: loginPassword,
    confirmPassword: loginPassword,
  };

  const res = await request
    .execute(app)
    .post('/auth/signup')
    .send(payload);

  expect(res).to.have.status(200);
  expect(res.body).to.have.property('success', true);
});

it('POST /auth/login returns 200 and user info for valid credentials', done => {
  request
    .execute(app)
    .post('/auth/login')
    .set('content-type', 'application/json')
    .send({ username: loginUsername, password: loginPassword })
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(200);
      expect(res).to.be.json;

      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('message').that.includes('logged in');
      expect(res.body).to.have.property('token').that.is.a('string');
      expect(res.body).to.have.property('username', loginUsername);
      expect(res.body).to.have.property('email').that.includes('@');
      done();
    });
});

it('POST /auth/login returns 401 when username or password missing', done => {
  request
    .execute(app)
    .post('/auth/login')
    .set('content-type', 'application/json')
    .send({ username: loginUsername }) // no password
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(401);
      expect(res.body).to.have.property('success', false);
      expect(res.body)
        .to.have.property('message')
        .that.includes('No username or password supplied');
      done();
    });
});

it('POST /auth/login returns 401 for invalid credentials', done => {
  request
    .execute(app)
    .post('/auth/login')
    .set('content-type', 'application/json')
    .send({ username: 'does_not_exist_123', password: 'whatever' })
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(401);
      expect(res.body).to.have.property('success', false);
      // message could be "User not found in database." or "Incorrect password."
      expect(res.body).to.have.property('message').that.is.a('string');
      done();
    });
});