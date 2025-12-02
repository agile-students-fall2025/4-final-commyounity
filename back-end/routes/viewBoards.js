const express = require("express");
const router = express.Router();
const Board = require("../models/Board");
const passport = require("passport");

// Allow requests to proceed even if JWT is missing/invalid; attach user when valid
const optionalJwt = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err) return next(err);
    req.user = user || null;
    return next();
  })(req, res, next);
};

// ----------------------------
// GET ALL BOARDS (protected)
// ----------------------------
router.get("/", optionalJwt, async (req, res) => {
    try {
      const userId = req.user ? String(req.user._id || req.user.id) : null;

      const boards = await Board.find();

      const processedBoards = boards.map((b) => {
        const obj = b.toObject();

        obj.isOwner = userId ? String(obj.owner) === userId : false;
        obj.isJoined = userId
          ? obj.members.some((m) => String(m) === userId)
          : false;
        obj.memberCount = obj.members.length;

        return obj;
      });

      res.json({ status: "success", data: processedBoards });
    } catch (err) {
      console.error("[GET BOARDS ERROR]", err);
      res
        .status(500)
        .json({ status: "error", message: "Failed to load boards" });
    }
  }
);

// ----------------------------
// GET SINGLE BOARD (protected)
// ----------------------------
router.get("/:id", optionalJwt, async (req, res) => {
    try {
      const userId = req.user ? String(req.user._id || req.user.id) : null;

      const board = await Board.findById(req.params.id);

      if (!board) {
        return res
          .status(404)
          .json({ status: "error", message: "Board not found" });
      }

      const obj = board.toObject();
      obj.isOwner = userId ? String(obj.owner) === userId : false;
      obj.isJoined = userId
        ? obj.members.some((m) => String(m) === userId)
        : false;
      obj.memberCount = obj.members.length;

      res.json({ status: "success", data: obj });
    } catch (err) {
      console.error("[GET BOARD ERROR]", err);
      res
        .status(500)
        .json({ status: "error", message: "Failed to load board" });
    }
  }
);

// ----------------------------
// SEARCH BOARDS (can be public)
// ----------------------------
router.get("/search", async (req, res) => {
  const query = (req.query.query || "").trim();

  if (!query) {
    return res.status(400).json({
      status: "error",
      message: "Query parameter is required",
    });
  }

  try {
    const boards = await Board.find({
      title: { $regex: query, $options: "i" },
    });

    res.json({
      status: "success",
      data: boards,
      meta: { total: boards.length, query },
    });
  } catch (err) {
    console.error("[SEARCH BOARDS ERROR]", err);
    res.status(500).json({
      status: "error",
      message: "Failed to search boards",
    });
  }
});

module.exports = router;
