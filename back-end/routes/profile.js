// back-end/routes/profile.js
const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// simple authentication middleware
function ensureAuthed(req, res, next) {
  if ((req.isAuthenticated && req.isAuthenticated()) || (req.session && req.session.user)) {
    // userID
    req.userId =
      req.user?.id ||
      req.session?.user?.id ||
      "dev-user-1";
    req.displayName = req.user?.displayName || req.session?.user?.name || "User";
    req.username = req.user?.emails?.[0]?.value?.split("@")[0] || req.session?.user?.username || "user";
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
}

// simple in-memory profile store
const profiles = new Map(); // key: userId

// profile avatar upload config
const uploadDir = path.join(process.cwd(), "uploads");
const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

// read personal profile
router.get("/profile/me", ensureAuthed, (req, res) => {
  const cur = profiles.get(req.userId) || {
    name: req.displayName,
    handle: `@${req.username}`,
    about: "Tell us about you…",
    background: "",
    interests: "",
    avatarUrl: null,
  };
  profiles.set(req.userId, cur);
  res.json(cur);
});

// update personal profile
router.put("/profile/me", ensureAuthed, express.json(), (req, res) => {
  const cur = profiles.get(req.userId) || {};
  const next = {
    ...cur,
    name: req.body.name ?? cur.name,
    handle: req.body.handle ?? cur.handle,
    about: req.body.about ?? cur.about,
    background: req.body.background ?? cur.background,
    interests: req.body.interests ?? cur.interests,
  };
  profiles.set(req.userId, next);
  res.json({ ok: true, profile: next });
});

// upload avatar
router.post("/profile/me/avatar", ensureAuthed, upload.single("avatar"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  const cur = profiles.get(req.userId) || {};
  const avatarUrl = `/uploads/${req.file.filename}`;
  profiles.set(req.userId, { ...cur, avatarUrl });
  res.json({ ok: true, avatarUrl });
});

// delete profile
router.delete("/profile/me", ensureAuthed, (req, res) => {
  profiles.delete(req.userId);
  res.json({ ok: true });
});

module.exports = router;
