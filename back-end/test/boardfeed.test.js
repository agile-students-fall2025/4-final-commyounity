// test/boardfeed.test.js (CommonJS version)
const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("../app");

const { expect } = chai;
chai.use(chaiHttp);

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

    chai
      .request(app)
      .post("/auth/signup")
      .send(userData)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.property("token");
        authToken = res.body.token;

        chai
          .request(app)
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
    chai
      .request(app)
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
    chai
      .request(app)
      .post(`/api/boards/${testBoardId}/feed`)
      .set("Authorization", `JWT ${authToken}`)
      .send({ message: "Test post from Chai" })
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body).to.have.property("message", "Test post from Chai");
        expect(res.body).to.have.property("id");
        testPostId = res.body.id;
        done();
      });
  });

  it("POST /api/boards/:id/feed/:postId/like increments likes", (done) => {
    chai
      .request(app)
      .post(`/api/boards/${testBoardId}/feed/${testPostId}/like`)
      .set("Authorization", `JWT ${authToken}`)
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body).to.have.property("likes").that.is.a("number").above(-1);
        done();
      });
  });

  it("DELETE /api/boards/:id/feed/:postId deletes post", (done) => {
    chai
      .request(app)
      .delete(`/api/boards/${testBoardId}/feed/${testPostId}`)
      .set("Authorization", `JWT ${authToken}`)
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
      });
  });
});