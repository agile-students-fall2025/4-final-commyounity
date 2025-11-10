import { use, expect } from 'chai';
import { default as chaiHttp, request } from 'chai-http';
import app from '../app.js';

use(chaiHttp);


it('/api/boards responds with a JSON list of boards', done => {
  request
    .execute(app)
    .get('/api/boards')
    .end((err, res) => {
      expect(err).to.be.null;                 
      expect(res).to.have.status(200);        
      expect(res).to.be.json;                 
      expect(res.body).to.have.property('data');
      expect(res.body.data).to.be.an('array');

      if (res.body.data.length > 0) {
        const b = res.body.data[0];
        expect(b).to.have.property('id');     
        expect(b).to.have.property('title');  
        if (b.coverPhotoURL !== undefined) {
          expect(b.coverPhotoURL).to.be.a('string');
        }
      }
      done();
    });
});

it('/api/boards/:id returns a single board for a valid id', done => {
  request
    .execute(app)
    .get('/api/boards')
    .end((listErr, listRes) => {
      expect(listErr).to.be.null;
      expect(listRes).to.have.status(200);
      expect(listRes.body).to.have.property('data').that.is.an('array');

      
      if (listRes.body.data.length === 0) {
        return done(); 
      }

      const validId = listRes.body.data[0].id;

      request
        .execute(app)
        .get(`/api/boards/${validId}`)
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.have.property('data').that.is.an('object');
          expect(res.body.data).to.have.property('id').that.equals(validId);
          done();
        });
    });
});


it('/api/boards/:id returns 404 for a non-existent id', done => {
  const impossibleId = 987654321; 

  request
    .execute(app)
    .get(`/api/boards/${impossibleId}`)
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(404);
      expect(res).to.be.json;
      expect(res.body).to.have.property('error').that.match(/not found/i);
      done();
    });
});