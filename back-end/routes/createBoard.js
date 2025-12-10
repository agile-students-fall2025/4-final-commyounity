const express = require("express");
const router = express.Router();
const passport = require("passport");
const Board = require("../models/Board");

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// ----------------------------
// Cloudinary Config
// ----------------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ----------------------------
// Cloudinary Storage via Multer
// ----------------------------
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "boards",               // Cloudinary folder name
    allowedFormats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, crop: "limit" }],
  },
});

const upload = multer({ storage });

// ----------------------------
// CREATE BOARD (cloud hosted photo)
// ----------------------------
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  upload.single("photo"),
  async (req, res) => {
    try {
      const title = (req.body.title || "").trim();
      const descriptionLong = (req.body.descriptionLong || "").trim();

      if (!title) {
        return res.status(400).json({
          status: "error",
          message: "Title is required.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          status: "error",
          message: "A cover photo is required.",
        });
      }

      if (!req.user) {
        return res.status(401).json({
          status: "error",
          message: "Not authenticated.",
        });
      }

      const ownerId = req.user._id.toString();

      // Cloudinary URL returned by multer-storage-cloudinary
      const coverPhotoURL = req.file.path;

      const createdBoard = await Board.create({
        title,
        descriptionLong,
        owner: ownerId,
        members: [ownerId],
        coverPhotoURL, // stored in cloud!
      });

      const response = {
        ...createdBoard.toObject(),
        isOwner: true,
        isJoined: true,
        memberCount: createdBoard.members.length,
      };

      console.log("[BOARD CREATE CLOUDINARY]", {
        boardId: createdBoard._id,
        owner: ownerId,
        title,
      });

      return res.status(201).json({
        status: "created",
        data: response,
      });

    } catch (err) {
      console.error("[BOARD CREATE ERROR]", err);
      return res.status(500).json({
        status: "error",
        message: "Failed to create board.",
        error: err.message,
      });
    }
  }
);

module.exports = router;