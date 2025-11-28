// routes/searchMembers.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");

// POST /api/searches
// Body: { query: "carina" }
router.post("/", async (req, res) => {
  try {
    const { query } = req.body || {};
    const username = String(query || "").trim();

    if (!username) {
      return res.status(400).json({
        ok: false,
        error: "Username is required.",
      });
    }

    if (!/^[A-Za-z0-9_]+$/.test(username)) {
      return res.status(400).json({
        ok: false,
        error:
          "Illegal username. Only letters, digits (0–9), and underscores (_) are allowed.",
      });
    }

    // case-insensitive "contains" match on username
    const users = await User.find({
      username: { $regex: username, $options: "i" },
    })
      .select("_id username name email avatar")
      .limit(20)
      .lean();

    console.log(
      `[SEARCH MEMBERS] term=${username}, found=${users.length}`
    );

    return res.json({
      ok: true,
      count: users.length,
      results: users.map((u) => ({
        id: u._id.toString(),
        username: u.username,
        name: u.name,
        email: u.email,
        avatar: u.avatar || "",
      })),
    });
  } catch (err) {
    console.error("[SEARCH MEMBERS ERROR]", err);
    return res.status(500).json({
      ok: false,
      error: "Internal server error.",
    });
  }
});

module.exports = router;