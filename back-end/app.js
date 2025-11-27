require("dotenv").config({ silent: true });
// import and instantiate express
const express = require("express") // CommonJS import style!
const axios = require("axios"); 
const cors = require("cors");
const multer = require('multer');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwtStrategy = require('./config/jwt-config.js')
const path = require("path");
const profileRouter = require("./routes/profile");
const boardFeedRouter = require("./routes/boardfeed");
const createBoardRouter = require("./routes/createBoard");
const viewBoardsRouter = require("./routes/viewBoards");
const editBoardRouter = require("./routes/editBoard");
const leaveBoardRouter = require("./routes/leaveBoard");
const signupRouter = require("./routes/signup");
const { setupGoogleSignupStrategy } = require("./routes/signup");
const membersRouter = require("./routes/members");
const authenticationRoutes = require('./routes/authentication-routes.js');

const {
  ensureFriendsCache,
  filterFriendsByQuery,
  getFriendsCacheMeta,
  getFriendRequests,
  getFriendRequestsCount,
  findFriendRequest,
  removeFriendRequest,
  addFriendFromRequest,
} = require("./services/friendsService");
const app = express() // instantiate an Express object

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// we will put some server logic here later...

//fall-back data
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
 //ROUTES

  //GET


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

    const cacheMeta = getFriendsCacheMeta();
    res.json({
      data,
      meta: {
        total: friends.length,
        count: data.length,
        filtered,
        filterType,
        cacheSource: cacheMeta.cacheSource,
        cachedAt: cacheMeta.cachedAt,
        ttlMs: cacheMeta.ttlMs,
      },
    });
  });

  app.get("/api/friend-requests", (req, res) => {
    res.json({
      data: getFriendRequests(),
      meta: { count: getFriendRequestsCount() },
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
      remainingRequests: getFriendRequestsCount(),
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
      remainingRequests: getFriendRequestsCount(),
    });
  });

//log-in with Google

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'default-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(jwtStrategy);

// Only configure Google OAuth if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
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
} else {
  console.warn("Google OAuth credentials not found. Google login will be disabled.");
}

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
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
} else {
  app.get("/auth/google", (req, res) => {
    res.status(503).json({ error: "Google OAuth is not configured" });
  });
}

app.get("/login-failed", (req, res) => {
  res.status(401).json({ error: "Login failed" });
});

app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("http://localhost:3000/");
  });
});

//signup - setup Google OAuth strategy
setupGoogleSignupStrategy(passport);

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  app.get(
    '/auth/google/signup',
    passport.authenticate('google-signup', { scope: ['profile', 'email'] })
  );

  app.get(
    '/auth/google/signup/callback',
    passport.authenticate('google-signup', {
      failureRedirect: 'http://localhost:3000/signup?error=google_signup_failed',
    }),
    (req, res) => {
      // Set session user after successful authentication
      if (req.user && req.session) {
        req.session.user = {
          id: req.user._id.toString(),
          username: req.user.username,
          name: req.user.name,
          email: req.user.email,
        };
      }
      res.redirect('http://localhost:3000/home');
    }
  );
} else {
  app.get('/auth/google/signup', (req, res) => {
    res.status(503).json({ error: "Google OAuth is not configured" });
  });
}

// POST 

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

//signup routes - handled by signup router

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

//serve static files from uploads folder
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

//profile routes
app.use("/api/profile", profileRouter);

// view boards router 
app.use("/api/boards", viewBoardsRouter);

//board routes
app.use("/api/boards", boardFeedRouter);

//createBoard router
app.use("/api/boards/create", createBoardRouter);

//edit form Boards
app.use("/api/boards", editBoardRouter);

//leave board
app.use("/api/boards", leaveBoardRouter);

//signup routes
app.use("/", signupRouter);

// JWT authentication routes
app.use('/auth', authenticationRoutes())

// members routes
app.use("/api/members", membersRouter);

// export the express app we created to make it available to other modules
module.exports = app
