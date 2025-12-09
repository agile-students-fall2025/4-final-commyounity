const { expect } = require("chai");
const mongoose = require("mongoose");
const Friend = require("../models/Friend");
const FriendRequest = require("../models/FriendRequest");
const friendsService = require("../services/friendsService");

describe("friendsService (Mongo-backed)", () => {
  let ownerId;
  let requesterId;
  let recipientId;

  beforeEach(async () => {
    // Cleanup ONLY test data
    await Friend.deleteMany({});
    await FriendRequest.deleteMany({});

    // Reset internal caches
    friendsService.resetFriendsCacheForTests();
    friendsService.resetFriendRequestsCacheForTests();

    // Fresh test IDs
    ownerId = new mongoose.Types.ObjectId();
    requesterId = new mongoose.Types.ObjectId();
    recipientId = new mongoose.Types.ObjectId();
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
    const friendDoc = await Friend.findOne({
      owner: ownerId,
      contact: requesterId,
    });

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

    await friendsService.removeFriendRequest(
      request._id.toString(),
      ownerId
    );

    const requestCount = await FriendRequest.countDocuments();
    const friendCount = await Friend.countDocuments();

    expect(requestCount).to.equal(0);
    expect(friendCount).to.equal(0);
  });

  it("returns null on invalid ObjectId when accepting", async () => {
    const result = await friendsService.acceptFriendRequest(
      "not-a-valid-id",
      ownerId
    );
    expect(result).to.be.null;
  });

  it("creates reciprocal friend records when a request is accepted", async () => {
    const request = await FriendRequest.create({
      owner: recipientId,
      requester: requesterId,
      username: "reciprocal.user",
      first_name: "Reciprocal",
      last_name: "User",
      status: "pending",
    });

    const friend = await friendsService.acceptFriendRequest(
      request._id.toString(),
      recipientId
    );

    expect(friend).to.be.an("object");

    const recipientFriend = await Friend.findOne({
      owner: recipientId,
      contact: requesterId,
    }).lean();

    const requesterFriend = await Friend.findOne({
      owner: requesterId,
      contact: recipientId,
    }).lean();

    expect(recipientFriend).to.exist;
    expect(requesterFriend).to.exist;
  });

  // --------------------------------------------------------
  // SAFE CLEANUP AFTER ALL TESTS
  // --------------------------------------------------------
  after(async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Remove friend + friendRequest docs created by these tests only:
    await Friend.deleteMany({
      owner: { $in: [ownerId] },
    });

    await FriendRequest.deleteMany({
      owner: { $in: [ownerId] },
    });
  });
});
