const { expect } = require("chai");
const mongoose = require("mongoose");
const Friend = require("../models/Friend");
const FriendRequest = require("../models/FriendRequest");
const friendsService = require("../services/friendsService");

describe("friendsService (Mongo-backed)", () => {
  let ownerId;
  let requesterId;

  beforeEach(async () => {
    await Friend.deleteMany({});
    await FriendRequest.deleteMany({});
    friendsService.resetFriendsCacheForTests();
    friendsService.resetFriendRequestsCacheForTests();
    ownerId = new mongoose.Types.ObjectId();
    requesterId = new mongoose.Types.ObjectId();
  });

  it("fetches friends by exact username and partial search", async () => {
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

    const exact = await friendsService.ensureFriendsCache({
      ownerId,
      username: "test.user",
    });
    expect(exact).to.have.length(1);
    expect(exact[0]).to.have.property("username", "test.user");

    const partial = await friendsService.filterFriendsByQuery("alex", {
      ownerId,
    });
    expect(partial).to.have.length(1);
    expect(partial[0]).to.have.property("username", "alex");
  });

  it("accepts a friend request and removes it from Mongo", async () => {
    const request = await FriendRequest.create({
      owner: ownerId,
      requester: requesterId,
      username: "new.friend",
      first_name: "New",
      last_name: "Friend",
      status: "pending",
    });

    const friend = await friendsService.acceptFriendRequest(
      request._id.toString(),
      ownerId
    );

    expect(friend).to.be.an("object");
    const requestCount = await FriendRequest.countDocuments();
    const friendDoc = await Friend.findOne({ owner: ownerId, contact: requesterId });
    expect(requestCount).to.equal(0);
    expect(friendDoc).to.exist;
  });

  it("declines a friend request by deleting it only", async () => {
    const request = await FriendRequest.create({
      owner: ownerId,
      requester: requesterId,
      username: "decline.me",
      first_name: "Decline",
      last_name: "Me",
      status: "pending",
    });

    await friendsService.removeFriendRequest(request._id.toString(), ownerId);
    const requestCount = await FriendRequest.countDocuments();
    const friendCount = await Friend.countDocuments();
    expect(requestCount).to.equal(0);
    expect(friendCount).to.equal(0);
  });

  it("returns null on invalid ObjectId when accepting", async () => {
    const result = await friendsService.acceptFriendRequest("not-a-valid-id", ownerId);
    expect(result).to.be.null;
  });
});
