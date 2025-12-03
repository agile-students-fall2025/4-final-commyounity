// routes/browseBoards.js
const express = require("express");
const passport = require("passport");
const Board = require("../models/Board");
const mongoose = require("mongoose");
const router = express.Router();

/**
 * GET /api/browse/boards
 * Return boards that the current user does NOT own and is NOT a member of
 */
router.get(
  "/boards",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const userId = new mongoose.Types.ObjectId(req.user._id);

      // Find boards where:
      //  - owner is NOT the current user
      //  - members array does NOT contain the current user
      const boards = await Board.find({
        owner: { $ne: userId },
        members: { $nin: [userId] },
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      const data = boards.map((b) => ({
        id: b._id.toString(),
        title: b.title,
        descriptionLong: b.descriptionLong || "",
        coverPhotoURL: b.coverPhotoURL || "",
        memberCount: Array.isArray(b.members) ? b.members.length : 0,
      }));

      return res.json({
        status: "success",
        data,
      });
    } catch (err) {
      console.error("[BROWSE BOARDS ERROR]", err);
      return res.status(500).json({
        status: "error",
        message: "Failed to load suggested boards",
        error: err.message,
      });
    }
  }
);

module.exports = router;