const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/User");

const authRequired = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err) return next(err);

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};

const formatUser = (user) => ({
  id: user._id,
  username: user.username,
  name: user.name,

  first_name: user.name?.split(" ")[0] || "",
  last_name: user.name?.split(" ")[1] || "",

  avatar: user.avatar,

  aboutMe: user.aboutMe,
  background: user.background,
  interests: user.interests,

  privacy: user.privacy,
  notifications: user.notifications,

  friends: user.friends,  

  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});


router.get("/:id", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    return res.json({
      status: "success",
      data: formatUser(user),
    });
  } catch (err) {
    console.error("[GET USER ERROR]", err);
    res.status(500).json({
      status: "error",
      message: "Failed to load user",
    });
  }
});

module.exports = router;