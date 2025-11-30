
const express = require("express");
const router = express.Router();
const Board = require("../models/Board");
const passport = require("passport");

router.get(
  "/browse",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const userId = req.user._id;

      const boards = await Board.aggregate([
        {
          $match: {
            owner: { $ne: userId },
            members: { $ne: userId },
          },
        },
        { $sample: { size: 10 } },
        {
          $project: {
            id: "$_id",
            title: 1,
            descriptionLong: 1,
            coverPhotoURL: 1,
            isJoined: false,
            memberCount: { $size: "$members" },
          },
        },
      ]);

      res.json({
        status: "success",
        data: boards,
      });
    } catch (err) {
      console.error("[BROWSE BOARDS ERROR]", err);
      res.status(500).json({
        status: "error",
        message: "Failed to load suggested boards",
      });
    }
  }
);
