// test/joinboard.test.js (CommonJS version)
const chai = require("chai");
const chaiHttp = require("chai-http");
const mongoose = require("mongoose");

const app = require("../app");
const Board = require("../models/Board");
const User = require("../models/User");

const { expect } = chai;
chai.use(chaiHttp);

let joinerToken;

//
// ---------- GLOBAL BEFORE ----------
// (creates the joiner user)
// -----------------------------------
before(async function () {
  this.timeout(15000);

  const ts = Date.now();
  const payload = {
    username: `jn_${ts}`,
    email: `jn_${ts}@example.com`,
    password: "Password123!",
    confirmPassword: "Password123!",
  };

  const res = await chai.request(app).post("/auth/signup").send(payload);
  expect(res).to.have.status(200);

  joinerToken = res.body.token;
});

//
// ============ TEST SUITE START ============
//
describe("joinBoard", () => {
  //
  // ----------- TEST 1: INVALID ID ----------
  //
  it("POST /api/boards/:id/join -> 400 (invalid id)", (done) => {
    chai
      .request(app)
      .post("/api/boards/not-a-valid-id/join")
      .set("Authorization", `JWT ${joinerToken}`)
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        expect(res.body).to.have.property("status", "error");
        done();
      });
  });

  //
  // ----------- TEST 2: SUCCESS JOIN ----------
  //
  it("POST /api/boards/:id/join -> 200 (success)", async function () {
    this.timeout(15000);

    const ts = Date.now();

    // Create the board owner
    const ownerSignup = await chai
      .request(app)
      .post("/auth/signup")
      .send({
        username: `owner_${ts}`,
        email: `owner_${ts}@example.com`,
        password: "Password123!",
        confirmPassword: "Password123!",
      });

    expect(ownerSignup).to.have.status(200);
    const ownerToken = ownerSignup.body.token;

    // Get owner profile
    const me = await chai
      .request(app)
      .get("/api/profile")
      .set("Authorization", `JWT ${ownerToken}`);

    const ownerId = String(me.body.id);

    // Create a joinable board
    const board = await Board.create({
      title: "Joinable Board",
      owner: new mongoose.Types.ObjectId(ownerId),
      members: [new mongoose.Types.ObjectId(ownerId)],
    });

    // Join request
    const res = await chai
      .request(app)
      .post(`/api/boards/${board._id.toString()}/join`)
      .set("Authorization", `JWT ${joinerToken}`);

    expect(res).to.have.status(200);
    expect(res.body).to.have.property("status", "success");
    expect(res.body).to.have.property("data");
    expect(res.body.data)
      .to.have.property("memberCount")
      .that.is.a("number");
  });

  //
  // ----------- CLEANUP AFTER ALL TESTS ----------
  //
  after(async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Let Atlas finalize writes
    await new Promise((res) => setTimeout(res, 150));

    console.log("[JOINBOARD CLEANUP] running...");

    // remove joiner & board owner users
    const deletedUsers = await User.deleteMany({
      $or: [
        { username: /^jn_/i },
        { username: /^owner_/i },
        { email: /^jn_.*@example\.com$/i },
        { email: /^owner_.*@example\.com$/i },
      ],
    });

    console.log("[JOINBOARD CLEANUP] deleted users =>", deletedUsers.deletedCount);

    // remove joinable boards from this test
    const deletedBoards = await Board.deleteMany({
      title: "Joinable Board",
    });

    console.log("[JOINBOARD CLEANUP] deleted boards =>", deletedBoards.deletedCount);
  });
});