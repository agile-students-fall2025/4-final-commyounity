const express = require("express");
const router = express.Router();
const passport = require("passport");
const BoardFeed = require("../models/BoardFeed");
const User = require("../models/User.js");

function resolveAvatarUrl(raw, req) {
  if (!raw) return "";
  const isHttp = /^https?:\/\//i.test(raw);
  if (isHttp) return raw;
  if (raw.startsWith("/")) {
    return `${req.protocol}://${req.get("host")}${raw}`;
  }
  return raw;
}

// GET FEED
router.get("/:id/feed", async (req, res) => {
  try {
    const posts = await BoardFeed.find({ boardId: req.params.id })
      .sort({ createdAt: -1 })
      .lean();

    // Build author -> avatar map from User collection
    const authors = Array.from(
      new Set(
        (posts || [])
          .map((p) => (p && p.author ? String(p.author).toLowerCase() : ""))
          .filter(Boolean)
      )
    );

    let avatarByAuthor = {};
    if (authors.length > 0) {
      const users = await User.find({ username: { $in: authors } })
        .select("username avatar")
        .lean();
      for (const u of users) {
        if (!u || !u.username) continue;
        avatarByAuthor[String(u.username).toLowerCase()] = u.avatar || "";
      }
    }

    const enriched = posts.map((p) => {
      const key = String(p.author || "").toLowerCase();
      const latest = avatarByAuthor[key] || p.avatar || "";
      return {
        ...p,
        id: String(p._id || ""),
        avatar: resolveAvatarUrl(latest, req),
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: "Failed to load feed." });
  }
});

// CREATE POST
router.post(
  "/:id/feed",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const { message } = req.body;

      if (!message || typeof message !== "string")
        return res.status(400).json({ error: "Message required" });

      // Fetch latest avatar from User schema
      let latestAvatar = "";
      try {
        const dbUser = await User.findById(req.user._id)
          .select("avatar username")
          .lean();
        latestAvatar = (dbUser && dbUser.avatar) || "";
      } catch (_) {}

      const post = await BoardFeed.create({
        boardId: req.params.id,
        message: message.trim(),
        author: req.user.username,
        avatar: latestAvatar || req.user.avatar || null,
        likes: 0,
        likedBy: [],
      });

      const plain = post.toObject ? post.toObject() : post;
      plain.id = String(plain._id || "");
      plain.avatar = resolveAvatarUrl(plain.avatar, req);
      res.json(plain);
    } catch (err) {
      res.status(500).json({ error: "Failed to post message." });
    }
  }
);

// LIKE / UNLIKE
router.post(
  "/:id/feed/:postId/like",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const post = await BoardFeed.findById(req.params.postId);
      if (!post) return res.status(404).json({ error: "Post not found" });

      const userId = req.user._id.toString();
      const likedIndex = post.likedBy.indexOf(userId);

      let liked;

      if (likedIndex === -1) {
        // User hasn't liked yet, add like
        post.likes += 1;
        post.likedBy.push(userId);
        liked = true;
      } else {
        // User already liked, remove like
        post.likes = Math.max(0, post.likes - 1);
        post.likedBy.splice(likedIndex, 1);
        liked = false;
      }

      await post.save();

      res.json({
        postId: post._id,
        likes: post.likes,
        liked,
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to update like." });
    }
  }
);


// DELETE POST
router.delete(
  "/:id/feed/:postId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const deleted = await BoardFeed.findByIdAndDelete(req.params.postId);

      if (!deleted) {
        return res.status(404).json({ error: "Post not found" });
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete post." });
    }
  }
);

module.exports = router;
