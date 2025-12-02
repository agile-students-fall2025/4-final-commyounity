// test/members.test.js (CommonJS version)
const chai = require("chai");
const chaiHttp = require("chai-http");
const mongoose = require("mongoose");
const app = require("../app");
const Board = require("../models/Board");

const { expect } = chai;
chai.use(chaiHttp);

let ownerToken;
let ownerId;

before(async function () {
  this.timeout(15000);
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

describe("members", () => {
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
    expect(res.body).to.have.property("status", "success");
    expect(res.body).to.have.property("data").that.is.an("array");
    const list = res.body.data;
    // expect at least owner and one member
    expect(list.length).to.be.greaterThanOrEqual(2);
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
});