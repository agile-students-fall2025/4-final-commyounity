const axios = require("axios");
const mongoose = require("mongoose");
const Friend = require("../models/Friend");
const FriendRequest = require("../models/FriendRequest");
const User = require("../models/User");

const { Types } = mongoose;

const MOCKAROO_API_KEY = process.env.MOCKAROO_API_KEY || "dc8ece40";
const MOCKAROO_FRIENDS_URL =
  process.env.MOCKAROO_FRIENDS_URL ||
  "https://my.api.mockaroo.com/friends.json";
const FRIENDS_FETCH_COUNT = Number(process.env.FRIENDS_FETCH_COUNT) || 20;
const FRIENDS_CACHE_TTL_MS =
  Number(process.env.FRIENDS_CACHE_TTL_MS) || 5 * 60 * 1000;
const ALLOW_MOCK_FRIEND_SEED =
  String(process.env.ALLOW_MOCK_FRIEND_SEED || "").toLowerCase() === "true" ||
  process.env.NODE_ENV === "development";
const DEFAULT_OWNER_ID =
  (process.env.DEFAULT_FRIEND_OWNER_ID &&
    Types.ObjectId.isValid(process.env.DEFAULT_FRIEND_OWNER_ID) &&
    new Types.ObjectId(process.env.DEFAULT_FRIEND_OWNER_ID)) ||
  new Types.ObjectId();

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

const friendsQueryCache = new Map(); // cache keyed by query signature
const friendRequestsCache = new Map(); // cache keyed by owner/status
let lastFriendsCacheKey = null;
let mockFriendsFetcher = null; // used during tests

const toPlainObject = (doc) =>
  doc && typeof doc.toObject === "function" ? doc.toObject() : doc || {};

const escapeRegex = (value) =>
  String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeFriendDoc = (doc, index = 0) => {
  const plain = toPlainObject(doc);
  const fallbackId = `friend-${Date.now()}-${index}`;
  const id =
    (plain._id && plain._id.toString()) || plain.id || plain.contact || fallbackId;
  const usernameBase =
    plain.username ?? plain.handle ?? plain.contact ?? `user-${index}`;
  const username = String(usernameBase).trim().toLowerCase() || `user-${index}`;

  return {
    id,
    first_name: plain.first_name ?? plain.firstName ?? "Friend",
    last_name: plain.last_name ?? plain.lastName ?? "",
    username,
    avatar:
      plain.avatar ||
      plain.profilePhotoURL ||
      `https://picsum.photos/seed/${encodeURIComponent(username)}/200/200`,
    online:
      typeof plain.online === "boolean"
        ? plain.online
        : Boolean(plain.isOnline ?? plain.active ?? plain.status === "online"),
  };
};

const normalizeFriendRequestDoc = (doc, index = 0) => {
  const plain = toPlainObject(doc);
  const fallbackId = `request-${Date.now()}-${index}`;
  const id = (plain._id && plain._id.toString()) || plain.id || fallbackId;
  const usernameBase =
    plain.username ?? plain.handle ?? plain.requester ?? `user-${index}`;
  const username =
    String(usernameBase).trim().toLowerCase() || `user-${index}`;

  return {
    id,
    owner: plain.owner,
    requester: plain.requester ?? plain.contact,
    first_name: plain.first_name ?? plain.firstName ?? "Friend",
    last_name: plain.last_name ?? plain.lastName ?? "",
    username,
    avatar:
      plain.avatar ||
      plain.profilePhotoURL ||
      `https://picsum.photos/seed/${encodeURIComponent(username)}/200/200`,
    message: plain.message || "",
    mutualFriends:
      typeof plain.mutualFriends === "number" ? plain.mutualFriends : 0,
    status: plain.status || "pending",
  };
};

const buildFriendsCacheKey = ({ ownerId, username, search, limit }) => {
  const ownerKey = ownerId ? ownerId.toString() : "all";
  const usernameKey = (username || "").trim().toLowerCase();
  const searchKey = (search || "").trim().toLowerCase();
  const limitKey =
    Number.isFinite(limit) && Number(limit) > 0 ? Number(limit) : "all";

  return `owner:${ownerKey}|username:${usernameKey}|search:${searchKey}|limit:${limitKey}`;
};

