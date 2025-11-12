
import { use, expect } from 'chai';
import { default as chaiHttp, request } from 'chai-http';
import app from '../app.js';

use(chaiHttp);

const FAKE_PNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

it('POST /api/boards/:id/edit accepts image upload and returns 202 JSON with file metadata', done => {
  request
    .execute(app)
    .post('/api/boards/1/edit')
    .set('Content-Type', 'multipart/form-data')
    .field('title', 'New Board Title')
    .field('descriptionLong', 'A very long description for this board.')
    .attach('photo', FAKE_PNG, 'test.png') 
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(202);
      expect(res).to.be.json;

      expect(res.body).to.have.property('status', 'received');
      expect(res.body).to.have.property('boardId').that.equals('1');
      expect(res.body).to.have.property('received').that.is.an('object');

      expect(res.body.received).to.have.property('title', 'New Board Title');
      expect(res.body.received).to.have.property('descriptionLong', 'A very long description for this board.');
      expect(res.body.received).to.have.property('photo').that.is.an('object');

      const photo = res.body.received.photo;
      expect(photo).to.have.property('filename', 'test.png');
      expect(photo).to.have.property('mimetype').that.match(/^image\//);
      expect(photo).to.have.property('size').that.is.a('number');

      expect(res.body).to.have.property('updatedAt');
      done();
    });
});

it('POST /api/boards/:id/edit without a file still returns 202 JSON and photo=null', done => {
  request
    .execute(app)
    .post('/api/boards/2/edit')
    .set('Content-Type', 'multipart/form-data')
    .field('title', 'Title Without File')
    .field('descriptionLong', 'No photo was uploaded here.')
    
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(202);
      expect(res).to.be.json;

      expect(res.body).to.have.property('status', 'received');
      expect(res.body).to.have.property('boardId').that.equals('2');
      expect(res.body).to.have.property('received').that.is.an('object');

      expect(res.body.received).to.have.property('title', 'Title Without File');
      expect(res.body.received).to.have.property('descriptionLong', 'No photo was uploaded here.');
      expect(res.body.received).to.have.property('photo', null);

      expect(res.body).to.have.property('updatedAt');
      done();
    });
});