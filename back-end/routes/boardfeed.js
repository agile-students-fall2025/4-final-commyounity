const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const passport = require("passport");

const FEED_DATA_DIR = path.join(__dirname, "..", "data", "feeds");
const requireJwt = passport.authenticate("jwt", { session: false });

// Ensure data folder exists
if (!fs.existsSync(FEED_DATA_DIR)) {
  fs.mkdirSync(FEED_DATA_DIR, { recursive: true });
}

function getFeedFilePath(boardId) {
  return path.join(FEED_DATA_DIR, `${boardId}.json`);
}

// Helper to read/write JSON safely
function readFeed(boardId) {
  const filePath = getFeedFilePath(boardId);

  // ⬅️ If there is no file yet, treat as "no posts", not an error
  if (!fs.existsSync(filePath)) return [];

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    // Corrupt JSON? Fall back to empty feed rather than crashing
    return [];
  }
}

function writeFeed(boardId, data) {
  const filePath = getFeedFilePath(boardId);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// --- Routes ---

// GET /api/boards/:id/feed
router.get("/:id/feed", (req, res) => {
  const { id } = req.params;
  const feed = readFeed(id);

  // ⬅️ Always 200 here; frontend can handle empty []
  res.json(feed);
});

// POST /api/boards/:id/feed (new post)
router.post("/:id/feed", requireJwt, (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message is required" });
  }

  const feed = readFeed(id);
  const newPost = {
    id: Date.now(),
    author: req.user?.username || "Anonymous",
    avatar: req.user?.avatar || `https://i.pravatar.cc/64?u=${Date.now()}`,
    message: message.trim(),
    ts: new Date().toISOString(),
    likes: 0,
  };

  feed.unshift(newPost);
  writeFeed(id, feed);
  res.status(200).json(newPost);
});

// POST /api/boards/:id/feed/:postId/like
router.post("/:id/feed/:postId/like", requireJwt, (req, res) => {
  const { id, postId } = req.params;
  const feed = readFeed(id);
  const post = feed.find((p) => String(p.id) === String(postId));

  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  post.likes += 1;
  writeFeed(id, feed);
  res.json(post); // 200
});

// DELETE /api/boards/:id/feed/:postId
router.delete("/:id/feed/:postId", requireJwt, (req, res) => {
  const { id, postId } = req.params;
  const feed = readFeed(id);
  const newFeed = feed.filter((p) => String(p.id) !== String(postId));

  if (feed.length === newFeed.length) {
    return res.status(404).json({ error: "Post not found" });
  }

  writeFeed(id, newFeed);
  res.json({ success: true }); // 200
});

module.exports = router;
