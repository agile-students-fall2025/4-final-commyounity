// test/signup.test.js
import { use, expect } from 'chai';
import { default as chaiHttp, request } from 'chai-http';
import mongoose from 'mongoose';
import app from '../app.js';

use(chaiHttp);

before(async function () {
  this.timeout(15000);

  // Make sure we have a DB connection; other tests might have done this,
  // but this keeps the file self-contained.
  if (mongoose.connection.readyState === 0) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not set for signup tests');
    }
    await mongoose.connect(uri);
  }
});

it('POST /auth/signup returns 200 and new user information', async function () {
  this.timeout(10000);

  const ts = Date.now();
  const payload = {
    username: `signupuser_${ts}`,
    email: `signup_${ts}@example.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!',
  };

  const res = await request
    .execute(app)
    .post('/auth/signup')
    .send(payload);

  expect(res).to.have.status(200);
  expect(res).to.be.json;

  expect(res.body).to.have.property('success', true);
  expect(res.body).to.have.property('message').that.includes('User saved successfully');
  expect(res.body).to.have.property('token').that.is.a('string');
  expect(res.body).to.have.property('username', payload.username.toLowerCase());
  expect(res.body).to.have.property('email', payload.email.toLowerCase());
  expect(res.body).to.have.property('name', payload.username);
});

it('POST /auth/signup returns 400 when required fields are missing', async function () {
  this.timeout(10000);

  // Missing email + password
  const res = await request
    .execute(app)
    .post('/auth/signup')
    .send({ username: 'someone' });

  expect(res).to.have.status(400);
  expect(res).to.be.json;

  expect(res.body).to.have.property('success', false);
  expect(res.body)
    .to.have.property('message')
    .that.includes('username, email, and password are required');
});

it('POST /auth/signup returns 409 for duplicate username', async function () {
  this.timeout(15000);

  const ts = Date.now();
  const baseUsername = `dupuser_${ts}`;

  const first = {
    username: baseUsername,
    email: `dup1_${ts}@example.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!',
  };

  const second = {
    username: baseUsername, // same username, different email
    email: `dup2_${ts}@example.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!',
  };

  // First signup should succeed
  const res1 = await request
    .execute(app)
    .post('/auth/signup')
    .send(first);

  expect(res1).to.have.status(200);
  expect(res1.body).to.have.property('success', true);

  // Second signup with same username should 409
  const res2 = await request
    .execute(app)
    .post('/auth/signup')
    .send(second);

  expect(res2).to.have.status(409);
  expect(res2).to.be.json;

  expect(res2.body).to.have.property('success', false);
  expect(res2.body)
    .to.have.property('message')
    .that.includes('Username already taken');
});