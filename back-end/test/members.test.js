import { use, expect } from "chai";
import chaiHttp, { request } from "chai-http";
import mongoose from "mongoose";
import app from "../app.js";
import Board from "../models/Board.js";

use(chaiHttp);

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
  const res = await request.execute(app).post("/auth/signup").send(payload);
  expect(res).to.have.status(200);
  ownerToken = res.body.token;

  const me = await request
    .execute(app)
    .get("/api/profile")
    .set("Authorization", `JWT ${ownerToken}`);
  ownerId = String(me.body.id);
});

describe("members", () => {
  it("GET /api/members/:boardId -> 200 and returns members with owner", async function () {
    this.timeout(15000);

    // create an additional member user
    const ts = Date.now();
    const mSignup = await request
      .execute(app)
      .post("/auth/signup")
      .send({
        username: `member_${ts}`,
        email: `member_${ts}@example.com`,
        password: "Password123!",
        confirmPassword: "Password123!",
      });
    expect(mSignup).to.have.status(200);

    const mProfile = await request
      .execute(app)
      .get("/api/profile")
      .set("Authorization", `JWT ${mSignup.body.token}`);
    const memberId = String(mProfile.body.id);

    const board = await Board.create({
      title: "Members Board",
      owner: new mongoose.Types.ObjectId(ownerId),
      members: [new mongoose.Types.ObjectId(ownerId), new mongoose.Types.ObjectId(memberId)],
    });

    const res = await request
      .execute(app)
      .get(`/api/members/${board._id.toString()}`)
      .set("Authorization", `JWT ${ownerToken}`);

    expect(res).to.have.status(200);
    expect(res.body).to.have.property("status", "success");
    expect(res.body).to.have.property("data").that.is.an("array");
    const list = res.body.data;
    // expect at least owner and one member
    expect(list.length).to.be.greaterThanOrEqual(2);
    const usernames = list.map((u) => u.username);
    expect(usernames).to.include.members([mProfile.body.username, (await request.execute(app).get("/api/profile").set("Authorization", `JWT ${ownerToken}`)).body.username]);
  });
});


