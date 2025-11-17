require("dotenv").config({ silent: true });
// import and instantiate express
const express = require("express") // CommonJS import style!
const axios = require("axios"); 
const cors = require("cors");
const multer = require('multer');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require("path");
const profileRouter = require("./routes/profile");
const boardFeedRouter = require("./routes/boardfeed");
const app = express() // instantiate an Express object

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
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
      },
      {
        id: 3,
        title: 'Art & Culture Exchange',
        isOwner: false,
        isJoined: false,
        memberCount: 24,
        coverPhotoURL: 'https://picsum.photos/800/400?seed=board-3',
        descriptionShort:
          'connect with artists and creators sharing cross-cultural experiences',
        descriptionLong:
          'explore the intersection of art, music, and culture in this vibrant community. members host weekly digital exhibits, share creative inspiration, and collaborate across disciplines. perfect for painters, photographers, and anyone with a creative spark.'
      },
      {
        id: 4,
        title: 'Language Learners Hub',
        isOwner: false,
        isJoined: false,
        memberCount: 18,
        coverPhotoURL: 'https://picsum.photos/800/400?seed=board-4',
        descriptionShort:
          'practice languages with friendly native speakers from around the world',
        descriptionLong:
          'a global space for language enthusiasts to connect, exchange tips, and build fluency through conversation. join themed events like “spanish tuesdays” and “french friday” to improve your skills and make friends from every corner of the world.'
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
  const MOCKAROO_API_KEY = process.env.MOCKAROO_API_KEY;
  const MOCKAROO_URL = `https://my.api.mockaroo.com/mock_boards_data.json?key=${MOCKAROO_API_KEY}`;
  const MOCKAROO_URL_MEMBERS = `https://my.api.mockaroo.com/members.json?key=${MOCKAROO_API_KEY}`;
  const MOCKAROO_FRIENDS_URL = `https://my.api.mockaroo.com/friends.json?key=${MOCKAROO_API_KEY}`;
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

let friendsCache = {
  data: normalizedFallbackFriends,
  timestamp: 0,
  source: "fallback",
};

let friendRequestsCache = [...fallbackFriendRequests];

const getFriendRequests = () => friendRequestsCache;
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

// Search boards
app.get("/api/boards/search", async (req, res) => {
  const { query, filter } = req.query;
  
  // Validate query parameter
  if (!query || typeof query !== 'string' || query.trim() === '') {
    return res.status(400).json({
      status: 'error',
      message: 'Query parameter is required',
    });
  }

  const searchTerm = query.trim().toLowerCase();
  
  console.log('[BOARD SEARCH]', {
    query: searchTerm,
    filter: filter || 'all',
    timestamp: new Date().toISOString()
  });

  try {
    // Fetch all boards from Mockaroo (or use fallback)
    let boards;
    try {
      const response = await axios.get(MOCKAROO_URL);
      boards = Array.isArray(response.data) ? response.data : [];
      boards = boards.map(enrichBoard);
    } catch (err) {
      console.warn("Mockaroo failed for search, using fallback data.");
      boards = fallbackBoards;
    }

    // Filter boards based on search term
    let filteredBoards = boards.filter(board => {
      const titleMatch = board.title?.toLowerCase().includes(searchTerm);
      const descriptionMatch = board.descriptionLong?.toLowerCase().includes(searchTerm);
      return titleMatch || descriptionMatch;
    });

    // Apply additional filter if specified
    if (filter) {
      switch(filter) {
        case 'my_boards':
          filteredBoards = filteredBoards.filter(b => b.isOwner === true);
          break;
        case 'joined_boards':
          filteredBoards = filteredBoards.filter(b => !b.isOwner && b.isJoined === true);
          break;
        case 'not_joined':
          filteredBoards = filteredBoards.filter(b => b.isJoined === false);
          break;
        // 'all' or any other value returns all matched boards
      }
    }

    return res.status(200).json({
      status: 'success',
      data: filteredBoards,
      meta: {
        query: searchTerm,
        filter: filter || 'all',
        totalResults: filteredBoards.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('[BOARD SEARCH ERROR]', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to search boards',
      error: err.message
    });
  }
});

  //get mock data for invite firends
  app.get("/api/friends", async (req, res) => {
    const rawUsername =
      typeof req.query.username === "string" ? req.query.username.trim() : "";
    const rawSearch =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : rawUsername
        ? ""
        : "";
    const limitParam = Number(req.query.limit);
    const limit =
      Number.isFinite(limitParam) && limitParam > 0 ? limitParam : null;
    const simulateError =
      String(req.query.simulateError || "").toLowerCase() === "true";
    const hasExactUsername = rawUsername.length > 0;
    const hasSearch = !hasExactUsername && rawSearch.length > 0;

    if (simulateError) {
      return res.status(503).json({
        error: "Simulated friends service failure.",
        meta: { simulated: true },
      });
    }

    if (
      hasExactUsername &&
      !/^[A-Za-z0-9._-]+$/.test(rawUsername)
    ) {
      return res.status(400).json({
        error:
          "Username may only include letters, digits, dots (.), underscores (_), or hyphens (-).",
      });
    }

    const friends = await ensureFriendsCache();
    let filteredList = friends;
    let filtered = false;
    let filterType = null;

    if (hasExactUsername) {
      filtered = true;
      filterType = "username";
      const term = rawUsername.toLowerCase();
      filteredList = friends.filter(
        (friend) => String(friend.username ?? "").toLowerCase() === term
      );
    } else if (hasSearch) {
      filtered = true;
      filterType = "search";
      filteredList = filterFriendsByQuery(friends, rawSearch);
    }

    const data = limit ? filteredList.slice(0, limit) : filteredList;

    res.json({
      data,
      meta: {
        total: friends.length,
        count: data.length,
        filtered,
        filterType,
        cacheSource: friendsCache.source,
        cachedAt: friendsCache.timestamp,
        ttlMs: FRIENDS_CACHE_TTL_MS,
      },
    });
  });

  app.get("/api/friend-requests", (req, res) => {
    res.json({
      data: getFriendRequests(),
      meta: { count: friendRequestsCache.length },
    });
  });

  app.post("/api/friend-requests/:id/accept", (req, res) => {
    const { id } = req.params;
    const match = findFriendRequest(id);
    if (!match) {
      return res.status(404).json({ error: "Friend request not found." });
    }

    removeFriendRequest(id);
    res.json({
      status: "accepted",
      friend: addFriendFromRequest(match),
      remainingRequests: friendRequestsCache.length,
    });
  });

  app.post("/api/friend-requests/:id/decline", (req, res) => {
    const { id } = req.params;
    const match = findFriendRequest(id);
    if (!match) {
      return res.status(404).json({ error: "Friend request not found." });
    }

    removeFriendRequest(id);
    res.json({
      status: "declined",
      declinedRequest: { id: match.id, username: match.username },
      remainingRequests: friendRequestsCache.length,
    });
  });

//log-in with Google

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:4000/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      console.log("Google profile:", profile);
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login-failed",
    successRedirect: "http://localhost:3000/home", 
  })
);