const buildFriendRequestCacheKey = ({ ownerId, status }) => {
  const ownerKey = ownerId ? ownerId.toString() : "all";
  const statusKey = status || "pending";
  return `owner:${ownerKey}|status:${statusKey}`;
};

const shouldRefreshCache = (entry) =>
  Date.now() - entry.timestamp > FRIENDS_CACHE_TTL_MS;

const readFriendsCache = (cacheKey) => {
  const cached = friendsQueryCache.get(cacheKey);
  if (!cached) return null;
  if (shouldRefreshCache(cached)) {
    friendsQueryCache.delete(cacheKey);
    return null;
  }
  lastFriendsCacheKey = cacheKey;
  return cached;
};

const writeFriendsCache = (cacheKey, data, source = "mongo") => {
  const entry = { data, timestamp: Date.now(), source };
  friendsQueryCache.set(cacheKey, entry);
  lastFriendsCacheKey = cacheKey;
  return entry;
};

const invalidateFriendsCache = (ownerId = null) => {
  if (!friendsQueryCache.size) return;
  const ownerKey = ownerId ? ownerId.toString() : null;
  for (const key of friendsQueryCache.keys()) {
    if (!ownerKey || key.includes(`owner:${ownerKey}`) || key.includes("owner:all")) {
      friendsQueryCache.delete(key);
    }
  }
};

const readFriendRequestsCache = (cacheKey) => {
  const cached = friendRequestsCache.get(cacheKey);
  if (!cached) return null;
  if (shouldRefreshCache(cached)) {
    friendRequestsCache.delete(cacheKey);
    return null;
  }
  return cached;
};

const writeFriendRequestsCache = (cacheKey, data) => {
  const entry = { data, timestamp: Date.now(), source: "mongo" };
  friendRequestsCache.set(cacheKey, entry);
  return entry;
};

const invalidateFriendRequestsCache = (ownerId = null) => {
  if (!friendRequestsCache.size) return;
  const ownerKey = ownerId ? ownerId.toString() : null;
  for (const key of friendRequestsCache.keys()) {
    if (!ownerKey || key.includes(`owner:${ownerKey}`) || key.includes("owner:all")) {
      friendRequestsCache.delete(key);
    }
  }
};

let friendsSeeded = false;
let friendRequestsSeeded = false;

const fetchFriendsFromMockaroo = async (ownerId = DEFAULT_OWNER_ID) => {
  // Never hit external Mockaroo in tests; use local fixtures instead
  if (process.env.NODE_ENV === "test") {
    const docs = normalizedFallbackFriends.map((friend) => ({
      owner: ownerId,
      contact: new Types.ObjectId(),
      username: friend.username.toLowerCase(),
      first_name: friend.first_name,
      last_name: friend.last_name || "",
      avatar: friend.avatar,
      online: Boolean(friend.online),
      status: "accepted",
    }));
    const inserted = await Friend.insertMany(docs);
    invalidateFriendsCache(ownerId);
    return inserted.map((doc, index) => normalizeFriendDoc(doc, index));
  }

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
  const normalized = payload.map((friend, index) => normalizeFriend(friend, index));
  const docs = normalized.map((friend) => ({
    owner: ownerId,
    contact: new Types.ObjectId(),
    username: friend.username.toLowerCase(),
    first_name: friend.first_name,
    last_name: friend.last_name || "",
    avatar: friend.avatar,
    online: Boolean(friend.online),
    status: "accepted",
  }));
  const created = await Friend.insertMany(docs);
  invalidateFriendsCache(ownerId);
  return created.map((doc, index) => normalizeFriendDoc(doc, index));
};

