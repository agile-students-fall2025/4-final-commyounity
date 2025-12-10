// routes/editBoard.js
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
// Multer + Cloudinary Storage
// ----------------------------
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "commyounity_boards",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, crop: "limit" }],
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed"));
    }
    cb(null, true);
  },
});

// ----------------------------
// EDIT BOARD (Cloudinary)
// ----------------------------
router.post(
  "/:id/edit",
  passport.authenticate("jwt", { session: false }),
  upload.single("photo"), // now uploaded to cloudinary instead of /uploads
  async (req, res) => {
    const { id } = req.params;
    const { title, descriptionLong } = req.body;
    const newFile = req.file;

    try {
      const board = await Board.findById(id);

      if (!board) {
        return res.status(404).json({
          status: "error",
          message: "Board not found",
        });
      }

      console.log("[EDIT BOARD RECEIVED]", {
        boardId: id,
        title,
        descriptionLong,
        hasFile: !!newFile,
        user: req.user.username,
      });

      // Update text fields
      if (typeof title === "string" && title.trim() !== "") {
        board.title = title.trim();
      }
      if (typeof descriptionLong === "string") {
        board.descriptionLong = descriptionLong.trim();
      }

      // If a new image was uploaded → replace Cloudinary URL
      if (newFile && newFile.path) {
        board.coverPhotoURL = newFile.path; // Cloudinary returns .path as the full hosted URL
      }

      const updated = await board.save();

      return res.status(200).json({
        status: "updated",
        data: updated,
        updatedAt: new Date().toISOString(),
      });

    } catch (err) {
      console.error("[EDIT BOARD ERROR]", err);

      return res.status(500).json({
        status: "error",
        message: "Failed to edit board",
        error: err.message,
      });
    }
  }
);

module.exports = router;