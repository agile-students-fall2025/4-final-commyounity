// test/searches.test.js (CommonJS version)
const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("../app");

const { expect } = chai;
chai.use(chaiHttp);

it("/api/searches returns 200 for a valid username (letters, digits, underscore)", (done) => {
  chai
    .request(app)
    .post("/api/searches")
    .set("content-type", "application/json")
    .send({ query: "Anna_123" })
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body).to.have.property("ok").that.equals(true);
      expect(res.body).to.have.property("message").that.contains("Anna_123");
      done();
    });
});

it("/api/searches returns 400 when username is missing", (done) => {
  chai
    .request(app)
    .post("/api/searches")
    .set("content-type", "application/json")
    .send({ query: "" })
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(400);
      expect(res).to.be.json;
      expect(res.body).to.have.property("ok").that.equals(false);
      expect(res.body).to.have.property("error").that.match(/required/i);
      done();
    });
});

it("/api/searches returns 400 for illegal username (spaces or symbols)", (done) => {
  chai
    .request(app)
    .post("/api/searches")
    .set("content-type", "application/json")
    .send({ query: "John Doe" })
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(400);
      expect(res).to.be.json;
      expect(res.body).to.have.property("ok").that.equals(false);
      expect(res.body).to.have.property("error").that.match(/letters/i);
      done();
    });
});