app.get("/login-failed", (req, res) => {
  res.status(401).json({ error: "Login failed" });
});

app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("http://localhost:3000/");
  });
});

//signup

const googleSignupUsers =
  global.__GOOGLE_SIGNUP_USERS__ || (global.__GOOGLE_SIGNUP_USERS__ = []);

passport.use(
  'google-signup',
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:4000/auth/google/signup/callback',
    },
    (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value || null;
        const name = profile.displayName || 'Google User';
        const googleId = profile.id;
        let user =
          googleSignupUsers.find((u) => u.googleId === googleId) ||
          (email
            ? googleSignupUsers.find(
                (u) => (u.email || '').toLowerCase() === email.toLowerCase()
              )
            : null);
        if (!user) {
          const nextId =
            googleSignupUsers.length > 0
              ? Math.max(...googleSignupUsers.map((u) => u.id || 0)) + 1
              : 1;

          user = {
            id: nextId,
            googleId,
            email,
            name,
            username: email ? email.split('@')[0] : `google_${googleId}`,
            authProvider: 'google',
          };

          googleSignupUsers.push(user);
          console.log('[GOOGLE SIGNUP SUCCESS]', user);
        } else {
          console.log('[GOOGLE SIGNUP - EXISTING USER]', user);
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

app.get(
  '/auth/google/signup',
  passport.authenticate('google-signup', { scope: ['profile', 'email'] })
);

app.get(
  '/auth/google/signup/callback',
  passport.authenticate('google-signup', {
    failureRedirect: 'http://localhost:3000/signup?error=google_signup_failed',
    successRedirect: 'http://localhost:3000/home',
  })
);

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

// Local login (manual username/password) 

const users = [
  { id: 1, username: 'testuser', password: '12345', name: 'Test User' },
  { id: 2, username: 'carina', password: 'carina123', name: 'Carina Ilie' },
];

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ ok: false, error: 'Username and password are required.' });
  }

  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ ok: false, error: 'Invalid credentials.' });
  }
  req.session.user = user;
  console.log('[LOGIN SUCCESS]', user);

  res.json({
    ok: true,
    message: `Welcome, ${user.name}!`,
    user: { id: user.id, username: user.username, name: user.name },
  });
});

