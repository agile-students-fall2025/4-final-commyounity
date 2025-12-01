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
    await User.deleteMany({});
    await Friend.deleteMany({});
    await FriendRequest.deleteMany({});
    friendsService.resetFriendsCacheForTests();
    friendsService.resetFriendRequestsCacheForTests();

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
    });

    const res = await request(app)
      .post(`/api/friend-requests/${reqDoc._id.toString()}/accept`)
      .set("Authorization", `JWT ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.have.nested.property("friend.username", "accept.me");

    const remainingRequests = await FriendRequest.countDocuments();
    const friendDoc = await Friend.findOne({ owner: user._id, contact: requester });
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
    });

    const res = await request(app)
      .post(`/api/friend-requests/${reqDoc._id.toString()}/decline`)
      .set("Authorization", `JWT ${token}`);

    expect(res.status).to.equal(200);
    const remainingRequests = await FriendRequest.countDocuments();
    const friendDoc = await Friend.findOne({ owner: user._id, contact: requester });
    expect(remainingRequests).to.equal(0);
    expect(friendDoc).to.not.exist;
  });
});
