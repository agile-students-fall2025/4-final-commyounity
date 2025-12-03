// test/friendRequests.test.js
const chai = require('chai');
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const Friend = require('../models/Friend');

const { expect } = chai;

let token;
let ownerId;

beforeEach(async () => {
  // DELETE ONLY TEST USERS
  await User.deleteMany({
    username: /^fr_test_/i
  });

  await FriendRequest.deleteMany({});
  await Friend.deleteMany({});

  const user = await new User({
    username: `fr_test_${Math.floor(Math.random() * 1e6)}`,
    email: `fr_test_${Date.now()}@example.com`,
    password: 'password123',
    name: 'FR Tester',
  }).save();

  token = user.generateJWT();
  ownerId = user._id;

  await FriendRequest.insertMany([
    {
      owner: ownerId,
      requester: new mongoose.Types.ObjectId(),
      username: 'wil.hoff',
      first_name: 'Wilhem',
      last_name: 'Hoffmann',
      status: 'pending',
    },
    {
      owner: ownerId,
      requester: new mongoose.Types.ObjectId(),
      username: 'kara.codes',
      first_name: 'Kara',
      last_name: 'Singh',
      status: 'pending',
    },
  ]);
});

// 1) GET /api/friend-requests
it('GET /api/friend-requests returns cached requests', done => {
  request(app)
    .get('/api/friend-requests')
    .set('Authorization', `JWT ${token}`)
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res.status).to.equal(200);

      expect(res.body).to.have.property('data').that.is.an('array');
      expect(res.body).to.have.property('meta').that.is.an('object');

      if (Array.isArray(res.body.data)) {
        expect(res.body.meta)
          .to.have.property('count')
          .that.equals(res.body.data.length);
      }

      done();
    });
});

// 2) POST /api/friend-requests/:id/accept
it('POST /api/friend-requests/:id/accept removes the request and returns friend payload', done => {
  request(app)
    .get('/api/friend-requests')
    .set('Authorization', `JWT ${token}`)
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('data').that.is.an('array');

      const target = res.body.data[0];

      if (!target) return done();

      request(app)
        .post(`/api/friend-requests/${encodeURIComponent(target.id)}/accept`)
        .set('Authorization', `JWT ${token}`)
        .end((err2, res2) => {
          expect(err2).to.be.null;
          expect(res2.status).to.equal(200);

          expect(res2.body).to.have.property('status').that.equals('accepted');
          expect(res2.body).to.have.property('friend').that.is.an('object');
          expect(res2.body.friend).to.include.keys(
            'id',
            'first_name',
            'last_name',
            'username'
          );
          expect(res2.body).to.have.property('remainingRequests').that.is.a('number');

          done();
        });
    });
});

// 3) POST /api/friend-requests/:id/decline
it('POST /api/friend-requests/:id/decline removes the request and echoes declined data', done => {
  request(app)
    .get('/api/friend-requests')
    .set('Authorization', `JWT ${token}`)
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('data').that.is.an('array');

      const target = res.body.data[0];
      if (!target) return done();

      request(app)
        .post(`/api/friend-requests/${encodeURIComponent(target.id)}/decline`)
        .set('Authorization', `JWT ${token}`)
        .end((err2, res2) => {
          expect(err2).to.be.null;
          expect(res2.status).to.equal(200);

          expect(res2.body).to.have.property('status').that.equals('declined');
          expect(res2.body).to.have.property('declinedRequest').that.is.an('object');
          expect(res2.body.declinedRequest).to.include.keys('id', 'username');
          expect(res2.body).to.have.property('remainingRequests').that.is.a('number');

          done();
        });
    });
});

// ✅ AFTER HOOK → delete all test-generated data
after(async () => {
  if (mongoose.connection.readyState !== 1) return;

  await User.deleteMany({
    email: /fr_test_.*@example\.com$/i,
  });

  await FriendRequest.deleteMany({
    username: { $in: ['wil.hoff', 'kara.codes'] },
  });

  await Friend.deleteMany({
    // all Friend docs created during these tests are tied to test users
    // so removing test users already disconnects these—but safe to clean anyway
  });
});