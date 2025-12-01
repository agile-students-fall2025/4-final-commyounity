require("dotenv").config({ silent: true });
// import and instantiate express
const express = require("express") // CommonJS import style!
const axios = require("axios"); 
const cors = require("cors");
const path = require("path");
const profileRouter = require("./routes/profile");
const boardFeedRouter = require("./routes/boardfeed");
const createBoardRouter = require("./routes/createBoard");
const viewBoardsRouter = require("./routes/viewBoards");
const editBoardRouter = require("./routes/editBoard");
const leaveBoardRouter = require("./routes/leaveBoard");
const membersRouter = require("./routes/members");
const authenticationRoutes = require('./routes/authentication-routes.js');
const protectedRoutes = require('./routes/protected-routes'); 
const boardInvitesRouter = require("./routes/boardInvites");
const passport = require('passport');
const jwtStrategy = require('./config/jwt-config.js');
const kickMemberRouter = require("./routes/kickMember");
const findMembersRouter = require("./routes/searchMembers");
const browseBoardsRouter = require("./routes/browseBoards");
const joinBoardRouter = require("./routes/joinBoard");



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

app.use(passport.initialize());
passport.use(jwtStrategy);

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
    const ownerId = req.user?._id;

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

    try {
      let friends;
      let filtered = false;
      let filterType = null;

      if (hasExactUsername) {
        filtered = true;
        filterType = "username";
        friends = await ensureFriendsCache({
          ownerId,
          username: rawUsername,
        });
      } else if (hasSearch) {
        filtered = true;
        filterType = "search";
        friends = await filterFriendsByQuery(rawSearch, { ownerId });
      } else {
        friends = await ensureFriendsCache({ ownerId });
      }

      const data = limit ? friends.slice(0, limit) : friends;
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
    } catch (error) {
      console.error("Unable to load friends from Mongo.", error);
      res.status(500).json({ error: "Unable to load friends list." });
    }
  });

  app.get("/api/friend-requests", async (req, res) => {
    try {
      const ownerId = req.user?._id;
      const data = await getFriendRequests(ownerId);
      const count = await getFriendRequestsCount(ownerId);
      res.json({
        data,
        meta: { count },
      });
    } catch (error) {
      console.error("Unable to load friend requests.", error);
      res.status(500).json({ error: "Unable to load friend requests." });
    }
  });

  app.post("/api/friend-requests/:id/accept", async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user?._id;
    try {
      const match = await findFriendRequest(id, ownerId);
      if (!match) {
        return res.status(404).json({ error: "Friend request not found." });
      }

      const friend = await addFriendFromRequest(match, ownerId);
      await removeFriendRequest(id, ownerId);
      const remainingRequests = await getFriendRequestsCount(ownerId);
      res.json({
        status: "accepted",
        friend,
        remainingRequests,
      });
    } catch (error) {
      console.error("Unable to accept friend request.", error);
      res.status(500).json({ error: "Unable to accept friend request." });
    }
  });

  app.post("/api/friend-requests/:id/decline", async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user?._id;
    try {
      const match = await findFriendRequest(id, ownerId);
      if (!match) {
        return res.status(404).json({ error: "Friend request not found." });
      }

      await removeFriendRequest(id, ownerId);
      const remainingRequests = await getFriendRequestsCount(ownerId);
      res.json({
        status: "declined",
        declinedRequest: { id: match.id, username: match.username },
        remainingRequests,
      });
    } catch (error) {
      console.error("Unable to decline friend request.", error);
      res.status(500).json({ error: "Unable to decline friend request." });
    }
  });


// POST 

//BROWSE boards
app.use("/api/browse", browseBoardsRouter);

//serve static files from uploads folder
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

//profile routes
app.use("/api/profile", profileRouter);

// view boards router 
app.use("/api/boards", viewBoardsRouter);

//invites
app.use("/api/boardinvites", boardInvitesRouter);

//board routes
app.use("/api/boards", boardFeedRouter);

//createBoard router
app.use("/api/boards/create", createBoardRouter);

//edit form Boards
app.use("/api/boards", editBoardRouter);

//leave board
app.use("/api/boards", leaveBoardRouter);

// join board
app.use("/api/boards", joinBoardRouter);

// JWT authentication routes
app.use('/auth', authenticationRoutes())

// members routes
app.use("/api/members", membersRouter);

// protected routes (everything here requires JWT)
app.use('/protected', protectedRoutes()) // /protected, /protected/profile, /protected/settings, etc.

//kick
app.use("/api/boards", kickMemberRouter);

//find members
app.use("/api/searches", findMembersRouter);

// export the express app we created to make it available to other modules
module.exports = app
