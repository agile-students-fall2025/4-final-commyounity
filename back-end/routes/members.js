
const express = require("express");
const router = express.Router();
const Member = require("../models/Member");

// GET /api/members
router.get("/", async (req, res) => {
  try {
    // Fetch all members from MongoDB
    const members = await Member.find().lean();

    return res.json({
      status: "success",
      data: members,
    });
  } catch (err) {
    console.error("[GET MEMBERS ERROR]", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to load members",
    });
  }
});

module.exports = router;