const axios = require('axios');

const MOCKAROO_API_KEY = process.env.MOCKAROO_API_KEY || "dc8ece40";
const MOCKAROO_FRIENDS_URL =
  process.env.MOCKAROO_FRIENDS_URL || "https://my.api.mockaroo.com/friends.json";
const FRIENDS_FETCH_COUNT = Number(process.env.FRIENDS_FETCH_COUNT) || 20;
const FRIENDS_CACHE_TTL_MS =
  Number(process.env.FRIENDS_CACHE_TTL_MS) || 5 * 60 * 1000;

const fallbackFriends = [
  {
    id: 1,
    first_name: "Emma",
    last_name: "Chen",
    username: "emma_chen",
    mutualCount: 12,
    profilePhotoURL: "https://picsum.photos/seed/emma/200/200",
    bio: "Loves art museums, matcha lattes, and weekend hikes 🌿",
    online: true,
  },
  {
    id: 2,
    first_name: "Liam",
    last_name: "Patel",
    username: "liam.codes",
    mutualCount: 8,
    profilePhotoURL: "https://picsum.photos/seed/liam/200/200",
    online: false,
  },
  {
    id: 3,
    first_name: "Sofia",
    last_name: "Reyes",
    username: "sofiareyes",
    mutualCount: 5,
    profilePhotoURL: "https://picsum.photos/seed/sofia/200/200",
    online: true,
  },
];

const fallbackFriendRequests = [
  {
    id: "request-1",
    first_name: "Wilhem",
    last_name: "Hoffmann",
    username: "wil.hoff",
    avatar: "https://picsum.photos/seed/wilhelm/200/200",
    message: "Hey! We met at the design sprint last week—would love to connect.",
    mutualFriends: 3,
  },
  {
    id: "request-2",
    first_name: "Kara",
    last_name: "Singh",
    username: "kara.codes",
    avatar: "https://picsum.photos/seed/kara/200/200",
    message:
      "Loved your post about remote collaboration. Want to swap tips sometime?",
    mutualFriends: 1,
  },
];

const normalizeFriend = (friend, index = 0) => {
  const fallbackId = `friend-${Date.now()}-${index}`;
  const id = friend.id ?? fallbackId;
  const usernameBase = friend.username ?? friend.handle ?? `user-${index}`;
  const username = String(usernameBase).trim() || `user-${index}`;
  const firstName = friend.first_name ?? friend.firstName ?? "Friend";
  const lastName = friend.last_name ?? friend.lastName ?? "";
  const avatar =
    friend.avatar ??
    friend.profilePhotoURL ??
    `https://picsum.photos/seed/${encodeURIComponent(username)}/200/200`;
  const online =
    typeof friend.online === "boolean"
      ? friend.online
      : Boolean(friend.isOnline ?? friend.active ?? friend.status === "online");

  return {
    id,
    first_name: firstName,
    last_name: lastName,
    username,
    avatar,
    online,
  };
};

const normalizedFallbackFriends = fallbackFriends.map((friend, index) =>
  normalizeFriend(friend, index)
);

let friendsCache = {
  data: normalizedFallbackFriends,
  timestamp: 0,
  source: "fallback",
};

let friendRequestsCache = [...fallbackFriendRequests];
let mockFriendsFetcher = null; // used during tests

const shouldRefreshFriendsCache = () => {
  return (
    !friendsCache.data.length ||
    Date.now() - friendsCache.timestamp > FRIENDS_CACHE_TTL_MS
  );
};

const fetchFriendsFromMockaroo = async () => {
  const fetcher = mockFriendsFetcher || axios.get;
  const response = await fetcher(MOCKAROO_FRIENDS_URL, {
    params: {
      key: MOCKAROO_API_KEY,
      count: FRIENDS_FETCH_COUNT,
    },
    headers: {
      "X-API-Key": MOCKAROO_API_KEY,
    },
  });
  const payload = Array.isArray(response.data) ? response.data : [];
  const normalized = payload.map((friend, index) =>
    normalizeFriend(friend, index)
  );
  friendsCache = {
    data: normalized,
    timestamp: Date.now(),
    source: "mockaroo",
  };
  return normalized;
};

const ensureFriendsCache = async () => {
  if (!shouldRefreshFriendsCache()) {
    return friendsCache.data;
  }

  try {
    return await fetchFriendsFromMockaroo();
  } catch (error) {
    console.warn(
      "Unable to refresh friends from Mockaroo. Serving cached/fallback data.",
      error.message || error
    );
    if (!friendsCache.data.length) {
      friendsCache = {
        data: normalizedFallbackFriends,
        timestamp: Date.now(),
        source: "fallback",
      };
    }
    return friendsCache.data;
  }
};

const filterFriendsByQuery = (list, query) => {
  if (!query) return list;
  const term = query.toLowerCase();
  return list.filter((friend) => {
    const username = String(friend.username ?? "").toLowerCase();
    const fullName = `${friend.first_name ?? ""} ${
      friend.last_name ?? ""
    }`.trim().toLowerCase();
    return username.includes(term) || fullName.includes(term);
  });
};

const getFriendRequests = () => friendRequestsCache;

const getFriendRequestsCount = () => friendRequestsCache.length;

const getFriendsCacheMeta = () => ({
  cacheSource: friendsCache.source,
  cachedAt: friendsCache.timestamp,
  ttlMs: FRIENDS_CACHE_TTL_MS,
});

const resetFriendsCacheForTests = () => {
  friendsCache = {
    data: normalizedFallbackFriends,
    timestamp: 0,
    source: "fallback",
  };
};

const resetFriendRequestsCacheForTests = () => {
  friendRequestsCache = [...fallbackFriendRequests];
};

const setMockFriendsFetcherForTests = (fn) => {
  mockFriendsFetcher = fn;
};

const findFriendRequest = (id) =>
  friendRequestsCache.find((req) => String(req.id) === String(id));

const removeFriendRequest = (id) => {
  friendRequestsCache = friendRequestsCache.filter(
    (req) => String(req.id) !== String(id)
  );
};

const addFriendFromRequest = (request) => ({
  id: request.id,
  first_name: request.first_name,
  last_name: request.last_name,
  username: request.username,
  avatar:
    request.avatar ||
    `https://picsum.photos/seed/${encodeURIComponent(request.username)}/200/200`,
  online: true,
});

module.exports = {
  ensureFriendsCache,
  filterFriendsByQuery,
  getFriendRequests,
  getFriendRequestsCount,
  findFriendRequest,
  removeFriendRequest,
  addFriendFromRequest,
  getFriendsCacheMeta,
  resetFriendsCacheForTests,
  resetFriendRequestsCacheForTests,
  setMockFriendsFetcherForTests,
};