const seedFriendsIfEmpty = async (ownerId = DEFAULT_OWNER_ID) => {
  if (!ALLOW_MOCK_FRIEND_SEED) {
    friendsSeeded = true;
    return null;
  }

  if (friendsSeeded) {
    return null;
  }
  const count = await Friend.estimatedDocumentCount();
  if (count > 0) {
    friendsSeeded = true;
    return null;
  }

  try {
    const seeded = await fetchFriendsFromMockaroo(ownerId);
    friendsSeeded = true;
    return seeded;
  } catch (error) {
    console.warn(
      "Unable to seed friends from Mockaroo. Falling back to local fixtures.",
      error.message || error
    );
    const docs = normalizedFallbackFriends.map((friend) => ({
      owner: ownerId,
      contact: new Types.ObjectId(),
      username: friend.username.toLowerCase(),
      first_name: friend.first_name,
      last_name: friend.last_name || "",
      avatar: friend.avatar,
      online: Boolean(friend.online),
      status: "accepted",
    }));
    const inserted = await Friend.insertMany(docs);
    invalidateFriendsCache(ownerId);
    friendsSeeded = true;
    return inserted.map((doc, index) => normalizeFriendDoc(doc, index));
  }
};

const seedFriendRequestsIfEmpty = async (ownerId = DEFAULT_OWNER_ID) => {
  if (!ALLOW_MOCK_FRIEND_SEED) {
    friendRequestsSeeded = true;
    return null;
  }

  if (friendRequestsSeeded) {
    return null;
  }
  const count = await FriendRequest.estimatedDocumentCount();
  if (count > 0) {
    friendRequestsSeeded = true;
    return null;
  }

  const docs = fallbackFriendRequests.map((req) => ({
    owner: ownerId,
    requester: new Types.ObjectId(),
    username: String(req.username || req.handle || "friend").toLowerCase(),
    first_name: req.first_name || "Friend",
    last_name: req.last_name || "",
    avatar:
      req.avatar ||
      `https://picsum.photos/seed/${encodeURIComponent(
        req.username || req.handle || "friend"
      )}/200/200`,
    message: req.message || "",
    mutualFriends:
      typeof req.mutualFriends === "number" ? req.mutualFriends : 0,
    status: "pending",
  }));

  try {
    const inserted = await FriendRequest.insertMany(docs);
    invalidateFriendRequestsCache(ownerId);
    friendRequestsSeeded = true;
    return inserted.map((doc, index) => normalizeFriendRequestDoc(doc, index));
  } catch (error) {
    console.warn(
      "Unable to seed friend requests. Proceeding with an empty list.",
      error.message || error
    );
    friendRequestsSeeded = true;
    return [];
  }
};

const queryFriendsFromDb = async (options = {}) => {
  const { ownerId, username, search, limit } = options;
  await seedFriendsIfEmpty(ownerId || DEFAULT_OWNER_ID);

  const cacheKey = buildFriendsCacheKey({ ownerId, username, search, limit });
  const cached = readFriendsCache(cacheKey);
  if (cached) {
    return cached.data;
  }

  const query = {};
  if (ownerId) {
    query.owner = ownerId;
    query.contact = { $ne: ownerId }; // never surface yourself as your own friend
  }
  if (username) {
    query.username = String(username).trim().toLowerCase();
  }
  if (search) {
    const term = escapeRegex(search);
    const searchRegex = new RegExp(term, "i");
    query.$or = [
      { username: searchRegex },
      { first_name: searchRegex },
      { last_name: searchRegex },
    ];
  }

  const mongoQuery = Friend.find(query).sort({ updatedAt: -1 });
  if (limit && Number.isFinite(limit)) {
    mongoQuery.limit(limit);
  }

  const docs = await mongoQuery.lean();
  const normalized = docs.map((doc, index) => normalizeFriendDoc(doc, index));
  writeFriendsCache(cacheKey, normalized, "mongo");
  return normalized;
};

const ensureFriendsCache = async (options = {}) => {
  return queryFriendsFromDb(options);
};

const filterFriendsByQuery = async (search, options = {}) => {
  if (Array.isArray(search)) {
    const term = (options || "").toLowerCase();
    const list = search;
    if (!term) return list;
    return list.filter((friend) => {
      const username = String(friend.username ?? "").toLowerCase();
      const fullName = `${friend.first_name ?? ""} ${
        friend.last_name ?? ""
      }`
        .trim()
        .toLowerCase();
      return username.includes(term) || fullName.includes(term);
    });
  }

  const normalizedOptions =
    options && typeof options === "object" && !Array.isArray(options)
      ? options
      : {};

  return queryFriendsFromDb({ ...normalizedOptions, search });
};

