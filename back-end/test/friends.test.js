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
    // Only remove test users (those created by this test file)
    await User.deleteMany({
      email: /frt_.*@example\.com$/i,
    });

    // Friend docs can all be removed; they’re only used for tests here
    await Friend.deleteMany({});

    const user = await new User({
      username: `frt_${Math.floor(Math.random() * 1e6)}`,
      email: `frt_${Date.now()}@example.com`,
      password: "password123",
      name: "Friend Tester",
    }).save();

    token = user.generateJWT();
    ownerId = user._id;

    // Seed two known friends in Mongo (these are your "mock friends")
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

  // uses known seeded friend
  it("/api/friends filters by username when requested", async () => {
    const username = encodeURIComponent("test.user");

    const res = await authGet(`/api/friends?username=${username}`);
    expect(res.status).to.equal(200);

    expect(res.body).to.have.property("data").that.is.an("array");
    expect(res.body).to.have.property("meta").that.is.an("object");
    expect(res.body.meta).to.have.property("filtered", true);
    expect(res.body.meta).to.have.property("filterType", "username");

    if (res.body.data.length > 0) {
      expect(res.body.data[0]).to.have.property("username");
      expect(res.body.data[0].username.toLowerCase()).to.equal("test.user");
    }
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
    expect(res.body).to.have.property("meta");
    expect(res.body.meta).to.have.property("simulated", true);
  });


  after(async () => {
    if (mongoose.connection.readyState !== 1) return;

    const testUsers = await User.find(
      { email: /^frt_.*@example\.com$/i },
      { _id: 1 }
    );

    if (!testUsers.length) return;

    const ownerIds = testUsers.map((u) => u._id);

    // delete Friend docs for those owners
    await Friend.deleteMany({ owner: { $in: ownerIds } });

    // delete the test users themselves
    await User.deleteMany({ _id: { $in: ownerIds } });
  });
});