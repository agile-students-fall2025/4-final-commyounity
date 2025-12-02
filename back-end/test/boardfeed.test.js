import { use, expect } from "chai";
import { default as chaiHttp, request } from "chai-http";
import app from "../app.js";

use(chaiHttp);

describe("BoardFeed API", () => {
  let authToken;
  let testBoardId;
  let testPostId;

  before((done) => {
    const ts = Date.now();
    const userData = {
      username: `feedtester_${ts}`,
      email: `feedtest_${ts}@example.com`,
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

        request
          .execute(app)
          .get("/api/boards")
          .set("Authorization", `JWT ${authToken}`)
          .end((err2, res2) => {
            expect(err2).to.be.null;
            expect(res2).to.have.status(200);
            expect(res2.body).to.have.property("data").that.is.an("array");

            if (res2.body.data.length === 0) {
              return done(new Error("No boards exist for testing"));
            }

            testBoardId = res2.body.data[0]._id || res2.body.data[0].id;
            done();
          });
      });
  });

  it("GET /api/boards/:id/feed returns posts", (done) => {
    request
      .execute(app)
      .get(`/api/boards/${testBoardId}/feed`)
      .set("Authorization", `JWT ${authToken}`)
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body).to.be.an("array");
        done();
      });
  });

  it("POST /api/boards/:id/feed creates a new post", (done) => {
    request
      .execute(app)
      .post(`/api/boards/${testBoardId}/feed`)
      .set("Authorization", `JWT ${authToken}`)
      .send({ message: "Test post from Chai" })
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body).to.have.property("message", "Test post from Chai");
        expect(res.body).to.have.property("id");
        testPostId = res.body.id; // save for later tests
        done();
      });
  });

  it("POST /api/boards/:id/feed/:postId/like increments likes", (done) => {
    request
      .execute(app)
      .post(`/api/boards/${testBoardId}/feed/${testPostId}/like`)
      .set("Authorization", `JWT ${authToken}`)
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body)
          .to.have.property("likes")
          .that.is.a("number")
          .above(-1);
        done();
      });
  });

  it("DELETE /api/boards/:id/feed/:postId deletes post", (done) => {
    request
      .execute(app)
      .delete(`/api/boards/${testBoardId}/feed/${testPostId}`)
      .set("Authorization", `JWT ${authToken}`)
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body).to.have.property("success").that.is.true;
        done();
      });
  });

  it("POST /api/boards/:id/feed fails without message", (done) => {
    request
      .execute(app)
      .post(`/api/boards/${testBoardId}/feed`)
      .set("Authorization", `JWT ${authToken}`)
      .send({})
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        expect(res.body).to.have.property("error");
        done();
      });
  });

  it("GET /api/boards/:invalidId/feed returns empty array for unknown board", (done) => {
    request
      .execute(app)
      .get("/api/boards/someInvalidId/feed")
      .set("Authorization", `JWT ${authToken}`)
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body).to.be.an("array");
        expect(res.body).to.have.length(0);
        done();
      });
  });
});