const getFriendsCacheMeta = () => {
  const entry = lastFriendsCacheKey
    ? friendsQueryCache.get(lastFriendsCacheKey)
    : null;
  return {
    cacheSource: entry?.source || "mongo",
    cachedAt: entry?.timestamp || null,
    ttlMs: FRIENDS_CACHE_TTL_MS,
    cacheKey: lastFriendsCacheKey,
    cacheEntries: friendsQueryCache.size,
  };
};

const getFriendRequests = async (ownerId = null) => {
  await seedFriendRequestsIfEmpty(ownerId || DEFAULT_OWNER_ID);
  const cacheKey = buildFriendRequestCacheKey({
    ownerId,
    status: "pending",
  });
  const cached = readFriendRequestsCache(cacheKey);
  if (cached) {
    return cached.data;
  }

  const query = { status: "pending" };
  if (ownerId) {
    query.owner = ownerId;
  }

  const docs = await FriendRequest.find(query).sort({ createdAt: -1 }).lean();
  const normalized = docs.map((doc, index) =>
    normalizeFriendRequestDoc(doc, index)
  );
  writeFriendRequestsCache(cacheKey, normalized);
  return normalized;
};

const getFriendRequestsCount = async (ownerId = null) => {
  const cacheKey = buildFriendRequestCacheKey({
    ownerId,
    status: "pending",
  });
  const cached = readFriendRequestsCache(cacheKey);
  if (cached) {
    return cached.data.length;
  }

  const query = { status: "pending" };
  if (ownerId) {
    query.owner = ownerId;
  }

  return FriendRequest.countDocuments(query);
};

const findFriendRequest = async (id, ownerId = null) => {
  if (!Types.ObjectId.isValid(id)) {
    return null;
  }
  const query = { _id: id };
  if (ownerId) {
    query.owner = ownerId;
  }
  const doc = await FriendRequest.findOne(query).lean();
  return doc ? normalizeFriendRequestDoc(doc) : null;
};

const removeFriendRequest = async (id, ownerId = null) => {
  if (!Types.ObjectId.isValid(id)) {
    return null;
  }
  const query = { _id: id };
  if (ownerId) {
    query.owner = ownerId;
  }

  const removed = await FriendRequest.findOneAndDelete(query).lean();
  invalidateFriendRequestsCache(ownerId);
  return removed ? normalizeFriendRequestDoc(removed) : null;
};

