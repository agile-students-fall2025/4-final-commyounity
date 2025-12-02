const express = require("express");
const router = express.Router();
const passport = require("passport");
const BoardFeed = require("../models/BoardFeed");

// GET FEED
router.get("/:id/feed", async (req, res) => {
  try {
    const posts = await BoardFeed.find({ boardId: req.params.id })
      .sort({ createdAt: -1 });

    res.json(posts);
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

      const post = await BoardFeed.create({
        boardId: req.params.id,
        message: message.trim(),
        author: req.user.username,
        avatar: req.user.avatar || null,
        likes: 0,
        likedBy: [],
      });

      res.json(post);
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
