require("dotenv").config({ silent: true });
// import and instantiate express
const express = require("express") // CommonJS import style!
const axios = require("axios"); 
const cors = require("cors");
const multer = require('multer');

const app = express() // instantiate an Express object
app.use(cors());
app.use(express.json());

// we will put some server logic here later...

//fall-back data
const fallbackBoards = [
    {
        id: 1,
        title: 'Your Cool Boards',
        isOwner: true,
        isJoined:true, 
        memberCount: 10,
        coverPhotoURL: `https://picsum.photos/800/400?seed=board-1`,
        descriptionShort:
          'purus eu magna vulputate luctus cum sociis natoque penatibus et magnis',
        descriptionLong:
          'non velit nec nisi vulputate nonummy maecenas tincidunt lacus at velit vivamus vel nulla eget eros elementum pellentesque quisque porta volutpat erat quisque erat eros viverra eget congue eget semper rutrum nulla nunc purus phasellus in felis donec semper sapien a libero nam dui proin leo odio porttitor id consequat in consequat ut nulla sed accumsan felis ut at dolor quis odio consequat varius integer ac leo pellentesque ultrices mattis odio donec vitae nisi nam ultrices libero'
      },
      {
        id: 2,
        title: 'Not Your Cool Boards',
        isOwner: false,
        isJoined: true, 
        memberCount: 10,
        coverPhotoURL: 'https://picsum.photos/800/400?seed=board-2',
        descriptionShort:
          'purus eu magna vulputate luctus cum sociis natoque penatibus et magnis',
        descriptionLong:
            'non velit nec nisi vulputate nonummy maecenas tincidunt lacus at velit vivamus vel nulla eget eros elementum pellentesque quisque porta volutpat erat quisque erat eros viverra eget congue eget semper rutrum nulla nunc purus phasellus in felis donec semper sapien a libero nam dui proin leo odio porttitor id consequat in consequat ut nulla sed accumsan felis ut at dolor quis odio consequat varius integer ac leo pellentesque ultrices mattis odio donec vitae nisi nam ultrices libero'
      }
  ];

  const fallbackMembers = [
    {
      id: 1,
      first_name: "Sherwin",
      last_name: "Peverell",
      username: "speverell0",
      country: "Indonesia",
      description: "non velit nec nisi vulputate",
      avatar: "https://i.pravatar.cc/100?img=1",
    },
    {
      id: 2,
      first_name: "Anna",
      last_name: "Petrova",
      username: "apetrova",
      country: "Russia",
      description: "non velit nec nisi vulputate",
      avatar: "https://i.pravatar.cc/100?img=2",
    },
  ];

  //mockaroo api - for now no env
  const MOCKAROO_URL = "https://my.api.mockaroo.com/mock_boards_data.json?key=dc8ece40";
  const MOCKAROO_URL_MEMBERS = 'https://my.api.mockaroo.com/members.json?key=dc8ece40';
  const MOCKAROO_API_KEY = process.env.MOCKAROO_API_KEY || "dc8ece40";
  const MOCKAROO_FRIENDS_URL =
    process.env.MOCKAROO_FRIENDS_URL || "https://my.api.mockaroo.com/friends.json";
  const FRIENDS_FETCH_COUNT = Number(process.env.FRIENDS_FETCH_COUNT) || 20;
  const FRIENDS_CACHE_TTL_MS =
    Number(process.env.FRIENDS_CACHE_TTL_MS) || 5 * 60 * 1000; // default 5 minutes

//mock photos for boards
const picsumUrl = (id, w = 800, h = 400) => `https://picsum.photos/${w}/${h}?seed=board-${id}`;

const enrichBoard = (b) => {
  if (!b || typeof b !== "object") return b;
  const id = String(b.id ?? "").trim() || "unknown";
  return {
    ...b,
    coverPhotoURL: picsumUrl(id, 800, 400),
  };
};
//mock photos for members
const avatarUrl = (id) => `https://i.pravatar.cc/100?img=${id}`;

const enrichMember = (b) => {
  if (!b || typeof b !== "object") return b;
  const id = String(b.id ?? "").trim() || "unknown";
  return {
    ...b,
    avatar: avatarUrl(id),
  };
};
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

const shouldRefreshFriendsCache = () => {
  return (
    !friendsCache.data.length ||
    Date.now() - friendsCache.timestamp > FRIENDS_CACHE_TTL_MS
  );
};

