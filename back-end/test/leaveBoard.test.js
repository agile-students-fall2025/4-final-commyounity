import { use, expect } from 'chai';
import { default as chaiHttp, request } from 'chai-http';
import app from '../app.js';

use(chaiHttp);

it('POST /api/boards/:id/leave returns 202 and the expected JSON (numeric id)', done => {
  request
    .execute(app)
    .post('/api/boards/123/leave')
    .set('content-type', 'application/json')
    .send({}) 
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(202);
      expect(res).to.be.json;

      expect(res.body).to.have.property('status', 'received');
      expect(res.body).to.have.property('boardId', '123');
      expect(res.body).to.have.property('message').that.includes('left the board');
      expect(res.body).to.have.property('updated').that.is.an('object');
      expect(res.body.updated).to.have.property('isJoined', false);
      expect(res.body.updated).to.have.property('memberCountDelta', -1);
      expect(res.body).to.have.property('timestamp');
      done();
    });
});

it('POST /api/boards/:id/leave returns 202 and echoes string id', done => {
  request
    .execute(app)
    .post('/api/boards/abc123/leave')
    .set('content-type', 'application/json')
    .send({})
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(202);
      expect(res).to.be.json;

      expect(res.body).to.have.property('status', 'received');
      expect(res.body).to.have.property('boardId', 'abc123');
      expect(res.body.updated).to.deep.equal({ isJoined: false, memberCountDelta: -1 });
      expect(res.body).to.have.property('timestamp');
      done();
    });
});