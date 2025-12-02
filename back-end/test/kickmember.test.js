import { use, expect } from "chai";
import chaiHttp, { request } from "chai-http";
import mongoose from "mongoose";
import app from "../app.js";
import Board from "../models/Board.js";

use(chaiHttp);

let ownerToken;
let ownerId;
let memberToken;
let memberId;

before(async function () {
  this.timeout(20000);
  const ts = Date.now();

  // owner
  const ownerRes = await request.execute(app).post("/auth/signup").send({
    username: `kmA_${ts}`,
    email: `kmA_${ts}@example.com`,
    password: "Password123!",
    confirmPassword: "Password123!",
  });
  expect(ownerRes).to.have.status(200);
  ownerToken = ownerRes.body.token;
  const ownerProfile = await request
    .execute(app)
    .get("/api/profile")
    .set("Authorization", `JWT ${ownerToken}`);
  ownerId = String(ownerProfile.body.id);

  // member
  const memberRes = await request.execute(app).post("/auth/signup").send({
    username: `kmB_${ts}`,
    email: `kmB_${ts}@example.com`,
    password: "Password123!",
    confirmPassword: "Password123!",
  });
  expect(memberRes).to.have.status(200);
  memberToken = memberRes.body.token;
  const memberProfile = await request
    .execute(app)
    .get("/api/profile")
    .set("Authorization", `JWT ${memberToken}`);
  memberId = String(memberProfile.body.id);
});

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

    const res = await request
      .execute(app)
      .post(`/api/boards/${board._id.toString()}/kick-member`)
      .set("Authorization", `JWT ${ownerToken}`)
      .send({ memberId });

    expect(res).to.have.status(200);
    expect(res.body).to.have.property("status", "success");
    expect(res.body).to.have.property("data");
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

    const res = await request
      .execute(app)
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

    const res = await request
      .execute(app)
      .post(`/api/boards/${board._id.toString()}/kick-member`)
      .set("Authorization", `JWT ${ownerToken}`)
      .send({ memberId: ownerId });

    expect(res).to.have.status(400);
    expect(res.body).to.have.property("status", "error");
  });
});


