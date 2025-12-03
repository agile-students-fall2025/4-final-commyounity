// routes/browseBoards.js
const express = require("express");
const passport = require("passport");
const mongoose = require("mongoose");
const Board = require("../models/Board");

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

      // stricter filter:
      //  - owner is not current user
      //  - members array does not contain current user (if members exist)
      const boards = await Board.find({
        owner: { $ne: userId },
        members: { $exists: true, $nin: [userId] },
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