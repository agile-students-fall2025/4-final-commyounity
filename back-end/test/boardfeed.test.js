import { use, expect } from "chai";
import chaiHttp from "chai-http";
import app from "../app.js";

use(chaiHttp);

describe("BoardFeed API", () => {
  let testBoardId;
  let testPostId;

  before((done) => {
    chai
      .request(app)
      .get("/api/boards")
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body).to.have.property("data").that.is.an("array");

        if (res.body.data.length === 0) {
          return done(new Error("No boards exist for testing"));
        }

        testBoardId = res.body.data[0].id;
        done();
      });
  });

  it("GET /api/boards/:id/feed returns posts", (done) => {
    chai
      .request(app)
      .get(`/api/boards/${testBoardId}/feed`)
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
    chai
      .request(app)
      .post(`/api/boards/${testBoardId}/feed/${testPostId}/like`)
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
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body).to.have.property("success").that.is.true;
        done();
      });
  });

  it("POST /api/boards/:id/feed fails without message", (done) => {
    chai
      .request(app)
      .post(`/api/boards/${testBoardId}/feed`)
      .send({})
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        expect(res.body).to.have.property("error");
        done();
      });
  });

  it("GET /api/boards/:invalidId/feed returns 404", (done) => {
    chai
      .request(app)
      .get(`/api/boards/999999/feed`)
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(404);
        expect(res.body).to.have.property("error");
        done();
      });
  });
});
