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

  it("filterFriendsByQuery finds matches in username or name", () => {
    const list = [
      { username: "test.user", first_name: "Test", last_name: "User" },
      { username: "alex", first_name: "Alex", last_name: "Smith" },
    ];

    const usernameMatch = friendsService.filterFriendsByQuery(list, "alex");
    expect(usernameMatch).to.have.length(1);

    const nameMatch = friendsService.filterFriendsByQuery(list, "test user");
    expect(nameMatch).to.have.length(1);
  });

  it("friend request helpers remove and count items", () => {
    const requests = friendsService.getFriendRequests();
    const originalCount = friendsService.getFriendRequestsCount();
    expect(requests).to.have.length(originalCount);

    const target = requests[0];
    friendsService.removeFriendRequest(target.id);
    expect(friendsService.getFriendRequestsCount()).to.equal(originalCount - 1);
    const record = friendsService.findFriendRequest(target.id);
    expect(record).to.be.undefined;
  });

  it("addFriendFromRequest normalizes payload", () => {
    const request = {
      id: "req-1",
      first_name: "Sam",
      last_name: "Lee",
      username: "samlee",
      avatar: "https://picsum.photos/seed/sam/200/200",
    };
    const friend = friendsService.addFriendFromRequest(request);
    expect(friend).to.include({
      id: "req-1",
      first_name: "Sam",
      last_name: "Lee",
      username: "samlee",
      online: true,
    });
  });
});
