// test/searchBar.test.js
const chai = require("chai");
const chaiHttp = require("chai-http");
const mongoose = require("mongoose");
const app = require("../app");
const User = require("../models/User");

const { expect } = chai;
chai.use(chaiHttp);

let createdUsername;

describe("SearchBar API", function() {
  this.timeout(20000);  // allow up to 20s for network / DB

  before(function(done) {
    const ts = Date.now();
    createdUsername = `searchbar${ts}`;

    // delete old test users just in case
    User.deleteMany({
      $or: [
        { username: /^searchbar/i },
        { email: /^searchbar.*@example\.com$/i }
      ]
    }).then(() => {
      return chai
        .request(app)
        .post("/auth/signup")
        .set("Content-Type", "application/json")
        .send({
          username: createdUsername,
          email: `searchbar${ts}@example.com`,
          password: "Password123!",
          confirmPassword: "Password123!"
        });
    }).then(signupRes => {
      expect(signupRes).to.have.status(200);
      done();
    }).catch(err => done(err));
  });

  it("POST /api/searches returns ok:true, count and results for valid username", function(done) {
    chai
      .request(app)
      .post("/api/searches")
      .set("Content-Type", "application/json")
      .send({ query: createdUsername })
      .end((err, res) => {
        try {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res.body.ok).to.be.true;
          expect(res.body.count).to.be.a("number");
          expect(res.body.results).to.be.an("array");
          done();
        } catch (assertErr) {
          done(assertErr);
        }
      });
  });

  // other tests unchanged...

  after(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({
        $or: [
          { username: /^searchbar/i },
          { email: /^searchbar.*@example\.com$/i }
        ]
      });
    }
  });
});