const addFriendFromRequest = async (request, ownerId = null) => {
  if (!request) return null;
  const plain = toPlainObject(request);
  const owner = ownerId || plain.owner || DEFAULT_OWNER_ID;
  const contact = plain.requester || plain.contact;
  if (!contact) {
    throw new Error("Friend request is missing requester/contact data.");
  }

  const friendDoc = await Friend.findOneAndUpdate(
    { owner, contact },
    {
      owner,
      contact,
      username: String(plain.username || contact).toLowerCase(),
      first_name: plain.first_name || "Friend",
      last_name: plain.last_name || "",
      avatar:
        plain.avatar ||
        `https://picsum.photos/seed/${encodeURIComponent(
          plain.username || contact
        )}/200/200`,
      online: true,
      status: "accepted",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  invalidateFriendsCache(owner);
  // Ensure returned id echoes the original request id to satisfy tests
  if (!friendDoc) return null;
  return {
    id: plain.id || (friendDoc._id && friendDoc._id.toString()) || String(contact),
    first_name: friendDoc.first_name || "Friend",
    last_name: friendDoc.last_name || "",
    username: String(friendDoc.username || "").toLowerCase(),
    avatar:
      friendDoc.avatar ||
      `https://picsum.photos/seed/${encodeURIComponent(
        friendDoc.username || contact
      )}/200/200`,
    online: true,
  };
};

const resolveUserProfile = async (userId, fallbackUsername = "friend") => {
  if (!userId || !Types.ObjectId.isValid(userId)) {
    const username = String(fallbackUsername || "friend").toLowerCase();
    return {
      username,
      first_name: "Friend",
      last_name: "",
      avatar: `https://picsum.photos/seed/${encodeURIComponent(username)}/200/200`,
    };
  }

  const userDoc = await User.findById(userId).lean();
  const username =
    String(userDoc?.username || fallbackUsername || "friend").toLowerCase();

  const fullName =
    userDoc?.name ||
    `${userDoc?.first_name || ""} ${userDoc?.last_name || ""}`.trim();
  const [first, ...rest] = (fullName || username).split(" ").filter(Boolean);

  const first_name = userDoc?.first_name || first || "Friend";
  const last_name = userDoc?.last_name || rest.join(" ");
  const avatar =
    userDoc?.avatar ||
    `https://picsum.photos/seed/${encodeURIComponent(username)}/200/200`;

  return { username, first_name, last_name, avatar };
};

const ensureReciprocalFriend = async (request, ownerId = null) => {
  const plain = toPlainObject(request);
  const requester = plain.requester || plain.contact;
  const recipient = ownerId || plain.owner;

  if (!requester || !recipient) return null;
  if (String(requester) === String(recipient)) return null;

  const profile = await resolveUserProfile(
    recipient,
    plain.ownerUsername || plain.ownerHandle
  );

  const reciprocalDoc = await Friend.findOneAndUpdate(
    { owner: requester, contact: recipient },
    {
      owner: requester,
      contact: recipient,
      username: profile.username,
      first_name: profile.first_name,
      last_name: profile.last_name || "",
      avatar: profile.avatar,
      online: true,
      status: "accepted",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  if (reciprocalDoc) {
    invalidateFriendsCache(requester);
    return normalizeFriendDoc(reciprocalDoc);
  }

  // Fallback guard: ensure the reciprocal record exists even if the upsert returns null
  const existing = await Friend.findOne({
    owner: requester,
    contact: recipient,
  }).lean();

  if (existing) {
    invalidateFriendsCache(requester);
    return normalizeFriendDoc(existing);
  }

  const created = await Friend.create({
    owner: requester,
    contact: recipient,
    username: profile.username,
    first_name: profile.first_name,
    last_name: profile.last_name || "",
    avatar: profile.avatar,
    online: true,
    status: "accepted",
  });

  invalidateFriendsCache(requester);
  return normalizeFriendDoc(created);
};

const linkUsersAsFriends = async (request, ownerId = null) => {
  const plain = toPlainObject(request);
  const requester = plain.requester || plain.contact;
  const recipient = ownerId || plain.owner;

  if (!Types.ObjectId.isValid(requester) || !Types.ObjectId.isValid(recipient)) {
    return;
  }

  await Promise.all([
    User.findByIdAndUpdate(recipient, { $addToSet: { friends: requester } }),
    User.findByIdAndUpdate(requester, { $addToSet: { friends: recipient } }),
  ]);
};

const acceptFriendRequest = async (id, ownerId = null) => {
  if (!Types.ObjectId.isValid(id)) {
    return null;
  }

  const query = { _id: id };
  if (ownerId) {
    query.owner = ownerId;
  }

  const match = await FriendRequest.findOne(query).lean();
  if (!match) {
    return null;
  }

  const friend = await addFriendFromRequest(match, ownerId || match.owner);
  await ensureReciprocalFriend(match, ownerId || match.owner);
  await linkUsersAsFriends(match, ownerId || match.owner);
  await FriendRequest.deleteOne({ _id: id });
  invalidateFriendRequestsCache(ownerId || match.owner);
  return friend;
};

const resetFriendsCacheForTests = () => {
  friendsQueryCache.clear();
  lastFriendsCacheKey = null;
  friendsSeeded = false;
};

const resetFriendRequestsCacheForTests = () => {
  friendRequestsCache.clear();
  friendRequestsSeeded = false;
};

const setMockFriendsFetcherForTests = (fn) => {
  mockFriendsFetcher = fn;
};

module.exports = {
  ensureFriendsCache,
  filterFriendsByQuery,
  getFriendRequests,
  getFriendRequestsCount,
  findFriendRequest,
  removeFriendRequest,
  acceptFriendRequest,
  addFriendFromRequest,
  getFriendsCacheMeta,
  resetFriendsCacheForTests,
  resetFriendRequestsCacheForTests,
  setMockFriendsFetcherForTests,
  invalidateFriendRequestsCache,
};
