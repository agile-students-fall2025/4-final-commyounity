const express = require("express");
const router = express.Router();
const Member = require("../models/Member");
const passport = require("passport"); // ⬅️ add this

// GET /api/members (protected)
router.get(
  "/",
  passport.authenticate("jwt", { session: false }), 
  async (req, res) => {
    try {
      // You now have access to the logged-in user:
      // console.log('Current user:', req.user);

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
  }
);

module.exports = router;