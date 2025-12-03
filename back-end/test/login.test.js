// test/login.test.js (CommonJS version)
const chai = require("chai");
const chaiHttp = require("chai-http");
const mongoose = require("mongoose");
const app = require("../app");
const User = require("../models/User");

const { expect } = chai;
chai.use(chaiHttp);

let loginUsername;
const loginPassword = "Password123!";

describe("Login routes", () => {

  // ----------------------------
  // BEFORE EACH: create test user
  // ----------------------------
  beforeEach(async function () {
    this.timeout(10000);

    // remove any leftover login test users
    await User.deleteMany({
      $or: [
        { username: /^loginuser_/i },
        { email: /^login_.*@example\.com$/i },
      ],
    });

    const ts = Date.now();
    loginUsername = `loginuser_${ts}`.toLowerCase();

    const payload = {
      username: loginUsername,
      email: `login_${ts}@example.com`,
      password: loginPassword,
      confirmPassword: loginPassword,
    };

    const res = await chai.request(app).post("/auth/signup").send(payload);
    expect(res).to.have.status(200);
    expect(res.body).to.have.property("success", true);
  });

  // ----------------------------
  // TESTS
  // ----------------------------
  it("POST /auth/login returns 200 and user info for valid credentials", (done) => {
    chai
      .request(app)
      .post("/auth/login")
      .set("content-type", "application/json")
      .send({ username: loginUsername, password: loginPassword })
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);

        expect(res.body).to.have.property("success", true);
        expect(res.body.message).to.include("logged in");
        expect(res.body).to.have.property("token");
        expect(res.body.username).to.equal(loginUsername);
        expect(res.body.email).to.include("@");

        done();
      });
  });

  it("POST /auth/login returns 401 when username or password missing", (done) => {
    chai
      .request(app)
      .post("/auth/login")
      .set("content-type", "application/json")
      .send({ username: loginUsername }) // no password
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(401);
        expect(res.body.success).to.equal(false);
        expect(res.body.message).to.include("No username or password supplied");
        done();
      });
  });

  it("POST /auth/login returns 401 for invalid credentials", (done) => {
    chai
      .request(app)
      .post("/auth/login")
      .set("content-type", "application/json")
      .send({ username: "does_not_exist_123", password: "whatever" })
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(401);
        expect(res.body.success).to.equal(false);
        done();
      });
  });

  // ----------------------------
  // AFTER ALL: CLEANUP
  // ----------------------------
  after(async () => {
    if (mongoose.connection.readyState !== 1) return;

    await new Promise((resolve) => setTimeout(resolve, 150));

    const deleted = await User.deleteMany({
      $or: [
        { username: /^loginuser_/i },
        { email: /^login_.*@example\.com$/i },
      ],
    });

    console.log(`[LOGIN CLEANUP] removed ${deleted.deletedCount} users`);
  });
});