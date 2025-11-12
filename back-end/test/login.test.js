import { use, expect } from 'chai';
import { default as chaiHttp, request } from 'chai-http';
import app from '../app.js';

use(chaiHttp);

it('POST /auth/login returns 200 and user info for valid credentials', done => {
  request
    .execute(app)
    .post('/auth/login')
    .set('content-type', 'application/json')
    .send({ username: 'testuser', password: '12345' })
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body).to.have.property('ok', true);
      expect(res.body).to.have.property('message').that.includes('Welcome');
      expect(res.body).to.have.property('user').that.includes({
        id: 1,
        username: 'testuser',
        name: 'Test User',
      });
      done();
    });
});

it('POST /auth/login returns 400 when username or password missing', done => {
  request
    .execute(app)
    .post('/auth/login')
    .set('content-type', 'application/json')
    .send({ username: 'testuser' })
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(400);
      expect(res).to.be.json;
      expect(res.body).to.have.property('ok', false);
      expect(res.body)
        .to.have.property('error')
        .that.includes('Username and password are required');
      done();
    });
});

it('POST /auth/login returns 401 for invalid credentials', done => {
  request
    .execute(app)
    .post('/auth/login')
    .set('content-type', 'application/json')
    .send({ username: 'testuser', password: 'wrong' })
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(401);
      expect(res).to.be.json;
      expect(res.body).to.have.property('ok', false);
      expect(res.body)
        .to.have.property('error')
        .that.includes('Invalid credentials');
      done();
    });
});

