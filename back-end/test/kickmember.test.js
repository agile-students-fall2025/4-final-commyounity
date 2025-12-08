// test/kickmember.test.js (CommonJS version)
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
let memberToken;
let memberId;

// -------------------------
// BEFORE: create owner + member
// -------------------------
before(async function () {
  this.timeout(20000);

  const ts = Date.now();

  // OWNER
  const ownerRes = await chai.request(app).post("/auth/signup").send({
    username: `kmA_${ts}`,
    email: `kmA_${ts}@example.com`,
    password: "Password123!",
    confirmPassword: "Password123!",
  });
  expect(ownerRes).to.have.status(200);
  ownerToken = ownerRes.body.token;

  const ownerProfile = await chai
    .request(app)
    .get("/api/profile")
    .set("Authorization", `JWT ${ownerToken}`);

  ownerId = String(ownerProfile.body.id);

  // MEMBER
  const memberRes = await chai.request(app).post("/auth/signup").send({
    username: `kmB_${ts}`,
    email: `kmB_${ts}@example.com`,
    password: "Password123!",
    confirmPassword: "Password123!",
  });
  expect(memberRes).to.have.status(200);
  memberToken = memberRes.body.token;

  const memberProfile = await chai
    .request(app)
    .get("/api/profile")
    .set("Authorization", `JWT ${memberToken}`);

  memberId = String(memberProfile.body.id);
});

// -------------------------
// TEST SUITE
// -------------------------
describe("kickMember", () => {
  it("owner can kick an existing member -> 200", async function () {
    this.timeout(15000);

    const board = await Board.create({
      title: "Kick Test Board",
      owner: new mongoose.Types.ObjectId(ownerId),
      members: [
        new mongoose.Types.ObjectId(ownerId),
        new mongoose.Types.ObjectId(memberId),
      ],
    });

    const res = await chai
      .request(app)
      .post(`/api/boards/${board._id.toString()}/kick-member`)
      .set("Authorization", `JWT ${ownerToken}`)
      .send({ memberId });

    expect(res).to.have.status(200);
    expect(res.body).to.have.property("status", "success");
    expect(res.body.data).to.have.property("boardId", board._id.toString());
  });

  it("non-owner cannot kick -> 403", async function () {
    this.timeout(15000);

    const board = await Board.create({
      title: "Forbidden Kick",
      owner: new mongoose.Types.ObjectId(ownerId),
      members: [
        new mongoose.Types.ObjectId(ownerId),
        new mongoose.Types.ObjectId(memberId),
      ],
    });

    const res = await chai
      .request(app)
      .post(`/api/boards/${board._id.toString()}/kick-member`)
      .set("Authorization", `JWT ${memberToken}`)
      .send({ memberId: ownerId });

    expect(res).to.have.status(403);
    expect(res.body).to.have.property("status", "error");
  });

  it("cannot kick owner -> 400", async function () {
    this.timeout(15000);

    const board = await Board.create({
      title: "Cannot Kick Owner",
      owner: new mongoose.Types.ObjectId(ownerId),
      members: [new mongoose.Types.ObjectId(ownerId)],
    });

    const res = await chai
      .request(app)
      .post(`/api/boards/${board._id.toString()}/kick-member`)
      .set("Authorization", `JWT ${ownerToken}`)
      .send({ memberId: ownerId });

    expect(res).to.have.status(400);
    expect(res.body).to.have.property("status", "error");
  });

  // -------------------------
  // CLEANUP AFTER ALL TESTS
  // -------------------------
  after(async () => {
    if (mongoose.connection.readyState !== 1) return;

    // allow Atlas to flush writes
    await new Promise((res) => setTimeout(res, 150));

    console.log("[KICKMEMBER CLEANUP] running...");

    // remove test users
    const deletedUsers = await User.deleteMany({
      $or: [
        { username: /^kmA_/i },
        { username: /^kmB_/i },
        { email: /^kmA_.*@example\.com$/i },
        { email: /^kmB_.*@example\.com$/i },
      ],
    });

    console.log("[KICKMEMBER CLEANUP] deleted users =>", deletedUsers.deletedCount);

    // remove only boards created in this test
    const deletedBoards = await Board.deleteMany({
      title: { $in: ["Kick Test Board", "Forbidden Kick", "Cannot Kick Owner"] },
    });

    console.log(
      "[KICKMEMBER CLEANUP] deleted boards =>",
      deletedBoards.deletedCount
    );
  });
});