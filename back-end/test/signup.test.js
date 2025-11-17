import { use, expect } from 'chai';
import { default as chaiHttp, request } from 'chai-http';
import app from '../app.js';

use(chaiHttp);

it('POST /auth/signup returns 201 and new user information', done => {
  const uniqueSuffix = Date.now();
  const payload = {
    username: `newuser_${uniqueSuffix}`,
    email: `newuser_${uniqueSuffix}@demo.com`,
    password: 'password123',
    confirmPassword: 'password123',
  };

  request
    .execute(app)
    .post('/auth/signup')
    .set('content-type', 'application/json')
    .send(payload)
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(201);
      expect(res).to.be.json;
      expect(res.body).to.have.property('ok', true);
      expect(res.body)
        .to.have.property('message')
        .that.includes('Account created successfully');
      expect(res.body).to.have.property('user');
      expect(res.body.user).to.have.property('username', payload.username);
      expect(res.body.user).to.have.property('email', payload.email);
      expect(res.body.user).to.have.property('name', payload.username);
      done();
    });
});

it('POST /auth/signup returns 400 when required fields are missing', done => {
  request
    .execute(app)
    .post('/auth/signup')
    .set('content-type', 'application/json')
    .send({ username: 'short' })
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(400);
      expect(res).to.be.json;
      expect(res.body).to.have.property('ok', false);
      expect(res.body)
        .to.have.property('error')
        .that.is.a('string')
        .and.includes('required');
      done();
    });
});

it('POST /auth/signup returns 409 for duplicate username', done => {
  const duplicateUser = {
    username: `duplicate_${Date.now()}`,
    email: `duplicate_${Date.now()}@demo.com`,
    password: 'password123',
    confirmPassword: 'password123',
  };

  request
    .execute(app)
    .post('/auth/signup')
    .set('content-type', 'application/json')
    .send(duplicateUser)
    .end((firstErr, firstRes) => {
      expect(firstErr).to.be.null;
      expect(firstRes).to.have.status(201);

      request
        .execute(app)
        .post('/auth/signup')
        .set('content-type', 'application/json')
        .send({
          ...duplicateUser,
          email: `other_${duplicateUser.email}`,
        })
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(409);
          expect(res).to.be.json;
          expect(res.body).to.have.property('ok', false);
          expect(res.body)
            .to.have.property('error')
            .that.includes('Username already taken');
          done();
        });
    });
});