app.get('/api/auth/me', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.json({ ok: true, method: 'google', user: req.user });
  }
  if (req.session && req.session.user) {
    return res.json({ ok: true, method: 'local', user: req.session.user });
  }
  return res.status(401).json({ ok: false, error: 'Not authenticated' });
});

//signup manual

const registeredUsers =
  global.__REGISTERED_USERS__ ||
  [
    { id: 1, username: 'testuser', email: 'test@demo.com', password: '12345', name: 'Test User' },
    { id: 2, username: 'carina', email: 'carina@demo.com', password: 'carina123', name: 'Carina Ilie' },
  ];
global.__REGISTERED_USERS__ = registeredUsers;

const USERNAME_RE = /^[A-Za-z0-9._-]{3,24}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSignup({ username, email, password, confirmPassword }) {
  if (!username || !email || !password) {
    return 'username, email, and password are required.';
  }
  if (!USERNAME_RE.test(username)) {
    return 'Username must be 3–24 chars and may include letters, digits, ., _, or -';
  }
  if (!EMAIL_RE.test(email)) {
    return 'Please provide a valid email address.';
  }
  if (String(password).length < 6) {
    return 'Password must be at least 6 characters long.';
  }
  if (confirmPassword !== undefined && confirmPassword !== password) {
    return 'Passwords do not match.';
  }
  return null;
}

app.post('/auth/signup', (req, res) => {
  const { username, email, password, confirmPassword } = req.body || {};

  const errMsg = validateSignup({ username, email, password, confirmPassword });
  if (errMsg) {
    return res.status(400).json({ ok: false, error: errMsg });
  }

  const existingUsername = registeredUsers.find(
    (u) => u.username.toLowerCase() === String(username).toLowerCase()
  );
  if (existingUsername) {
    return res.status(409).json({ ok: false, error: 'Username already taken.' });
  }

  const existingEmail = registeredUsers.find(
    (u) => u.email.toLowerCase() === String(email).toLowerCase()
  );
  if (existingEmail) {
    return res.status(409).json({ ok: false, error: 'Email already registered.' });
  }

  const nextId =
    registeredUsers.length > 0
      ? Math.max(...registeredUsers.map((u) => u.id)) + 1
      : 1;

  const newUser = {
    id: nextId,
    username: String(username),
    email: String(email),
    password: String(password), 
    name: String(username),
  };

  registeredUsers.push(newUser);
  req.session.user = { id: newUser.id, username: newUser.username, name: newUser.name, email: newUser.email };

  console.log('[SIGNUP SUCCESS]', newUser);

  res.status(201).json({
    ok: true,
    message: 'Account created successfully.',
    user: { id: newUser.id, username: newUser.username, email: newUser.email, name: newUser.name },
  });
});

//join board button

app.post('/api/boards/:id/join', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body || {}; 

  console.log('[JOIN BOARD]', {
    boardId: id,
    userId: userId ?? '(anonymous)',
    at: new Date().toISOString(),
  });

  return res.status(200).json({
    status: 'success',
    boardId: id,
    message: `User${userId ? ` ${userId}` : ''} joined the board.`,
    updated: {
      isJoined: true,
      memberCountDelta: +1,
    },
    timestamp: new Date().toISOString(),
  });
});

//create form

const createdBoards =
  global.__CREATED_BOARDS__ || (global.__CREATED_BOARDS__ = []);

//in memory storage for posts
const boardPosts = global.__BOARD_POSTS__ || (global.__BOARD_POSTS__ = []);

app.post('/api/boards/create', upload.single('photo'), (req, res) => {
  const title =
    (req.body.title || req.body.boardName || '').toString().trim();
  const descriptionLong =
    (req.body.descriptionLong || req.body.description || '').toString();

  if (!title) {
    return res.status(400).json({
      status: 'error',
      message: 'Title (board name) is required',
    });
  }

  const fileMeta = req.file
    ? {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      }
    : null;


  const id = Date.now();
  const newBoard = {
    id,
    title,
    descriptionLong,
    isOwner: true,
    isJoined: true,
    memberCount: 1,
    coverPhotoURL: `https://picsum.photos/800/400?seed=board-${id}`,
    _createdAt: new Date().toISOString(),
    _file: fileMeta,
  };

  createdBoards.unshift(newBoard);

  console.log('[BOARD CREATE RECEIVED]', {
    boardId: id,
    title,
    descriptionLong,
    file: fileMeta || '(no file)',
  });

  return res.status(201).json({
    status: 'created',
    data: newBoard,
  });
});

//serve static files from uploads folder
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

//profile routes
app.use("/api/profile", profileRouter);


//board routes
app.use("/api/boards", boardFeedRouter);

// export the express app we created to make it available to other modules
module.exports = app