const chai = require("chai");
const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const User = require("../models/User");
const Friend = require("../models/Friend");

const { expect } = chai;

let token;
let ownerId;

const authGet = (path) =>
  request(app).get(path).set("Authorization", `JWT ${token}`);

describe("Friends routes (JWT)", () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Friend.deleteMany({});

    const user = await new User({
      username: `frt_${Math.floor(Math.random() * 1e6)}`,
      email: `frt_${Date.now()}@example.com`,
      password: "password123",
      name: "Friend Tester",
    }).save();
    token = user.generateJWT();
    ownerId = user._id;

    // Seed a couple of friends for this owner
    await Friend.insertMany([
      {
        owner: ownerId,
        contact: new mongoose.Types.ObjectId(),
        username: "test.user",
        first_name: "Test",
        last_name: "User",
        status: "accepted",
      },
      {
        owner: ownerId,
        contact: new mongoose.Types.ObjectId(),
        username: "alex",
        first_name: "Alex",
        last_name: "Smith",
        status: "accepted",
      },
    ]);
  });

  it("/api/friends responds with a JSON list of friends", async () => {
    const res = await authGet("/api/friends");
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("data").that.is.an("array");
    expect(res.body).to.have.property("meta").that.includes.keys([
      "total",
      "count",
      "cacheSource",
    ]);
  });

  it("/api/friends items each include an id", async () => {
    const res = await authGet("/api/friends");
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("data").that.is.an("array");
    for (const friend of res.body.data) {
      expect(friend).to.be.an("object");
      expect(friend).to.have.property("id");
    }
  });

  it("/api/friends filters by username when requested", async () => {
    const res = await authGet("/api/friends");
    expect(res.status).to.equal(200);
    const first = res.body?.data?.[0];
    expect(first, "Expected at least one friend to test filtering").to.be.an(
      "object"
    );
    const username = encodeURIComponent(String(first.username || "").trim());
    expect(username.length).to.be.greaterThan(0);

    const res2 = await authGet(`/api/friends?username=${username}`);
    expect(res2.status).to.equal(200);
    expect(res2.body).to.have.property("data").that.is.an("array");
    expect(res2.body.meta).to.have.property("filtered", true);
    expect(res2.body.meta).to.have.property("filterType", "username");
    expect(res2.body.data[0]?.username?.toLowerCase()).to.equal(
      first.username.toLowerCase()
    );
  });

  it("/api/friends returns empty data when username is not found", async () => {
    const fake = `does-not-exist-${Date.now()}`;
    const res = await authGet(`/api/friends?username=${fake}`);
    expect(res.status).to.equal(200);
    expect(res.body.data).to.be.an("array").that.has.length(0);
    expect(res.body.meta).to.have.property("filtered", true);
  });

  it("/api/friends rejects invalid username characters", async () => {
    const res = await authGet("/api/friends?username=bad name");
    expect(res.status).to.equal(400);
    expect(res.body).to.have.property("error");
  });

  it("/api/friends returns 503 when simulateError flag is set", async () => {
    const res = await authGet("/api/friends").query({ simulateError: true });
    expect(res.status).to.equal(503);
    expect(res.body).to.have.property("error");
    expect(res.body.meta).to.have.property("simulated", true);
  });
});
