import { use, expect } from "chai";
import chaiHttp, { request } from "chai-http";
import mongoose from "mongoose";
import app from "../app.js";
import Board from "../models/Board.js";

use(chaiHttp);

let joinerToken;

before(async function () {
  this.timeout(15000);
  const ts = Date.now();
  const payload = {
    username: `jn_${ts}`,
    email: `jn_${ts}@example.com`,
    password: "Password123!",
    confirmPassword: "Password123!",
  };
  const res = await request.execute(app).post("/auth/signup").send(payload);
  expect(res).to.have.status(200);
  joinerToken = res.body.token;
});

describe("joinBoard", () => {
  it("POST /api/boards/:id/join -> 400 (invalid id)", (done) => {
    request
      .execute(app)
      .post("/api/boards/not-a-valid-id/join")
      .set("Authorization", `JWT ${joinerToken}`)
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        expect(res.body).to.have.property("status", "error");
        done();
      });
  });

  it("POST /api/boards/:id/join -> 200 (success)", async function () {
    this.timeout(15000);

    // Create owner and a board
    const ts = Date.now();
    const ownerSignup = await request
      .execute(app)
      .post("/auth/signup")
      .send({
        username: `owner_${ts}`,
        email: `owner_${ts}@example.com`,
        password: "Password123!",
        confirmPassword: "Password123!",
      });
    expect(ownerSignup).to.have.status(200);
    const ownerToken = ownerSignup.body.token;

    const me = await request
      .execute(app)
      .get("/api/profile")
      .set("Authorization", `JWT ${ownerToken}`);
    const ownerId = String(me.body.id);

    const board = await Board.create({
      title: "Joinable Board",
      owner: new mongoose.Types.ObjectId(ownerId),
      members: [new mongoose.Types.ObjectId(ownerId)],
    });

    const res = await request
      .execute(app)
      .post(`/api/boards/${board._id.toString()}/join`)
      .set("Authorization", `JWT ${joinerToken}`);

    expect(res).to.have.status(200);
    expect(res.body).to.have.property("status", "success");
    expect(res.body).to.have.property("data");
    expect(res.body.data).to.have.property("memberCount").that.is.a("number");
  });
});


