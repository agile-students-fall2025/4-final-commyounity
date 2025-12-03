// test/boards.test.js (CommonJS version)
const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("../app");

const { expect } = chai;
chai.use(chaiHttp);

let authToken;

// ----------------------------
// BEFORE: create test user (DB connection handled by global setup)
// ----------------------------
before(function (done) {
  this.timeout(20000);

  const ts = Date.now();
  const userData = {
    username: `testuser_${ts}`,
    email: `test_${ts}@example.com`,
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
      done();
    });
});

// ----------------------------
// TESTS
// ----------------------------
describe("Boards API", () => {
  it("GET /api/boards returns a list of boards", (done) => {
    chai
      .request(app)
      .get("/api/boards")
      .set("Authorization", `JWT ${authToken}`)
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body).to.have.property("data").that.is.an("array");
        done();
      });
  });

  it("GET /api/boards/:id returns a single board", (done) => {
    chai
      .request(app)
      .get("/api/boards")
      .set("Authorization", `JWT ${authToken}`)
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);

        const boards = res.body.data;
        if (!boards || boards.length === 0) {
          return done(); // no boards to test
        }

        const boardId = boards[0]._id || boards[0].id;

        chai
          .request(app)
          .get(`/api/boards/${boardId}`)
          .set("Authorization", `JWT ${authToken}`)
          .end((err2, res2) => {
            expect(err2).to.be.null;
            expect(res2).to.have.status(200);
            expect(res2.body).to.have.property("data");
            done();
          });
      });
  });

  it("GET /api/boards/:id returns 404 for non-existent board", (done) => {
    const fakeId = "507f1f77bcf86cd799439011";
    chai
      .request(app)
      .get(`/api/boards/${fakeId}`)
      .set("Authorization", `JWT ${authToken}`)
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(404);
        done();
      });
  });
});
