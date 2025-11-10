
import { use, expect } from 'chai';
import { default as chaiHttp, request } from 'chai-http';
import app from '../app.js';

use(chaiHttp);


it('/api/members responds with a JSON list of members', done => {
  request
    .execute(app)
    .get('/api/members')
    .end((err, res) => {
      expect(err).to.be.null;                 
      expect(res).to.have.status(200);        
      expect(res).to.be.json;                 
      expect(res.body).to.have.property('data');
      expect(res.body.data).to.be.an('array');
      if (res.body.data.length > 0) {
        const m = res.body.data[0];
        expect(m).to.have.property('id');
        expect(m).to.have.property('first_name');
        expect(m).to.have.property('last_name');
        expect(m).to.have.property('username');
        if (m.avatar !== undefined) {
          expect(m.avatar).to.be.a('string');
        }
      }
      done();
    });
});

it('/api/members items have at least an id field', done => {
  request
    .execute(app)
    .get('/api/members')
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body).to.have.property('data').that.is.an('array');

      for (const m of res.body.data) {
        expect(m).to.be.an('object');
        expect(m).to.have.property('id');
      }
      done();
    });
});