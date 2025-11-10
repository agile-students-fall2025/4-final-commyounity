
import { use, expect } from 'chai';
import { default as chaiHttp, request } from 'chai-http';
import app from '../app.js';

use(chaiHttp);

it('POST /api/searches returns 200 for a valid username (letters, digits, underscore)', done => {
  request
    .execute(app)
    .post('/api/searches')
    .set('Content-Type', 'application/json')
    .send({ query: 'Anna_123' })
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(200);
      expect(res).to.be.json;

      expect(res.body).to.have.property('ok', true);
      expect(res.body).to.have.property('message').that.includes('Backend received search');
      expect(res.body).to.have.property('timestamp');
      done();
    });
});

it('POST /api/searches returns 400 when username is missing', done => {
  request
    .execute(app)
    .post('/api/searches')
    .set('Content-Type', 'application/json')
    .send({ query: '' })
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(400);
      expect(res).to.be.json;

      expect(res.body).to.have.property('ok', false);
      expect(res.body).to.have.property('error').that.includes('required');
      done();
    });
});

it('POST /api/searches returns 400 for illegal username (spaces or symbols)', done => {
  request
    .execute(app)
    .post('/api/searches')
    .set('Content-Type', 'application/json')
    .send({ query: 'John Doe!' })
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(400);
      expect(res).to.be.json;

      expect(res.body).to.have.property('ok', false);
      expect(res.body)
        .to.have.property('error')
        .that.includes('Only letters, digits');
      done();
    });
});