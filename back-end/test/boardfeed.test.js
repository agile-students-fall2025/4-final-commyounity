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
        authToken = res.body.token;

        chai
          .request(app)
          .get("/api/boards")
          .set("Authorization", `JWT ${authToken}`)
          .end((err2, res2) => {
            if (err2) return done(err2);

            testBoardId = res2.body.data[0]._id;
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
        expect(res).to.have.status(200);
        expect(res.body).to.be.an("array");
        done();
      });
  });

  it("GET feed returns 500 on bad ObjectId", (done) => {
    chai
      .request(app)
      .get("/api/boards/INVALID_ID/feed")
      .end((err, res) => {
        expect(res).to.have.status(500);
        done();
      });
  });

  it("POST /feed creates a post", (done) => {
    chai
      .request(app)
      .post(`/api/boards/${testBoardId}/feed`)
      .set("Authorization", `JWT ${authToken}`)
      .send({ message: "Test post from Chai" })
      .end((err, res) => {
        expect(res).to.have.status(200);
        testPostId = res.body._id;
        done();
      });
  });

  it("POST /feed returns 400 when message missing", (done) => {
    chai
      .request(app)
      .post(`/api/boards/${testBoardId}/feed`)
      .set("Authorization", `JWT ${authToken}`)
      .send({})
      .end((err, res) => {
        expect(res).to.have.status(400);
        done();
      });
  });

  it("POST /like increments likes", (done) => {
    chai
      .request(app)
      .post(`/api/boards/${testBoardId}/feed/${testPostId}/like`)
      .set("Authorization", `JWT ${authToken}`)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.likes).to.be.a("number");
        done();
      });
  });

  it("POST /like returns 404 for non-existent post", (done) => {
    chai
      .request(app)
      .post(`/api/boards/${testBoardId}/feed/65cc65cc65cc65cc65cc65cc/like`)
      .set("Authorization", `JWT ${authToken}`)
      .end((err, res) => {
        expect(res).to.have.status(404);
        done();
      });
  });

  it("POST /like returns 500 for invalid ID", (done) => {
    chai
      .request(app)
      .post(`/api/boards/${testBoardId}/feed/INVALID/like`)
      .set("Authorization", `JWT ${authToken}`)
      .end((err, res) => {
        expect(res).to.have.status(500);
        done();
      });
  });

  it("DELETE /feed/:postId deletes post", (done) => {
    chai
      .request(app)
      .delete(`/api/boards/${testBoardId}/feed/${testPostId}`)
      .set("Authorization", `JWT ${authToken}`)
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });

  it("DELETE returns 404 for non-existent post", (done) => {
    chai
      .request(app)
      .delete(`/api/boards/${testBoardId}/feed/65cc65cc65cc65cc65cc65cc`)
      .set("Authorization", `JWT ${authToken}`)
      .end((err, res) => {
        expect(res).to.have.status(404);
        done();
      });
  });

  it("DELETE returns 500 for invalid ObjectId", (done) => {
    chai
      .request(app)
      .delete(`/api/boards/${testBoardId}/feed/INVALID`)
      .set("Authorization", `JWT ${authToken}`)
      .end((err, res) => {
        expect(res).to.have.status(500);
        done();
      });
  });
});
