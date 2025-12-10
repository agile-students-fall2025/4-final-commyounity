const express = require("express");
const router = express.Router();
const Board = require("../models/Board");
const fs = require("fs");
const path = require("path");
const passport = require("passport"); 

router.post(
  "/:id/leave",
  passport.authenticate("jwt", { session: false }), 
  async (req, res) => {
    try {
      const boardId = req.params.id;
      const userId = String(req.user._id || req.user.id);
      const { newOwnerId } = req.body || {};

      const board = await Board.findById(boardId);
      if (!board) {
        return res.status(404).json({
          status: "error",
          message: "Board not found",
        });
      }

      const members = Array.isArray(board.members) ? board.members : [];
      const isOwner = String(board.owner) === userId;
      const isMember = members.some((m) => String(m) === userId);
      const memberCount = members.length;

      if (!isOwner && !isMember) {
        return res.status(403).json({
          status: "error",
          message: "User is not a member of this board",
        });
      }

      // --- CASE 1: Owner leaves & is the ONLY member
      if (isOwner && memberCount === 1) {
        const coverPhotoURL = board.coverPhotoURL;

        if (coverPhotoURL) {
          try {
            const filename = path.basename(coverPhotoURL);
            const filePath = path.join(process.cwd(), "uploads", filename);

            console.log("[DELETE COVER IMAGE] trying", filePath);
            await fs.promises.unlink(filePath);
            console.log("[DELETE COVER IMAGE] success");
          } catch (err) {
            if (err.code === "ENOENT") {
              console.warn("[DELETE COVER IMAGE] file not found on disk");
            } else {
              console.error("[DELETE COVER IMAGE ERROR]", err);
            }
          }
        }

        await Board.findByIdAndDelete(boardId);
        console.log(`[BOARD DELETED] ${boardId} by owner ${userId}`);

        return res.status(200).json({
          status: "success",
          message: "Owner left and was the only member — board deleted",
          boardDeleted: true,
        });
      }

      // --- CASE 2: Owner leaves but others exist
      if (isOwner && memberCount > 1) {
        // Automatically pick the next owner from current members (excluding the leaving owner)
        const candidates = members.filter((m) => String(m) !== userId);
        const nextOwnerId =
          newOwnerId && candidates.includes(newOwnerId.toString())
            ? newOwnerId
            : candidates[0];

        if (!nextOwnerId) {
          return res.status(400).json({
            status: "error",
            message: "No eligible member found to transfer ownership.",
          });
        }

        board.owner = nextOwnerId;
        console.log(
          `[NEW OWNER SET] Board ${boardId}: ${userId} → ${nextOwnerId}`
        );
      }

      // --- CASE 3: regular member, or owner after transfer
      board.members = members.filter((m) => String(m) !== userId);

      await board.save();

      return res.status(200).json({
        status: "success",
        message: isOwner
          ? "Owner left and ownership transferred"
          : "Member left the board",
        boardId,
        newOwner: board.owner,
        updatedMemberCount: board.members.length,
      });
    } catch (err) {
      console.error("[LEAVE BOARD ERROR]", err);
      return res.status(500).json({
        status: "error",
        message: "Failed to leave board",
      });
    }
  }
);

module.exports = router;
