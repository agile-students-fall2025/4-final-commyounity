// test/browseboard.test.js
const chai = require("chai");
const chaiHttp = require("chai-http");
const mongoose = require("mongoose");
const sinon = require("sinon");
const app = require("../app");
const Board = require("../models/Board");
const User = require("../models/User");

const { expect } = chai;
chai.use(chaiHttp);

describe("Browse Boards API", function() {
  this.timeout(20000);

  let userToken;
  let userId;
  const createdBoardIds = [];

  before(async function() {
    const ts = Date.now();
    const signup = await chai.request(app).post("/auth/signup").send({
      username: `br_${ts}`,
      email: `browse_${ts}@example.com`,
      password: "Password123!",
      confirmPassword: "Password123!"
    });
    expect(signup).to.have.status(200);
    userToken = signup.body.token;

    const me = await chai
      .request(app)
      .get("/api/profile")
      .set("Authorization", `JWT ${userToken}`);
    userId = String(me.body.id);
  });

  after(async function() {
    // cleanup test boards
    if (createdBoardIds.length > 0) {
      await Board.deleteMany({ _id: { $in: createdBoardIds } });
    }
    // cleanup test user
    await User.deleteMany({ _id: userId });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("GET /api/browse/boards returns list of boards", async function() {
    const res = await chai
      .request(app)
      .get("/api/browse/boards")
      .set("Authorization", `JWT ${userToken}`);
    expect(res).to.have.status(200);
    expect(res.body).to.have.property("data").that.is.an("array");
  });

  it("does not return boards owned by user", async function() {
    const board = await Board.create({
      title: "UserOwnedBoard",
      owner: new mongoose.Types.ObjectId(userId),
      members: [new mongoose.Types.ObjectId(userId)]
    });
    createdBoardIds.push(board._id);

    const res = await chai
      .request(app)
      .get("/api/browse/boards")
      .set("Authorization", `JWT ${userToken}`);
    expect(res).to.have.status(200);
    const titles = res.body.data.map((b) => b.title);
    expect(titles.includes("UserOwnedBoard")).to.be.false;
  });

  it("does not return boards where user is a member", async function() {
    const board = await Board.create({
      title: "UserMemberBoard",
      owner: new mongoose.Types.ObjectId(), // some other owner
      members: [new mongoose.Types.ObjectId(userId)]
    });
    createdBoardIds.push(board._id);

    const res = await chai
      .request(app)
      .get("/api/browse/boards")
      .set("Authorization", `JWT ${userToken}`);
    expect(res).to.have.status(200);
    const titles = res.body.data.map((b) => b.title);
    expect(titles.includes("UserMemberBoard")).to.be.false;
  });

  // -------- ERROR CASE: FORCED FAIL --------
it("returns error JSON when Board.find throws (covers lines 43–49)", async function () {
  this.timeout(10000);

  // 👇 prevent the noisy [BROWSE BOARDS ERROR] log
  const consoleStub = sinon.stub(console, "error");

  const findStub = sinon.stub(Board, "find").throws(new Error("FORCED_FAIL"));

  const res = await chai
    .request(app)
    .get("/api/browse/boards")
    .set("Authorization", `JWT ${userToken}`);

  expect(res).to.have.status(500);
  expect(res.body).to.have.property("status", "error");
  expect(res.body).to.have.property("message", "Failed to load suggested boards");
  expect(res.body).to.have.property("error").that.includes("FORCED_FAIL");

  // no need to manually restore, afterEach() already calls sinon.restore()
});
});