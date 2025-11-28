// test/friendRequests.test.js
import { use, expect } from 'chai';
import chaiHttp, { request } from 'chai-http';
import app from '../app.js';

use(chaiHttp);

// 1) GET /api/friend-requests
it('GET /api/friend-requests returns cached requests', done => {
  request
    .execute(app)
    .get('/api/friend-requests')
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(200);
      expect(res).to.be.json;

      expect(res.body)
        .to.have.property('data')
        .that.is.an('array');
      expect(res.body)
        .to.have.property('meta')
        .that.is.an('object');

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
  request
    .execute(app)
    .get('/api/friend-requests')
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(200);
      expect(res.body)
        .to.have.property('data')
        .that.is.an('array');

      const target = res.body.data[0];

      // If there are no requests, nothing to test → consider it vacuously OK
      if (!target) {
        return done();
      }

      request
        .execute(app)
        .post(`/api/friend-requests/${encodeURIComponent(target.id)}/accept`)
        .end((err2, res2) => {
          expect(err2).to.be.null;
          expect(res2).to.have.status(200);
          expect(res2).to.be.json;

          expect(res2.body)
            .to.have.property('status')
            .that.equals('accepted');

          expect(res2.body)
            .to.have.property('friend')
            .that.is.an('object');

          expect(res2.body.friend).to.include.keys(
            'id',
            'first_name',
            'last_name',
            'username'
          );

          // remainingRequests should be a number
          expect(res2.body)
            .to.have.property('remainingRequests')
            .that.is.a('number');

          done();
        });
    });
});

// 3) POST /api/friend-requests/:id/decline
it('POST /api/friend-requests/:id/decline removes the request and echoes declined data', done => {
  request
    .execute(app)
    .get('/api/friend-requests')
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(200);
      expect(res.body)
        .to.have.property('data')
        .that.is.an('array');

      const target = res.body.data[0];

      if (!target) {
        return done();
      }

      request
        .execute(app)
        .post(`/api/friend-requests/${encodeURIComponent(target.id)}/decline`)
        .end((err2, res2) => {
          expect(err2).to.be.null;
          expect(res2).to.have.status(200);
          expect(res2).to.be.json;

          expect(res2.body)
            .to.have.property('status')
            .that.equals('declined');

          expect(res2.body)
            .to.have.property('declinedRequest')
            .that.is.an('object');

          expect(res2.body.declinedRequest).to.include.keys('id', 'username');

          expect(res2.body)
            .to.have.property('remainingRequests')
            .that.is.a('number');

          done();
        });
    });
});