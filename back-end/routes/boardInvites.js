// routes/boardInvites.js
const express = require("express");
const passport = require("passport");
const mongoose = require("mongoose");
const Board = require("../models/Board");
const BoardInvite = require("../models/BoardInvite");
const User = require("../models/User");

const router = express.Router();

/**
 * GET /api/boardinvites/:id/friends
 * Candidates to invite to a specific board (ONLY your friends).
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

      // 4) Load current user's friends (expects a "friends" array on User, but
      //    will safely fall back to an empty array if it doesn't exist yet).
      const me = await User.findById(currentUserId)
        .select("friends")
        .lean();

      const friendIds = Array.isArray(me?.friends)
        ? me.friends.map((id) => id.toString())
        : [];

      // If there are no friends recorded, return an empty list
      if (friendIds.length === 0) {
        return res.json({
          status: "success",
          data: [],
          meta: {
            count: 0,
            search,
          },
        });
      }

      // 5) Build base query for users:
      //    - must be in my friends list
      //    - must NOT be me, existing members, or already invited
      const userQuery = {
        _id: {
          $in: friendIds,
          $nin: [
            currentUserId,
            ...Array.from(memberIds),
            ...Array.from(pendingIds),
          ],
        },
      };

      // Optional search filter
      if (search) {
        userQuery.$or = [
          { username: { $regex: search, $options: "i" } },
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      // 6) Get possible invitees
      const users = await User.find(userQuery)
        .select("_id username name email")
        .limit(50)
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
 * POST /api/boardinvites/:id/invite
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

      if (
        !mongoose.isValidObjectId(id) ||
        !mongoose.isValidObjectId(invitedUserId)
      ) {
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

/**
 * GET /api/boardinvites/invites
 * Pending board invites for the CURRENT USER
 */
router.get(
  "/invites",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const userId = req.user._id;

      const invites = await BoardInvite.find({
        invitedUserId: userId,
        status: "pending",
      })
        .populate("boardId", "title coverPhotoURL")
        .populate("invitedBy", "username name email")
        .lean();

      const data = invites.map((inv) => ({
        id: inv._id.toString(),
        boardId: inv.boardId?._id?.toString(),
        boardTitle: inv.boardId?.title || "Untitled board",
        boardCoverPhotoURL: inv.boardId?.coverPhotoURL || null,
        invitedById: inv.invitedBy?._id?.toString(),
        invitedByName:
          inv.invitedBy?.name || inv.invitedBy?.username || "Someone",
        invitedByUsername: inv.invitedBy?.username || null,
        status: inv.status,
        createdAt: inv.createdAt,
      }));

      return res.json({
        status: "success",
        data,
      });
    } catch (err) {
      console.error("[BOARD INVITES LIST ERROR]", err);
      return res.status(500).json({
        status: "error",
        message: "Failed to load board invites.",
        error: err.message,
      });
    }
  }
);

/**
 * POST /api/boardinvites/invites/:inviteId/accept
 */
router.post(
  "/invites/:inviteId/accept",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const { inviteId } = req.params;
      const userId = req.user._id;

      if (!mongoose.isValidObjectId(inviteId)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid invite id",
        });
      }

      const invite = await BoardInvite.findOne({
        _id: inviteId,
        invitedUserId: userId,
        status: "pending",
      }).exec();

      if (!invite) {
        return res.status(404).json({
          status: "error",
          message: "Invite not found or already handled.",
        });
      }

      const board = await Board.findById(invite.boardId).exec();
      if (!board) {
        invite.status = "declined";
        await invite.save();
        return res.status(404).json({
          status: "error",
          message: "Board no longer exists.",
        });
      }

      const alreadyMember = (board.members || []).some(
        (m) => m.toString() === userId.toString()
      );

      if (!alreadyMember) {
        board.members.push(userId);
        await board.save();
      }

      invite.status = "accepted";
      await invite.save();

      return res.json({
        status: "success",
        message: "You joined the board.",
        data: {
          boardId: board._id.toString(),
          boardTitle: board.title,
        },
      });
    } catch (err) {
      console.error("[BOARD INVITE ACCEPT ERROR]", err);
      return res.status(500).json({
        status: "error",
        message: "Failed to accept invite.",
        error: err.message,
      });
    }
  }
);

/**
 * POST /api/boardinvites/invites/:inviteId/decline
 */
router.post(
  "/invites/:inviteId/decline",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const { inviteId } = req.params;
      const userId = req.user._id;

      if (!mongoose.isValidObjectId(inviteId)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid invite id",
        });
      }

      const invite = await BoardInvite.findOne({
        _id: inviteId,
        invitedUserId: userId,
        status: "pending",
      }).exec();

      if (!invite) {
        return res.status(404).json({
          status: "error",
          message: "Invite not found or already handled.",
        });
      }

      invite.status = "declined";
      await invite.save();

      return res.json({
        status: "success",
        message: "Board invite declined.",
      });
    } catch (err) {
      console.error("[BOARD INVITE DECLINE ERROR]", err);
      return res.status(500).json({
        status: "error",
        message: "Failed to decline invite.",
        error: err.message,
      });
    }
  }
);

module.exports = router;