const fetchFriendsFromMockaroo = async () => {
  const response = await axios.get(MOCKAROO_FRIENDS_URL, {
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

  const usernameMatches = list.filter((friend) => {
    const username = String(friend.username ?? "").toLowerCase();
    return username === term;
  });
  if (usernameMatches.length > 0) {
    return usernameMatches;
  }

  return list.filter((friend) => {
    const username = String(friend.username ?? "").toLowerCase();
    const fullName = `${friend.first_name ?? ""} ${
      friend.last_name ?? ""
    }`.trim().toLowerCase();
    return username.includes(term) || fullName.includes(term);
  });
};

  //ROUTES

  //GET

  //get mock members
  app.get("/api/members", async (req, res) => {
    try {
      const response = await axios.get(MOCKAROO_URL_MEMBERS);
      console.log("Data loaded from Mockaroo");
      const members = Array.isArray(response.data) ? response.data : [];
      const enriched = members.map(enrichMember);
      res.json({ data: enriched });
    } catch (err) {
      console.warn("Mockaroo failed, using fallback data instead.");
      res.json({ data: fallbackMembers });
    }
  });

  //get mock boards
  // Homepage route - get data from Mockaroo
  app.get("/api/home", async (req, res) => {
    try {
      // Fetch boards data from Mockaroo to calculate homepage stats
      const response = await axios.get(MOCKAROO_URL);
      const boards = Array.isArray(response.data) ? response.data : [];
      
      // Calculate stats from Mockaroo data
      const totalBoards = boards.length;
      const activeCommunities = boards.filter(b => b.isJoined === true || b.isJoined === "true").length;
      
      // Get recent activity from boards data
      const recentActivity = boards.slice(0, 3).map(board => ({
        type: "board_joined",
        message: `You joined '${board.title || "Community Board"}'`,
        timestamp: new Date().toISOString()
      }));
      
      const homeData = {
        welcomeMessage: "Welcome to CommYOUnity",
        userStats: {
          totalBoards: totalBoards,
          totalFriends: 12, 
          activeCommunities: activeCommunities
        },
        recentActivity: recentActivity.length > 0 ? recentActivity : [
          {
            type: "board_joined",
            message: "Welcome to CommYOUnity!",
            timestamp: new Date().toISOString()
          }
        ]
      };
      
      res.json({ data: homeData });
    } catch (err) {
      console.warn("Mockaroo failed for homepage, using fallback data.");
      // Fallback data
      const fallbackData = {
        welcomeMessage: "Welcome to CommYOUnity",
        userStats: {
          totalBoards: fallbackBoards.length,
          totalFriends: 12,
          activeCommunities: fallbackBoards.filter(b => b.isJoined).length
        },
        recentActivity: [
          {
            type: "board_joined",
            message: `You joined '${fallbackBoards[0]?.title || "Community Board"}'`,
            timestamp: new Date().toISOString()
          }
        ]
      };
      res.json({ data: fallbackData });
    }
  });

  //get mock boards for viewBoards
  app.get("/api/boards", async (req, res) => {
    try {
      const response = await axios.get(MOCKAROO_URL);
      console.log("Data loaded from Mockaroo");
      const boards = Array.isArray(response.data) ? response.data : [];
      const enriched = boards.map(enrichBoard);
      res.json({ data: enriched });
    } catch (err) {
      console.warn("Mockaroo failed, using fallback data instead.");
      res.json({ data: fallbackBoards });
    }
  });

  //get data for single board
  app.get("/api/boards/:id", async (req, res) => {
    const boardId = parseInt(req.params.id, 10);
    try {
      const response = await axios.get(MOCKAROO_URL);
      const boards = Array.isArray(response.data) ? response.data : [];
      const board = boards.find(b => Number(b.id) === boardId);
      if (!board) return res.status(404).json({ error: "Board not found" });
      return res.json({ data: enrichBoard(board) });
    } catch (err) {
      console.warn("Mockaroo failed, using fallback for single board.");
      const board = fallbackBoards.find(b => b.id === boardId);
      if (!board) return res.status(404).json({ error: "Board not found" });
      res.json({ data: board });
    }
  });

  //get mock data for invite firends
  app.get("/api/friends", async (req, res) => {
    const query =
      (req.query.search || req.query.username || "").toString().trim();
    const limitParam = Number(req.query.limit);
    const limit =
      Number.isFinite(limitParam) && limitParam > 0 ? limitParam : null;
    const simulateError =
      String(req.query.simulateError || "").toLowerCase() === "true";

    if (simulateError) {
      return res.status(503).json({
        error: "Simulated friends service failure.",
        meta: { simulated: true },
      });
    }

    const friends = await ensureFriendsCache();
    const filtered = filterFriendsByQuery(friends, query);
    const data = limit ? filtered.slice(0, limit) : filtered;

    res.json({
      data,
      meta: {
        total: friends.length,
        count: data.length,
        filtered: Boolean(query),
        cacheSource: friendsCache.source,
        cachedAt: friendsCache.timestamp,
        ttlMs: FRIENDS_CACHE_TTL_MS,
      },
    });
  });

// POST 

//edit form

//multer

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file && !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed'));
    }
    cb(null, true);
  },
});

