// routes/kickMember.js
const express = require("express");
const passport = require("passport");
const mongoose = require("mongoose");
const Board = require("../models/Board");

const router = express.Router();

/**
 * POST /api/boards/:id/kick-member
 */
router.post(
  "/:id/kick-member",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const boardId = req.params.id;
      const { memberId } = req.body || {};
      const requesterId = req.user._id.toString();

      if (!memberId) {
        return res.status(400).json({
          status: "error",
          message: "memberId is required",
        });
      }

      if (
        !mongoose.isValidObjectId(boardId) ||
        !mongoose.isValidObjectId(memberId)
      ) {
        return res.status(400).json({
          status: "error",
          message: "Invalid boardId or memberId",
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

      // 2) Only the owner can kick members
      const isOwner = board.owner?.toString() === requesterId;
      if (!isOwner) {
        return res.status(403).json({
          status: "error",
          message: "Only the board owner can remove members.",
        });
      }

      // 3) Don't allow kicking the owner
      if (memberId === board.owner.toString()) {
        return res.status(400).json({
          status: "error",
          message: "You cannot remove the board owner.",
        });
      }

      const members = Array.isArray(board.members) ? board.members : [];

      // 4) Check if user is actually a member
      const isMember = members.some((m) => m.toString() === memberId);
      if (!isMember) {
        return res.status(404).json({
          status: "error",
          message: "User is not a member of this board.",
        });
      }

      // 5) Remove member from the board
      board.members = members.filter((m) => m.toString() !== memberId);
      await board.save();

      console.log("[KICK MEMBER]", {
        boardId: board._id.toString(),
        kickedMemberId: memberId,
        memberCountPrev: members.length,
        memberCountNew: board.members.length,
        by: requesterId,
        at: new Date().toISOString(),
      });

      return res.status(200).json({
        status: "success",
        message: "Member removed from the board.",
        data: {
          boardId: board._id.toString(),
          kickedMemberId: memberId,
          memberCount: board.members.length,
        },
      });
    } catch (err) {
      console.error("[KICK MEMBER ERROR]", err);
      return res.status(500).json({
        status: "error",
        message: "Failed to remove member from the board.",
        error: err.message,
      });
    }
  }
);

module.exports = router;