// test/boards.test.js
import { use, expect } from "chai";
import chaiHttp, { request } from "chai-http";
import mongoose from "mongoose";
import app from "../app.js";

use(chaiHttp);

let authToken;

// ----------------------------
// BEFORE: connect to Mongo + create test user
// ----------------------------
before(function (done) {
  this.timeout(20000);

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    return done(new Error("MONGODB_URI missing"));
  }

  mongoose
    .connect(mongoUri)
    .then(() => {
      const ts = Date.now();
      const userData = {
        username: `testuser_${ts}`,
        email: `test_${ts}@example.com`,
        password: "Password123!",
        confirmPassword: "Password123!",
      };

      request
        .execute(app)
        .post("/auth/signup")
        .send(userData)
        .end((err, res) => {
          if (err) return done(err);

          expect(res.body).to.have.property("token");
          authToken = res.body.token;

          done();
        });
    })
    .catch((err) => done(err));
});

// ----------------------------
// TEST 1: GET /api/boards
// ----------------------------
it("/api/boards returns success + array", (done) => {
  request
    .execute(app)
    .get("/api/boards")
    .set("Authorization", `JWT ${authToken}`)
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(200);
      expect(res.body).to.have.property("status", "success");
      expect(res.body).to.have.property("data").that.is.an("array");

      const list = res.body.data;
      if (list.length > 0) {
        const b = list[0];

        expect(b).to.have.property("_id");
        expect(b).to.have.property("title");
        expect(b).to.have.property("isOwner");
        expect(b).to.have.property("isJoined");
        expect(b).to.have.property("memberCount");
      }

      done();
    });
});

// ----------------------------
// TEST 2: GET /api/boards/:id (existing board or empty case)
// ----------------------------
it("/api/boards/:id returns board when valid", (done) => {
  request
    .execute(app)
    .get("/api/boards")
    .set("Authorization", `JWT ${authToken}`)
    .end((err, res) => {
      expect(err).to.be.null;

      const boards = res.body.data;
      if (boards.length === 0) return done(); // nothing to test

      const id = boards[0]._id;

      request
        .execute(app)
        .get(`/api/boards/${id}`)
        .set("Authorization", `JWT ${authToken}`)
        .end((err2, res2) => {
          expect(err2).to.be.null;
          expect(res2).to.have.status(200);

          expect(res2.body).to.have.property("status", "success");
          expect(res2.body).to.have.property("data").that.is.an("object");
          expect(res2.body.data).to.have.property("_id", id);

          done();
        });
    });
});

// ----------------------------
// TEST 3: GET /api/boards/:id (404 path)
// ----------------------------
it("/api/boards/:id returns 404 for non-existent id", (done) => {
  const impossible = "507f1f77bcf86cd799439011";

  request
    .execute(app)
    .get(`/api/boards/${impossible}`)
    .set("Authorization", `JWT ${authToken}`)
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(404);
      expect(res.body).to.have.property("status", "error");
      expect(res.body).to.have.property("message").match(/not found/i);
      done();
    });
});
