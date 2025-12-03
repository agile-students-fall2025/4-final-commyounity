// test/browseboard.test.js (CommonJS)
const chai = require("chai");
const chaiHttp = require("chai-http");
const sinon = require("sinon");
const mongoose = require("mongoose");
const app = require("../app");
const Board = require("../models/Board");

const { expect } = chai;
chai.use(chaiHttp);

let userToken;
let userId;

afterEach(() => {
  sinon.restore();
});

before(async function () {
  this.timeout(20000);

  const ts = Date.now();

  // Create user
  const signup = await chai
    .request(app)
    .post("/auth/signup")
    .send({
      username: `br_${ts}`,
      email: `browse_${ts}@example.com`,
      password: "Password123!",
      confirmPassword: "Password123!",
    });

  expect(signup).to.have.status(200);
  userToken = signup.body.token;

  // Fetch user profile to get ID
  const me = await chai
    .request(app)
    .get("/api/profile")
    .set("Authorization", `JWT ${userToken}`);

  userId = String(me.body.id);
});

describe("Browse Boards API", () => {
  it("GET /api/browse/boards returns list of boards excluding user's", async function () {
    this.timeout(15000);

    const res = await chai
      .request(app)
      .get("/api/browse/boards")
      .set("Authorization", `JWT ${userToken}`);

    expect(res).to.have.status(200);
    expect(res.body).to.have.property("data").that.is.an("array");
  });

  it("GET /api/browse/boards does not return boards owned by user", async function () {
    this.timeout(15000);

    // Create board owned by user
    const createdBoard = await Board.create({
      title: "UserOwnedBoard",
      owner: new mongoose.Types.ObjectId(userId),
      members: [new mongoose.Types.ObjectId(userId)],
    });

    const res = await chai
      .request(app)
      .get("/api/browse/boards")
      .set("Authorization", `JWT ${userToken}`);

    expect(res).to.have.status(200);

    // Ensure board does NOT appear in suggestions
    const titles = res.body.data.map(b => b.title);
    expect(titles.includes("UserOwnedBoard")).to.be.false;
  });

  it("GET /api/browse/boards does not return boards where user is a member", async function () {
    this.timeout(15000);

    // Create board where user is member but not owner
    const createdBoard = await Board.create({
      title: "UserMemberBoard",
      owner: new mongoose.Types.ObjectId(),
      members: [new mongoose.Types.ObjectId(userId)],
    });

    const res = await chai
      .request(app)
      .get("/api/browse/boards")
      .set("Authorization", `JWT ${userToken}`);

    expect(res).to.have.status(200);

    // Ensure board does NOT appear
    const titles = res.body.data.map(b => b.title);
    expect(titles.includes("UserMemberBoard")).to.be.false;
  });
});

// Clean up the test boards
after(async () => {
  if (mongoose.connection.readyState === 1) {
    await Board.deleteMany({
      title: { $in: ["UserOwnedBoard", "UserMemberBoard"] }
    });
  }
});

it("returns error JSON when Board.find throws (covers lines 43-49)", async function () {
  this.timeout(10000);

  // Force throw to enter the catch block
  const findStub = sinon.stub(Board, "find").throws(new Error("FORCED_FAIL"));

  const res = await chai
    .request(app)
    .get("/api/browse/boards")
    .set("Authorization", `JWT ${userToken}`);

  expect(res).to.have.status(500);
  expect(res.body).to.have.property("status", "error");
  expect(res.body).to.have.property("message", "Failed to load suggested boards");
  expect(res.body).to.have.property("error").that.includes("FORCED_FAIL");

  findStub.restore();
});
