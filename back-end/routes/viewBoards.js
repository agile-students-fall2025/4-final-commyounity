const express = require("express");
const router = express.Router();
const Board = require("../models/Board");
const passport = require("passport"); // ⬅️ add this

// ----------------------------
// GET ALL BOARDS (protected)
// ----------------------------
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      // ✅ real logged-in user from JWT
      const userId = String(req.user._id || req.user.id);

      const boards = await Board.find();

      const processedBoards = boards.map((b) => {
        const obj = b.toObject();

        obj.isOwner = String(obj.owner) === userId;
        obj.isJoined = obj.members.some((m) => String(m) === userId);
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
router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const userId = String(req.user._id || req.user.id);

      const board = await Board.findById(req.params.id);

      if (!board) {
        return res
          .status(404)
          .json({ status: "error", message: "Board not found" });
      }

      const obj = board.toObject();
      obj.isOwner = String(obj.owner) === userId;
      obj.isJoined = obj.members.some((m) => String(m) === userId);
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