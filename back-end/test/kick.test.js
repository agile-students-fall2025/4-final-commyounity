
import { use, expect } from 'chai';
import { default as chaiHttp, request } from 'chai-http';
import app from '../app.js';

use(chaiHttp);


it('POST /api/boards/:id/kick-member returns 202 and decrements memberCount', done => {
  request
    .execute(app)
    .post('/api/boards/42/kick-member')
    .set('content-type', 'application/json')
    .send({ memberId: 7, memberCount: 5 }) // 5 -> 4
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(202);
      expect(res).to.be.json;

      expect(res.body).to.have.property('status', 'received');
      expect(res.body).to.have.property('message').that.includes('Kick recorded');
      expect(res.body).to.have.property('data').that.deep.equals({ id: '42', memberCount: 4 });

      expect(res.body).to.have.property('meta').that.is.an('object');
      expect(res.body.meta).to.include({ memberId: 7, memberCountPrev: 5, memberCountDelta: -1 });
      expect(res.body).to.have.property('timestamp');
      done();
    });
});


it('POST /api/boards/:id/kick-member returns 400 when memberCount is missing', done => {
  request
    .execute(app)
    .post('/api/boards/42/kick-member')
    .set('content-type', 'application/json')
    .send({ memberId: 7 }) 
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(400);
      expect(res).to.be.json;
      expect(res.body).to.have.property('status', 'error');
      expect(res.body).to.have.property('message').that.includes('memberCount is required');
      done();
    });
});


it('POST /api/boards/:id/kick-member returns 400 when memberCount is negative', done => {
  request
    .execute(app)
    .post('/api/boards/42/kick-member')
    .set('content-type', 'application/json')
    .send({ memberId: 7, memberCount: -3 })
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(400);
      expect(res).to.be.json;
      expect(res.body).to.have.property('status', 'error');
      expect(res.body).to.have.property('message').that.includes('non-negative');
      done();
    });
});


it('POST /api/boards/:id/kick-member returns 409 when memberCount is 0', done => {
  request
    .execute(app)
    .post('/api/boards/42/kick-member')
    .set('content-type', 'application/json')
    .send({ memberId: 7, memberCount: 0 })
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(409);
      expect(res).to.be.json;
      expect(res.body).to.have.property('status', 'error');
      expect(res.body).to.have.property('message').that.match(/empty board/i);
      expect(res.body).to.have.property('data').that.deep.equals({ id: '42', memberCount: 0 });
      expect(res.body).to.have.property('timestamp');
      done();
    });
});