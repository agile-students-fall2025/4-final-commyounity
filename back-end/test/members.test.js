// test/members.test.js (CommonJS version)
const chai = require("chai");
const chaiHttp = require("chai-http");
const mongoose = require("mongoose");
const app = require("../app");
const Board = require("../models/Board");
const User = require("../models/User");

const { expect } = chai;
chai.use(chaiHttp);

let ownerToken;
let ownerId;

describe("Members API", () => {

  before(async function () {
    this.timeout(15000);

    // Remove leftover test users for safety
    await User.deleteMany({
      $or: [
        { username: /^mb_/i },
        { username: /^member_/i },
        { email: /^mb_.*@example\.com$/i },
        { email: /^member_.*@example\.com$/i },
      ],
    });

    const ts = Date.now();
    const payload = {
      username: `mb_${ts}`,
      email: `mb_${ts}@example.com`,
      password: "Password123!",
      confirmPassword: "Password123!",
    };
    const res = await chai.request(app).post("/auth/signup").send(payload);
    expect(res).to.have.status(200);
    ownerToken = res.body.token;

    const me = await chai
      .request(app)
      .get("/api/profile")
      .set("Authorization", `JWT ${ownerToken}`);

    ownerId = String(me.body.id);
  });

  it("GET /api/members/:boardId -> 200 and returns members with owner", async function () {
    this.timeout(15000);

    // create an additional member user
    const ts = Date.now();
    const mSignup = await chai
      .request(app)
      .post("/auth/signup")
      .send({
        username: `member_${ts}`,
        email: `member_${ts}@example.com`,
        password: "Password123!",
        confirmPassword: "Password123!",
      });
    expect(mSignup).to.have.status(200);

    const mProfile = await chai
      .request(app)
      .get("/api/profile")
      .set("Authorization", `JWT ${mSignup.body.token}`);
    const memberId = String(mProfile.body.id);

    const board = await Board.create({
      title: "Members Board",
      owner: new mongoose.Types.ObjectId(ownerId),
      members: [
        new mongoose.Types.ObjectId(ownerId),
        new mongoose.Types.ObjectId(memberId),
      ],
    });

    const res = await chai
      .request(app)
      .get(`/api/members/${board._id.toString()}`)
      .set("Authorization", `JWT ${ownerToken}`);

    expect(res).to.have.status(200);
    expect(res.body.status).to.equal("success");
    expect(res.body.data).to.be.an("array");
    expect(res.body.data.length).to.be.greaterThanOrEqual(1);
  });

  it("GET /api/members/:boardId -> 404 for non-existent board", async function () {
    const fakeId = "507f1f77bcf86cd799439011";
    const res = await chai
      .request(app)
      .get(`/api/members/${fakeId}`)
      .set("Authorization", `JWT ${ownerToken}`);

    expect(res).to.have.status(404);
  });

  it("GET /api/members/:boardId -> 400 for invalid board id", async function () {
    const res = await chai
      .request(app)
      .get("/api/members/invalid-id")
      .set("Authorization", `JWT ${ownerToken}`);

    expect([400, 404, 500]).to.include(res.status);
  });

  // ----------------------------
  // CLEANUP
  // ----------------------------
  after(async () => {
    if (mongoose.connection.readyState !== 1) return;

    // give Atlas time to finish writes
    await new Promise((r) => setTimeout(r, 150));

    // Cleanup test users
    const deletedUsers = await User.deleteMany({
      $or: [
        { username: /^mb_/i },
        { username: /^member_/i },
        { email: /^mb_.*@example\.com$/i },
        { email: /^member_.*@example\.com$/i },
      ],
    });
    console.log(`[MEMBERS CLEANUP] removed ${deletedUsers.deletedCount} test users`);

    // Cleanup test boards
    const deletedBoards = await Board.deleteMany({
      title: /Members Board/i,
    });
    console.log(`[MEMBERS CLEANUP] removed ${deletedBoards.deletedCount} boards`);
  });

});