// test/browseboard.test.js (CommonJS version)
const chai = require("chai");
const chaiHttp = require("chai-http");
const mongoose = require("mongoose");
const app = require("../app");
const Board = require("../models/Board");

const { expect } = chai;
chai.use(chaiHttp);

let userToken;
let userId;

before(async function () {
  this.timeout(20000);
  const ts = Date.now();

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

  const me = await chai
    .request(app)
    .get("/api/profile")
    .set("Authorization", `JWT ${userToken}`);
  userId = String(me.body.id);
});

describe("Browse Boards API", () => {
  it("GET /api/browse returns boards", async function () {
    this.timeout(15000);

    const res = await chai
      .request(app)
      .get("/api/browse")
      .set("Authorization", `JWT ${userToken}`);

    expect(res).to.have.status(200);
    expect(res.body).to.have.property("data").that.is.an("array");
  });

  it("GET /api/browse with search query filters boards", async function () {
    this.timeout(15000);

    // Create a board with specific title
    await Board.create({
      title: "UniqueSearchableBoard",
      owner: new mongoose.Types.ObjectId(userId),
      members: [new mongoose.Types.ObjectId(userId)],
    });

    const res = await chai
      .request(app)
      .get("/api/browse?search=UniqueSearchableBoard")
      .set("Authorization", `JWT ${userToken}`);

    expect(res).to.have.status(200);
    expect(res.body).to.have.property("data").that.is.an("array");
  });
});

