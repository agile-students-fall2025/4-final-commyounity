const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const passport = require("passport");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const User = require("../models/User");

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
    folder: "profile_photos",
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


// Auth middleware
const requireAuth = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err) return res.status(500).json({ error: "Auth error" });
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    req.user = user;
    next();
  })(req, res, next);
};

const getUserId = (req) => req.user?._id || req.user?.id;

// ==================== GET PROFILE ====================
router.get("/", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(getUserId(req)).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      profilePhoto: user.avatar || null,
      aboutMe: user.aboutMe || "",
      background: user.background || "",
      interests: user.interests || "",
      privacy: user.privacy,
      notifications: user.notifications,
    });
  } catch (err) {
    console.error("[GET PROFILE ERROR]", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ==================== UPDATE TEXT FIELDS ====================
router.put(
  "/",
  requireAuth,
  [
    body("username").optional().isLength({ min: 3, max: 24 })
      .matches(/^[A-Za-z0-9._-]+$/),
    body("name").optional().isLength({ min: 1, max: 100 }),
    body("aboutMe").optional().isLength({ max: 500 }),
    body("background").optional().isLength({ max: 200 }),
    body("interests").optional().isLength({ max: 200 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ error: errors.array()[0].msg });

      const userId = getUserId(req);

      const updated = await User.findByIdAndUpdate(
        userId,
        { $set: req.body },
        { new: true }
      ).select("-password");

      res.json({
        success: true,
        message: "Profile updated",
        profile: updated,
      });
    } catch (err) {
      console.error("[UPDATE PROFILE ERROR]", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ==================== CLOUDINARY UPLOAD ====================
router.post(
  "/photo",
  requireAuth,
  upload.single("profilePhoto"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ error: "No file uploaded" });

      const imageUrl = req.file.path; // Cloudinary generated URL

      await User.findByIdAndUpdate(getUserId(req), { avatar: imageUrl });

      console.log("[CLOUDINARY UPLOAD] Saved:", imageUrl);

      res.json({
        success: true,
        message: "Profile photo updated",
        photoUrl: imageUrl,
      });
    } catch (err) {
      console.error("[PHOTO UPLOAD ERROR]", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ==================== PRIVACY SETTINGS ====================
router.put(
  "/privacy",
  requireAuth,
  [
    body("visibility").optional().isIn(["Public", "Private", "Friends Only"]),
    body("canMessage").optional().isIn(["Everyone", "Friends Only", "No One"]),
    body("onlineStatus").optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const userId = getUserId(req);

      const updated = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            "privacy.visibility": req.body.visibility,
            "privacy.canMessage": req.body.canMessage,
            "privacy.onlineStatus": req.body.onlineStatus,
          },
        },
        { new: true }
      ).select("privacy");

      res.json({
        success: true,
        message: "Privacy updated",
        privacy: updated.privacy,
      });
    } catch (err) {
      console.error("[PRIVACY ERROR]", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ==================== NOTIFICATIONS ====================
router.put(
  "/notifications",
  requireAuth,
  [
    body("boardUpdates").optional().isBoolean(),
    body("newMessages").optional().isBoolean(),
    body("newFollower").optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const userId = getUserId(req);

      const updated = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            "notifications.boardUpdates": req.body.boardUpdates,
            "notifications.newMessages": req.body.newMessages,
            "notifications.newFollower": req.body.newFollower,
          },
        },
        { new: true }
      ).select("notifications");

      res.json({
        success: true,
        message: "Notifications updated",
        notifications: updated.notifications,
      });
    } catch (err) {
      console.error("[NOTIFICATIONS ERROR]", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ==================== CHANGE PASSWORD ====================
router.put(
  "/password",
  requireAuth,
  [
    body("currentPassword").notEmpty(),
    body("newPassword").isLength({ min: 6 }),
  ],
  async (req, res) => {
    try {
      const userId = getUserId(req);
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      if (user.authProvider === "google")
        return res.status(400).json({ error: "Google accounts cannot change password" });

      if (!user.validPassword(currentPassword))
        return res.status(400).json({ error: "Incorrect current password" });

      user.password = newPassword;
      await user.save();

      res.json({ success: true, message: "Password updated" });
    } catch (err) {
      console.error("[PASSWORD ERROR]", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ==================== DELETE ACCOUNT ====================
router.delete("/", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);

    await User.findByIdAndDelete(userId);

    res.json({ success: true, message: "Account deleted" });
  } catch (err) {
    console.error("[DELETE ERROR]", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;