// test/searchBar.test.js
import { use, expect } from 'chai';
import { default as chaiHttp, request } from 'chai-http';
import app from '../app.js';

use(chaiHttp);

let createdUsername;

before(async function () {
  this.timeout(10000);
  const ts = Date.now();
  createdUsername = `searchbar${ts}`;

  const signupRes = await request.execute(app)
    .post('/auth/signup')
    .set('Content-Type', 'application/json')
    .send({
      username: createdUsername,
      email: `searchbar${ts}@example.com`,
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });

  expect(signupRes).to.have.status(200);
});

it('POST /api/searches returns ok:true, count and results for valid username', done => {
  request.execute(app)
    .post('/api/searches')
    .set('Content-Type', 'application/json')
    .send({ query: createdUsername })
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('ok', true);
      expect(res.body).to.have.property('count').that.is.a('number');
      expect(res.body).to.have.property('results').that.is.an('array');
      done();
    });
});

it('POST /api/searches returns 400 when username missing', done => {
  request.execute(app)
    .post('/api/searches')
    .set('Content-Type', 'application/json')
    .send({})
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(400);
      expect(res.body).to.deep.include({ ok: false });
      expect(res.body.error).to.match(/Username is required/i);
      done();
    });
});

it('POST /api/searches returns 400 for illegal username', done => {
  request.execute(app)
    .post('/api/searches')
    .set('Content-Type', 'application/json')
    .send({ query: 'bad name!' })
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(400);
      expect(res.body).to.deep.include({ ok: false });
      expect(res.body.error).to.match(/Illegal username/i);
      done();
    });
});