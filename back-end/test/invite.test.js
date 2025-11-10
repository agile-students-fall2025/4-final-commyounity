
import { use, expect } from 'chai';
import { default as chaiHttp, request } from 'chai-http';
import app from '../app.js';

use(chaiHttp);

it('POST /api/boards/:id/invite returns 202 and correct JSON when friendId is provided', done => {
  request
    .execute(app)
    .post('/api/boards/5/invite')
    .set('content-type', 'application/json')
    .send({ friendId: 42 })
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(202);
      expect(res).to.be.json;

      expect(res.body).to.have.property('status', 'received');
      expect(res.body).to.have.property('boardId', '5');
      expect(res.body).to.have.property('friendId', 42);
      expect(res.body).to.have.property('message').that.includes('Invite recorded');
      expect(res.body).to.have.property('timestamp');
      done();
    });
});

it('POST /api/boards/:id/invite returns 400 when friendId is missing', done => {
  request
    .execute(app)
    .post('/api/boards/5/invite')
    .set('content-type', 'application/json')
    .send({}) 
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(400);
      expect(res).to.be.json;

      expect(res.body).to.have.property('status', 'error');
      expect(res.body).to.have.property('message').that.includes('friendId is required');
      done();
    });
});