// routes/boardInvites.js
const express = require("express");
const passport = require("passport");
const mongoose = require("mongoose");
const Board = require("../models/Board");
const BoardInvite = require("../models/BoardInvite");
const User = require("../models/User");   // ⬅️ NEW: to query users

const router = express.Router();

/**
 * GET /api/boards/:id/friends
 *
 * Return a list of "friends" the user can invite to this board.
 * For now: all users except:
 *  - the current logged-in user
 *  - users who are already board members
 *  - users who already have a pending invite for this board
 *
 * Optional query param: ?q=searchTerm to filter by username or name.
 */
router.get(
  "/:id/friends",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const boardId = req.params.id;
      const currentUserId = req.user._id.toString();
      const search = (req.query.q || "").trim();

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

      // 2) Determine who is already in the board (owner + members)
      const memberIds = new Set(
        [
          board.owner?.toString(),
          ...(board.members || []).map((m) => m.toString()),
        ].filter(Boolean)
      );

      // 3) Find pending invites for this board
      const pendingInvites = await BoardInvite.find({
        boardId: board._id,
        status: "pending",
      }).select("invitedUserId");

      const pendingIds = new Set(
        pendingInvites.map((inv) => inv.invitedUserId.toString())
      );

      // 4) Build base query for users
      const userQuery = {
        _id: {
          $nin: [
            currentUserId,                // not myself
            ...Array.from(memberIds),     // not existing members
            ...Array.from(pendingIds),    // not already invited (pending)
          ],
        },
      };

      // Optional text filter
      if (search) {
        userQuery.$or = [
          { username: { $regex: search, $options: "i" } },
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      // 5) Get possible invitees
      const users = await User.find(userQuery)
        .select("_id username name email")
        .limit(50)               // just to be safe
        .lean();

      return res.json({
        status: "success",
        data: users.map((u) => ({
          id: u._id.toString(),
          username: u.username,
          name: u.name,
          email: u.email,
        })),
        meta: {
          count: users.length,
          search,
        },
      });
    } catch (err) {
      console.error("[BOARD FRIENDS ERROR]", err);
      return res.status(500).json({
        status: "error",
        message: "Failed to load friends for this board.",
        error: err.message,
      });
    }
  }
);

/**
 * POST /api/boards/:id/invite
 * Body: { invitedUserId: "<User._id of the friend>" }
 */
router.post(
  "/:id/invite",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { invitedUserId } = req.body || {};

      if (!invitedUserId) {
        return res.status(400).json({
          status: "error",
          message: "invitedUserId is required",
        });
      }

      if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(invitedUserId)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid boardId or invitedUserId",
        });
      }

      // 1) Make sure board exists
      const board = await Board.findById(id).exec();
      if (!board) {
        return res.status(404).json({
          status: "error",
          message: "Board not found",
        });
      }

      const senderId = req.user._id.toString();

      // 2) Only members can invite
      const isOwner = board.owner?.toString() === senderId;
      const isMember = (board.members || []).some(
        (m) => m.toString() === senderId
      );

      if (!isOwner && !isMember) {
        return res.status(403).json({
          status: "error",
          message: "Only board members can send invites.",
        });
      }

      // 3) Ensure invited user is NOT already a member
      const alreadyMember = (board.members || []).some(
        (m) => m.toString() === invitedUserId
      );

      if (alreadyMember) {
        return res.status(409).json({
          status: "error",
          message: "This user is already a member of the board.",
        });
      }

      // 4) Ensure there is no existing pending invite
      const existing = await BoardInvite.findOne({
        boardId: board._id,
        invitedUserId,
        status: "pending",
      }).exec();

      if (existing) {
        return res.status(409).json({
          status: "error",
          message: "An invite is already pending for this user on this board.",
        });
      }

      // 5) Create and save invite
      const invite = await BoardInvite.create({
        boardId: board._id,
        invitedUserId,
        invitedBy: senderId,
        status: "pending",
      });

      console.log("[BOARD INVITE CREATED]", {
        boardId: invite.boardId.toString(),
        invitedUserId: invite.invitedUserId.toString(),
        invitedBy: invite.invitedBy.toString(),
      });

      return res.status(201).json({
        status: "created",
        message: "Invite sent.",
        data: {
          id: invite._id.toString(),
          boardId: invite.boardId.toString(),
          invitedUserId: invite.invitedUserId.toString(),
          invitedBy: invite.invitedBy.toString(),
          status: invite.status,
          createdAt: invite.createdAt,
        },
      });
    } catch (err) {
      console.error("[BOARD INVITE ERROR]", err);
      return res.status(500).json({
        status: "error",
        message: "Failed to create invite.",
        error: err.message,
      });
    }
  }
);

module.exports = router;