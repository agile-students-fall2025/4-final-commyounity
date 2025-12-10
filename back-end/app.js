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
const User = require("./models/User");
const Friend = require("./models/Friend");
const FriendRequest = require("./models/FriendRequest");


const {
  ensureFriendsCache,
  filterFriendsByQuery,
  getFriendsCacheMeta,
  getFriendRequests,
  getFriendRequestsCount,
  acceptFriendRequest,
  findFriendRequest,
  removeFriendRequest,
  addFriendFromRequest,
  removeFriendship,
  invalidateFriendRequestsCache,
} = require("./services/friendsService");
const { param, validationResult, body } = require("express-validator");
const app = express() // instantiate an Express object

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

app.use(passport.initialize());
passport.use(jwtStrategy);
const requireJwt = passport.authenticate("jwt", { session: false });

// we will put some server logic here later...


 //ROUTES

  //GET


  //get mock data for invite firends
  app.get("/api/friends", requireJwt, async (req, res) => {
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
  const currentUsername = String(req.user?.username || "").toLowerCase();

  if (simulateError) {
    return res.status(503).json({
      error: "Simulated friends service failure.",
      meta: { simulated: true },
      });
    }
  
    // same validation as before
    if (
      hasExactUsername &&
      !/^[A-Za-z0-9._-]+$/.test(rawUsername)
    ) {
      return res.status(400).json({
        error:
          "Username may only include letters, digits, dots (.), underscores (_), or hyphens (-).",
      });
    }

    if (hasExactUsername && rawUsername.toLowerCase() === currentUsername) {
      return res.status(400).json({
        error: "You cannot add yourself as a friend.",
      });
    }
  
    try {
      if (hasExactUsername && !hasSearch) {
        const userDoc = await User.findOne({ username: rawUsername }).lean();
        if (!userDoc) {
          return res.json({
            data: [],
            meta: {
              total: 0,
              count: 0,
              filtered: true,
              filterType: "username",
              cacheSource: "users-collection",
              cachedAt: new Date().toISOString(),
              ttlMs: 0,
            },
          });
        }
  
        const normalized = {
          id: userDoc._id.toString(),
          first_name:
            userDoc.first_name ||
            userDoc.name ||
            userDoc.username,
          last_name: userDoc.last_name || "",
          username: userDoc.username,
          avatar:
            userDoc.avatar ||
            `https://picsum.photos/seed/${userDoc.username}/200/200`,
          online: !!userDoc.online,
        };
  
        return res.json({
          data: [normalized],
          meta: {
            total: 1,
            count: 1,
            filtered: true,
            filterType: "username",
            cacheSource: "users-collection",
            cachedAt: new Date().toISOString(),
            ttlMs: 0,
          },
        });
      }
  
      let friends;
      let filtered = false;
      let filterType = null;
  
      if (hasSearch) {
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

  app.delete(
    "/api/friends/:id",
    requireJwt,
    param("id").isMongoId().withMessage("Invalid friend id."),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        const ownerId = req.user?._id;
        const contactId = req.params.id;
        const removed = await removeFriendship(ownerId, contactId);
        if (!removed) {
          return res.status(404).json({ error: "Friend not found." });
        }
        res.json({ status: "unfriended", removed: contactId });
      } catch (error) {
        console.error("Unable to remove friend.", error);
        res.status(500).json({ error: "Unable to remove friend." });
      }
    }
  );

  app.get("/api/friend-requests", requireJwt, async (req, res) => {
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

  const idValidator = [
    param("id")
      .isMongoId()
      .withMessage("Invalid friend request id."),
  ];
  const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    return next();
  };

  app.post(
    "/api/friend-requests/:id/accept",
    requireJwt,
    idValidator,
    handleValidation,
    async (req, res) => {
      const { id } = req.params;
      const ownerId = req.user?._id;
      try {
        const friend = await acceptFriendRequest(id, ownerId);
        if (!friend) {
          return res.status(404).json({ error: "Friend request not found." });
        }
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
    }
  );

  app.post(
    "/api/friend-requests/:id/decline",
    requireJwt,
    idValidator,
    handleValidation,
    async (req, res) => {
      const { id } = req.params;
      const ownerId = req.user?._id;
      try {
        const match = await findFriendRequest(id, ownerId);
        if (!match) {
          return res.status(404).json({ error: "Friend request not found." });
        }

        /*
         * Decline behavior:
         * - Delete the pending request only
         * - Service clears cache for this owner
         * - No friend document is created
         */
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
    }
  );
//invite route for friends
// SEND A FRIEND REQUEST (invite)
app.post(
  "/api/friend-requests",
  requireJwt,
  [
    body("username")
      .isString()
      .trim()
      .isLength({ min: 3, max: 24 })
      .matches(/^[A-Za-z0-9._-]+$/)
      .withMessage(
        "A valid username is required (letters, digits, dots, underscores, hyphens)."
      ),
    body("message")
      .optional()
      .isString()
      .isLength({ max: 300 })
      .withMessage("Message must be at most 300 characters."),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ error: errors.array()[0].msg, errors: errors.array() });
    }

    try {
      const requesterId = req.user._id; // current logged-in user
      const requesterUsername = (req.user.username || "").toLowerCase();
      const { username, message = "" } = req.body;
      const targetUsername = String(username).toLowerCase().trim();

      // can't invite yourself :)
      if (targetUsername === requesterUsername) {
        return res
          .status(400)
          .json({ error: "You cannot send a friend request to yourself." });
      }

      // find the target user by username
      const targetUser = await User.findOne({ username: targetUsername }).lean();
      if (!targetUser) {
        return res
          .status(404)
          .json({ error: "User not found with that username." });
      }

      const ownerId = targetUser._id; // recipient
      const requesterObjectId = requesterId; // sender

      // already friends?
      const existingFriend = await Friend.findOne({
        owner: ownerId,
        contact: requesterObjectId,
      }).lean();

      if (existingFriend) {
        return res.status(200).json({
          status: "already_friends",
          message: "You are already friends with this user.",
        });
      }

      // do we already have a pending request from this requester → this owner?
      const existingRequest = await FriendRequest.findOne({
        owner: ownerId,
        requester: requesterObjectId,
        status: "pending",
      }).lean();

      if (existingRequest) {
        return res.status(200).json({
          status: "already_pending",
          message: "A friend request is already pending for this user.",
        });
      }

      // build some nice name fields for the request
      const fullName = req.user.name || requesterUsername;
      const [first_name, ...rest] = fullName.split(" ");
      const last_name = rest.join(" ");

      const avatar = req.user.avatar || "";

      const invite = await FriendRequest.create({
        owner: ownerId,
        requester: requesterObjectId,
        username: requesterUsername,
        first_name: first_name || requesterUsername,
        last_name: last_name || "",
        avatar,
        message,
        mutualFriends: 0, // you can compute later if you want
        status: "pending",
      });

      // ensure the recipient sees the new request immediately
      invalidateFriendRequestsCache(ownerId);

      return res.status(201).json({
        status: "pending",
        data: {
          id: invite._id.toString(),
          to: {
            id: ownerId.toString(),
            username: targetUser.username,
          },
          from: {
            id: requesterObjectId.toString(),
            username: requesterUsername,
          },
        },
      });
    } catch (error) {
      console.error("Unable to send friend request.", error);
      return res
        .status(500)
        .json({ error: "Unable to send friend request right now." });
    }
  }
);


//boardfeed routes
app.use("/api/boards", boardFeedRouter);

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
