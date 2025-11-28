const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const passport = require("passport");          
const Board = require("../models/Board");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file && !file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed"));
    }
    cb(null, true);
  },
});

function safeUnlink(filePath) {
  fs.unlink(filePath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error("[EDIT BOARD] Failed to delete file:", filePath, err);
    }
  });
}

// ----------------------------
// EDIT BOARD 
// ----------------------------
router.post(
  "/:id/edit",
  passport.authenticate("jwt", { session: false }),
  upload.single("photo"),
  async (req, res) => {
    const { id } = req.params;
    const { title, descriptionLong } = req.body;
    const newFile = req.file;

    try {
      const board = await Board.findById(id);

      if (!board) {
        if (newFile) {
          const newPath = path.join(process.cwd(), "uploads", newFile.filename);
          safeUnlink(newPath);
        }

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

      if (typeof title === "string" && title.trim() !== "") {
        board.title = title.trim();
      }

      if (typeof descriptionLong === "string") {
        board.descriptionLong = descriptionLong.trim();
      }

      if (newFile) {
        const uploadsDir = path.join(process.cwd(), "uploads");

        if (board.coverPhotoURL) {
          try {
            const urlPath = new URL(board.coverPhotoURL);
            const oldFileName = path.basename(urlPath.pathname);
            const oldFullPath = path.join(uploadsDir, oldFileName);
            safeUnlink(oldFullPath);
          } catch (e) {
            console.warn("[EDIT BOARD] Could not parse old coverPhotoURL:", board.coverPhotoURL);
          }
        }

        const newCoverPhotoURL = `${req.protocol}://${req.get("host")}/uploads/${newFile.filename}`;
        board.coverPhotoURL = newCoverPhotoURL;
      }

      const updated = await board.save();

      return res.status(200).json({
        status: "updated",
        data: updated,
        updatedAt: new Date().toISOString(),
      });

    } catch (err) {
      console.error("[EDIT BOARD ERROR]", err);

      if (newFile) {
        const newPath = path.join(process.cwd(), "uploads", newFile.filename);
        safeUnlink(newPath);
      }

      return res.status(500).json({
        status: "error",
        message: "Failed to edit board",
        error: err.message,
      });
    }
  }
);

module.exports = router;