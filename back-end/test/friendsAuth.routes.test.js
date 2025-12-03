const chai = require("chai");
const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../app");
const User = require("../models/User");
const Friend = require("../models/Friend");
const FriendRequest = require("../models/FriendRequest");
const friendsService = require("../services/friendsService");

const { expect } = chai;

describe("Friends routes auth + validation", () => {
  let user;
  let token;

  beforeEach(async () => {
    // Clean up ONLY previous test users named routeuser + their data
    const priorUsers = await User.find(
      { email: "routeuser@example.com" },
      { _id: 1 }
    );
    const priorIds = priorUsers.map((u) => u._id);

    if (priorIds.length > 0) {
      await Friend.deleteMany({ owner: { $in: priorIds } });
      await FriendRequest.deleteMany({ owner: { $in: priorIds } });
      await User.deleteMany({ _id: { $in: priorIds } });
    }

    // Reset in-memory caches used by the service
    friendsService.resetFriendsCacheForTests();
    friendsService.resetFriendRequestsCacheForTests();

    // Create fresh test user
    user = await new User({
      username: "routeuser",
      email: "routeuser@example.com",
      password: "password123",
      name: "Route User",
    }).save();
    token = user.generateJWT();
  });

  it("rejects /api/friends without JWT", async () => {
    const res = await request(app).get("/api/friends");
    expect(res.status).to.equal(401);
  });

  it("rejects invalid ObjectId on accept", async () => {
    const res = await request(app)
      .post("/api/friend-requests/not-an-id/accept")
      .set("Authorization", `JWT ${token}`);
    expect(res.status).to.equal(400);
  });

  it("accepts a request and creates Friend, removing the request", async () => {
    const requester = new mongoose.Types.ObjectId();
    const reqDoc = await FriendRequest.create({
      owner: user._id,
      requester,
      username: "accept.me",
      first_name: "Accept",
      last_name: "Me",
      status: "pending",              // 🔧 make sure it's pending
    });

    const res = await request(app)
      .post(`/api/friend-requests/${reqDoc._id.toString()}/accept`)
      .set("Authorization", `JWT ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.have.nested.property("friend.username", "accept.me");

    // 🔧 only count this user's pending requests
    const remainingRequests = await FriendRequest.countDocuments({
      owner: user._id,
      status: "pending",
    });

    const friendDoc = await Friend.findOne({
      owner: user._id,
      contact: requester,
    });

    expect(remainingRequests).to.equal(0);
    expect(friendDoc).to.exist;
  });

  it("declines a request by deleting it and not creating a friend", async () => {
    const requester = new mongoose.Types.ObjectId();
    const reqDoc = await FriendRequest.create({
      owner: user._id,
      requester,
      username: "decline.me",
      first_name: "Decline",
      last_name: "Me",
      status: "pending",              // 🔧 pending here too
    });

    const res = await request(app)
      .post(`/api/friend-requests/${reqDoc._id.toString()}/decline`)
      .set("Authorization", `JWT ${token}`);

    expect(res.status).to.equal(200);

    // 🔧 only count this user's pending requests
    const remainingRequests = await FriendRequest.countDocuments({
      owner: user._id,
      status: "pending",
    });

    const friendDoc = await Friend.findOne({
      owner: user._id,
      contact: requester,
    });

    expect(remainingRequests).to.equal(0);
    expect(friendDoc).to.not.exist;
  });

  // ✅ clean up routeuser + related docs after this suite
  after(async () => {
    if (mongoose.connection.readyState !== 1) return;

    const routeUsers = await User.find(
      { email: "routeuser@example.com" },
      { _id: 1 }
    );
    const routeIds = routeUsers.map((u) => u._id);

    if (!routeIds.length) return;

    await Friend.deleteMany({ owner: { $in: routeIds } });
    await FriendRequest.deleteMany({ owner: { $in: routeIds } });
    await User.deleteMany({ _id: { $in: routeIds } });

    friendsService.resetFriendsCacheForTests();
    friendsService.resetFriendRequestsCacheForTests();
  });
});