app.post('/api/boards/:id/edit', upload.single('photo'), (req, res) => {
  const { id } = req.params;
  const { title, descriptionLong } = req.body;

  const fileMeta = req.file
    ? {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      }
    : null;

  console.log('[BOARD EDIT RECEIVED]', {
    boardId: id,
    title,
    descriptionLong,
    file: fileMeta || '(no file)',
  });

  return res.status(202).json({
    status: 'received',
    boardId: id,
    received: {
      title: title ?? null,
      descriptionLong: descriptionLong ?? null,
      photo: fileMeta,
    },
    updatedAt: new Date().toISOString(),
  });
});

//leave board button

app.post('/api/boards/:id/leave', (req, res) => {
  const { id } = req.params;

  console.log('[LEAVE BOARD]', {
    boardId: id,
  });

  return res.status(202).json({
    status: 'received',
    boardId: id,
    message: 'User left the board (mock).',
    updated: {
      isJoined: false,
      memberCountDelta: -1, 
    },
    timestamp: new Date().toISOString(),
  });
});

// invite friend to board

app.post('/api/boards/:id/invite', (req, res) => {
  const { id } = req.params;
  const { friendId } = req.body;

  if (!friendId) {
    return res.status(400).json({ status: 'error', message: 'friendId is required' });
  }

  console.log('[INVITE]', {
    boardId: id,
    friendId,
    at: new Date().toISOString(),
  });

  return res.status(202).json({
    status: 'received',
    boardId: id,
    friendId,
    message: 'Invite recorded (mock).',
    timestamp: new Date().toISOString(),
  });
});

// search bar

app.post("/api/searches", (req, res) => {
  const { query } = req.body || {};
  const username = String(query || "").trim();
  if (!username) {
    return res.status(400).json({
      ok: false,
      error: "Username is required.",
    });
  }
  if (!/^[A-Za-z0-9_]+$/.test(username)) {
    return res.status(400).json({
      ok: false,
      error:
        "Illegal username. Only letters, digits (0–9), and underscores (_) are allowed.",
    });
  }
  console.log(`[SEARCH RECEIVED] username=${username}`);

  return res.status(200).json({
    ok: true,
    message: `Backend received search for username "${username}".`,
    timestamp: new Date().toISOString(),
  });
});

//kick button

app.post('/api/boards/:id/kick-member', (req, res) => {
  const { id } = req.params;
  const { memberId, memberCount } = req.body || {};

  if (memberCount === undefined || memberCount === null) {
    return res.status(400).json({
      status: 'error',
      message: 'memberCount is required',
    });
  }

  const prev = Number(memberCount);
  if (!Number.isFinite(prev) || prev < 0) {
    return res.status(400).json({
      status: 'error',
      message: 'memberCount must be a non-negative number',
    });
  }

  if (prev === 0) {
    return res.status(409).json({
      status: 'error',
      message: 'Cannot kick from an empty board',
      data: { id, memberCount: prev },
      timestamp: new Date().toISOString(),
    });
  }

  const next = Math.max(0, prev - 1);

  console.log('[KICK MEMBER]', {
    id,                    
    memberId: memberId ?? null,
    memberCountPrev: prev,  
    memberCountNew: next,
    at: new Date().toISOString(),
  });

  return res.status(202).json({
    status: 'received',
    message: 'Kick recorded (no persistence).',
    data: {
      id,                
      memberCount: next,  
    },
    meta: {
      memberId: memberId ?? null,
      memberCountPrev: prev,
      memberCountDelta: -1,
    },
    timestamp: new Date().toISOString(),
  });
});

// export the express app we created to make it available to other modules
module.exports = app
