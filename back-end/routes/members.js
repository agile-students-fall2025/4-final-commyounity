// routes/members.js
const express = require("express");
const router = express.Router();
const passport = require("passport");
const mongoose = require("mongoose");
const Board = require("../models/Board");
const User = require("../models/User");

// GET /api/members/:boardId
router.get(
  "/:boardId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const { boardId } = req.params;

      if (!mongoose.isValidObjectId(boardId)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid board id",
        });
      }

      const board = await Board.findById(boardId).lean();
      if (!board) {
        return res.status(404).json({
          status: "error",
          message: "Board not found",
        });
      }

      const currentUserId = req.user._id.toString();

      // --- Build participants: OWNER + ALL MEMBERS (no duplicates) ---
      const participants = [];
      const seen = new Set();

      // owner (always include)
      if (board.owner) {
        const ownerId = board.owner.toString();
        participants.push({ userId: ownerId, isOwner: true });
        seen.add(ownerId);
      }

      // members (always include)
      (board.members || []).forEach((m) => {
        const id = (m._id || m).toString();
        if (seen.has(id)) return;
        seen.add(id);
        participants.push({ userId: id, isOwner: false });
      });

      console.log("[MEMBERS DEBUG] boardId=", boardId, {
        owner: board.owner?.toString(),
        members: (board.members || []).map(m => (m._id || m).toString()),
        participants,
      });

      if (participants.length === 0) {
        return res.json({
          status: "success",
          data: [],
          meta: { boardId, count: 0 },
        });
      }

      // Fetch user docs for all participants
      const userIds = participants.map((p) => p.userId);
      const users = await User.find({ _id: { $in: userIds } })
        .select("username name email avatar")
        .lean();

      const userById = new Map(users.map((u) => [u._id.toString(), u]));

      const members = participants
        .map((p) => {
          const u = userById.get(p.userId);
          if (!u) return null;
          return {
            id: p.userId,
            username: u.username,
            name: u.name,
            email: u.email,
            avatar: u.avatar || `https://i.pravatar.cc/100?u=${p.userId}`,
            isOwner: p.isOwner,
            isSelf: p.userId === currentUserId, // optional for UI badges
          };
        })
        .filter(Boolean);

      console.log("[MEMBERS DEBUG] response count=", members.length);

      return res.json({
        status: "success",
        data: members,
        meta: {
          boardId: board._id.toString(),
          count: members.length,
        },
      });
    } catch (err) {
      console.error("[GET BOARD MEMBERS ERROR]", err);
      return res.status(500).json({
        status: "error",
        message: "Failed to load members",
        error: err.message,
      });
    }
  }
);

module.exports = router;