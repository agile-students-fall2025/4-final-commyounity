// routes/joinBoard.js
const express = require("express");
const passport = require("passport");
const mongoose = require("mongoose");
const Board = require("../models/Board");

const router = express.Router();

/**
 * POST /api/boards/:id/join
 * Current logged-in user joins the board.
 */
router.post(
  "/:id/join",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const boardId = req.params.id;
      const userId = req.user._id.toString();

      // 0) Validate boardId
      if (!mongoose.isValidObjectId(boardId)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid board id",
        });
      }

      // 1) Load board
      const board = await Board.findById(boardId).exec();
      if (!board) {
        return res.status(404).json({
          status: "error",
          message: "Board not found",
        });
      }

      // 2) Check if already owner or member
      const isOwner = board.owner?.toString() === userId;
      const isMember = (board.members || []).some(
        (m) => m.toString() === userId
      );

      if (isOwner || isMember) {
        return res.status(409).json({
          status: "error",
          message: "You are already a member of this board.",
        });
      }

      // 3) Add user as member
      board.members = [...(board.members || []), req.user._id];
      await board.save();

      console.log("[JOIN BOARD]", {
        boardId: board._id.toString(),
        userId,
        memberCount: board.members.length,
      });

      return res.json({
        status: "success",
        message: "You joined the board.",
        data: {
          boardId: board._id.toString(),
          memberCount: board.members.length,
        },
      });
    } catch (err) {
      console.error("[JOIN BOARD ERROR]", err);
      return res.status(500).json({
        status: "error",
        message: "Failed to join board.",
        error: err.message,
      });
    }
  }
);

module.exports = router;