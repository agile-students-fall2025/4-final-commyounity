// test/editBoard.routes.test.js (CommonJS version)
const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("../app");
const mongoose = require("mongoose");
const Board = require("../models/Board");

const { expect } = chai;
chai.use(chaiHttp);

let jwtToken;
let userId;
let boardId;
let tempFiles = [];

before(async function () {
  this.timeout(15000);
  const ts = Date.now();
  const payload = {
    username: `edit_user_${ts}`,
    email: `edit_${ts}@example.com`,
    password: "Password123!",
    confirmPassword: "Password123!",
  };
  const res = await chai.request(app).post("/auth/signup").send(payload);
  expect(res).to.have.status(200);
  jwtToken = res.body.token;
  userId = res.body.id || res.body._id;

  // fetch profile to ensure we have id
  const me = await chai
    .request(app)
    .get("/api/profile")
    .set("Authorization", `JWT ${jwtToken}`);
  expect(me).to.have.status(200);
  userId = String(me.body.id);
});

beforeEach(async () => {
  const ownerId = new mongoose.Types.ObjectId(userId);
  const board = await Board.create({
    title: "Original Title",
    descriptionLong: "before edit",
    owner: ownerId,
    members: [ownerId],
  });
  boardId = board._id.toString();
});

afterEach(async () => {
  if (boardId) {
    await Board.deleteOne({ _id: boardId });
    boardId = null;
  }
  tempFiles.forEach((file) => {
    try {
      fs.unlinkSync(file);
    } catch (e) {
      /* ignore */
    }
  });
  tempFiles = [];
});

it("POST /api/boards/:id/edit returns 404 for non-existent board", (done) => {
  const missingId = "507f1f77bcf86cd799439011";
  chai
    .request(app)
    .post(`/api/boards/${missingId}/edit`)
    .set("Authorization", `JWT ${jwtToken}`)
    .type("form")
    .field("title", "New Title")
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(404);
      expect(res.body).to.have.property("status", "error");
      done();
    });
});

it("POST /api/boards/:id/edit updates title without file and returns 200", async function () {
  this.timeout(15000);

  const res = await chai
    .request(app)
    .post(`/api/boards/${boardId}/edit`)
    .set("Authorization", `JWT ${jwtToken}`)
    .type("form")
    .field("title", "Edited Title");

  expect(res).to.have.status(200);
  expect(res.body).to.have.property("status", "updated");
  expect(res.body).to.have.property("data");
  expect(res.body.data).to.have.property("title", "Edited Title");
});

after(() => {
  tempFiles.forEach((file) => {
    try {
      fs.unlinkSync(file);
    } catch (e) {
      /* ignore */
    }
  });
});
