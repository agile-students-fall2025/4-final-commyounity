const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const passport = require("passport"); 
const Board = require("../models/Board");

// ----------------------------
// Ensure uploads directory exists
// ----------------------------
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("[UPLOADS DIR] Created uploads directory:", uploadsDir);
}

// ----------------------------
// Multer Disk Storage
// ----------------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file && !file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image uploads allowed"));
    }
    cb(null, true);
  },
});

// helper to delete uploaded file if we don't want to keep it
function deleteUploadedFile(file) {
  if (!file || !file.path) return;
  fs.unlink(file.path, (err) => {
    if (err) {
      console.warn("[UPLOAD CLEANUP ERROR]", err.message);
    }
  });
}

// ----------------------------
// CREATE BOARD 
// ----------------------------
router.post(
  "/",
  passport.authenticate("jwt", { session: false }), // ⬅️ must be authenticated
  upload.single("photo"),
  async (req, res) => {
    try {
      const title = (req.body.title || "").trim();
      const descriptionLong = (req.body.descriptionLong || "").trim();

      if (!title) {
        deleteUploadedFile(req.file);
        return res.status(400).json({
          status: "error",
          message: "Title is required."
        });
      }

      if (!req.file) {
        return res.status(400).json({
          status: "error",
          message: "A cover photo is required."
        });
      }

      // passport-jwt should have put the user document into req.user
      if (!req.user) {
        deleteUploadedFile(req.file);
        return res.status(401).json({
          status: "error",
          message: "Not authenticated.",
        });
      }

      const ownerId = String(req.user._id || req.user.id);
      const coverPhotoURL = `http://localhost:4000/uploads/${req.file.filename}`;

      const createdBoard = await Board.create({
        title,
        descriptionLong,
        owner: ownerId,
        members: [ownerId],
        coverPhotoURL,
      });

      const response = {
        ...createdBoard.toObject(),
        isOwner: true,
        isJoined: true,
        memberCount: createdBoard.members.length,
      };

      console.log("[BOARD CREATE]", {
        boardId: createdBoard._id,
        owner: ownerId,
        title,
        descriptionLong,
      });

      return res.status(201).json({
        status: "created",
        data: response,
      });

    } catch (err) {
      deleteUploadedFile(req.file);

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