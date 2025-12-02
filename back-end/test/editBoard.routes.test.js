import { use, expect } from "chai";
import chaiHttp, { request } from "chai-http";
import app from "../app.js";
import mongoose from "mongoose";
import Board from "../models/Board.js";

use(chaiHttp);

let jwtToken;

before(async function () {
  this.timeout(15000);
  const ts = Date.now();
  const payload = {
    username: `edit_user_${ts}`,
    email: `edit_${ts}@example.com`,
    password: "Password123!",
    confirmPassword: "Password123!",
  };
  const res = await request.execute(app).post("/auth/signup").send(payload);
  expect(res).to.have.status(200);
  jwtToken = res.body.token;
});

it("POST /api/boards/:id/edit returns 404 for non-existent board", (done) => {
  const missingId = "507f1f77bcf86cd799439011";
  request
    .execute(app)
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
  // create a board owned by current user
  const me = await request
    .execute(app)
    .get("/api/profile")
    .set("Authorization", `JWT ${jwtToken}`);
  expect(me).to.have.status(200);
  const ownerId = String(me.body.id);

  const board = await Board.create({
    title: "Original Title",
    descriptionLong: "before edit",
    owner: new mongoose.Types.ObjectId(ownerId),
    members: [new mongoose.Types.ObjectId(ownerId)],
  });

  const res = await request
    .execute(app)
    .post(`/api/boards/${board._id.toString()}/edit`)
    .set("Authorization", `JWT ${jwtToken}`)
    .type("form")
    .field("title", "Edited Title");

  expect(res).to.have.status(200);
  expect(res.body).to.have.property("status", "updated");
  expect(res.body).to.have.property("data");
  expect(res.body.data).to.have.property("title", "Edited Title");
});


