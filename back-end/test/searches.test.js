// test/searches.test.js (CommonJS version)
const chai = require("chai");
const chaiHttp = require("chai-http");
const mongoose = require("mongoose");
const app = require("../app");
const User = require("../models/User");

const { expect } = chai;
chai.use(chaiHttp);

describe("Searches API", function() {
  // Ensure test user exists before tests, so search endpoint can find a user
  before(async function() {
    this.timeout(15000);
    // Create a test user to search for
    await User.deleteMany({
      $or: [
        { username: /^Anna_123$/i },
        { email: /^anna_123@example\.com$/i }
      ],
    });

    await chai
      .request(app)
      .post("/auth/signup")
      .set("Content-Type", "application/json")
      .send({
        username: "Anna_123",
        email: "anna_123@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      });
  });

  it("/api/searches returns 200 for a valid username (letters, digits, underscore)", function(done) {
    chai
      .request(app)
      .post("/api/searches")
      .set("content-type", "application/json")
      .send({ query: "Anna_123" })
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.have.property("ok", true);
        expect(res.body).to.have.property("message").that.contains("Anna_123");
        done();
      });
  });

  it("/api/searches returns 400 when username is missing", function(done) {
    chai
      .request(app)
      .post("/api/searches")
      .set("content-type", "application/json")
      .send({ query: "" })
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        expect(res).to.be.json;
        expect(res.body).to.have.property("ok", false);
        expect(res.body.error).to.match(/required/i);
        done();
      });
  });

  it("/api/searches returns 400 for illegal username (spaces or symbols)", function(done) {
    chai
      .request(app)
      .post("/api/searches")
      .set("content-type", "application/json")
      .send({ query: "John Doe" })
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        expect(res).to.be.json;
        expect(res.body).to.have.property("ok", false);
        expect(res.body.error).to.match(/letters/i);
        done();
      });
  });

  // Cleanup after tests
  after(async () => {
    if (mongoose.connection.readyState !== 1) return;

    await User.deleteMany({
      $or: [
        { username: "Anna_123" },
        { email: "anna_123@example.com" }
      ],
    });
  });
});