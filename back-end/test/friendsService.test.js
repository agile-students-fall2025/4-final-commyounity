const { expect } = require("chai");
const friendsService = require("../services/friendsService");

describe("friendsService shared utilities", () => {
  afterEach(() => {
    friendsService.resetFriendsCacheForTests();
    friendsService.resetFriendRequestsCacheForTests();
    friendsService.setMockFriendsFetcherForTests(null);
  });

  it("ensureFriendsCache returns fallback data when fetcher fails", async () => {
    friendsService.setMockFriendsFetcherForTests(async () => {
      throw new Error("Simulated failure");
    });
    friendsService.resetFriendsCacheForTests();

    const data = await friendsService.ensureFriendsCache();
    expect(data).to.be.an("array").that.is.not.empty;
    expect(data[0]).to.have.property("username");
  });

  it("filterFriendsByQuery finds matches in username or name", async () => {
    const list = [
      { username: "test.user", first_name: "Test", last_name: "User" },
      { username: "alex", first_name: "Alex", last_name: "Smith" },
    ];

    const usernameMatch = await friendsService.filterFriendsByQuery(
      list,
      "alex"
    );
    expect(usernameMatch).to.have.length(1);

    const nameMatch = await friendsService.filterFriendsByQuery(
      list,
      "test user"
    );
    expect(nameMatch).to.have.length(1);
  });

  it("friend request helpers remove and count items", async () => {
    const requests = await friendsService.getFriendRequests();
    const originalCount = await friendsService.getFriendRequestsCount();
    expect(requests).to.have.length(originalCount);

    const target = requests[0];
    await friendsService.removeFriendRequest(target.id);
    expect(await friendsService.getFriendRequestsCount()).to.equal(
      originalCount - 1
    );
    const record = await friendsService.findFriendRequest(target.id);
    expect(record).to.be.null;
  });

  it("addFriendFromRequest normalizes payload", async () => {
    const request = {
      id: "req-1",
      first_name: "Sam",
      last_name: "Lee",
      username: "samlee",
      avatar: "https://picsum.photos/seed/sam/200/200",
      requester: "507f1f77bcf86cd799439011",
    };
    const friend = await friendsService.addFriendFromRequest(request);
    expect(friend).to.include({
      id: "req-1",
      first_name: "Sam",
      last_name: "Lee",
      username: "samlee",
      online: true,
    });
  });
});
