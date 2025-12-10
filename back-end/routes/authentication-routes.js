// Updated authentication-routes.js with Cloudinary integration
const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const cloudinary = require("cloudinary").v2;

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const USERNAME_RE = /^[A-Za-z0-9._-]{3,24}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULT_AVATAR =
  "https://simplyilm.com/wp-content/uploads/2017/08/temporary-profile-placeholder-1.jpg";

const authenticationRouter = () => {
  const router = express.Router();

  // ---------- LOCAL SIGNUP ----------
  router.post("/signup", async (req, res) => {
    try {
      const { username, email, password, confirmPassword } = req.body || {};

      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "username, email, and password are required.",
        });
      }
      if (!USERNAME_RE.test(username)) {
        return res.status(400).json({
          success: false,
          message:
            "Username must be 3–24 chars and may include letters, digits, . _ -",
        });
      }
      if (!EMAIL_RE.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address.",
        });
      }
      if (String(password).length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters.",
        });
      }
      if (confirmPassword !== undefined && confirmPassword !== password) {
        return res.status(400).json({
          success: false,
          message: "Passwords do not match.",
        });
      }

      const existingUsername = await User.findOne({
        username: username.toLowerCase(),
      });
      if (existingUsername) {
        return res
          .status(409)
          .json({ success: false, message: "Username already taken." });
      }

      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return res
          .status(409)
          .json({ success: false, message: "Email already registered." });
      }

      const user = await new User({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password,
        name: username,
        authProvider: "local",
        avatar: DEFAULT_AVATAR,
      }).save();

      console.log("[LOCAL SIGNUP] New user:", user._id.toString());

      const token = user.generateJWT();
      return res.json({
        success: true,
        message: "User saved successfully.",
        token,
        username: user.username,
        email: user.email,
        name: user.name,
      });
    } catch (err) {
      console.error("[LOCAL SIGNUP ERROR]", err);
      return res.status(500).json({
        success: false,
        message: "Error saving user to database.",
        error: err.message,
      });
    }
  });

  // ---------- LOCAL LOGIN ----------
  router.post("/login", async (req, res) => {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(401).json({
        success: false,
        message: "No username or password supplied.",
      });
    }

    try {
      let user =
        (await User.findOne({
          username: String(username).toLowerCase(),
        })) || (await User.findOne({ email: String(username).toLowerCase() }));

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found in database.",
        });
      }

      if (!user.validPassword(password)) {
        return res.status(401).json({
          success: false,
          message: "Incorrect password.",
        });
      }

      const token = user.generateJWT();
      return res.json({
        success: true,
        message: "User logged in successfully.",
        token,
        username: user.username,
        email: user.email,
        name: user.name,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Error looking up user in database.",
        error: err.message,
      });
    }
  });

  // ---------- GOOGLE LOGIN / SIGNUP ----------
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      "google",
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "http://localhost:4000/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value || null;
            const googleId = profile.id;
            const name = profile.displayName || "Google User";
            const googleAvatar = profile.photos?.[0]?.value || DEFAULT_AVATAR;

            let user = await User.findOne({
              $or: [{ googleId }, { email: email?.toLowerCase() }],
            });

            if (!user) {
              let baseUsername =
                (email && email.split("@")[0]) ||
                `google_${googleId.substring(0, 10)}`;

              let uniqueUsername = baseUsername;
              let counter = 1;
              while (await User.findOne({ username: uniqueUsername })) {
                uniqueUsername = `${baseUsername}_${counter++}`;
              }

              user = await new User({
                googleId,
                email: email?.toLowerCase() || undefined,
                username: uniqueUsername.toLowerCase(),
                name,
                authProvider: "google",
                avatar: googleAvatar,
              }).save();
            } else {
              if (!user.googleId) {
                user.googleId = googleId;
                user.authProvider = "google";
                user.avatar = user.avatar || googleAvatar;
                await user.save();
              }
            }

            return done(null, user);
          } catch (err) {
            return done(err, null);
          }
        }
      )
    );

    router.get(
      "/google",
      passport.authenticate("google", { scope: ["profile", "email"] })
    );

    router.get(
      "/google/callback",
      passport.authenticate("google", { session: false }),
      (req, res) => {
        const user = req.user;
        const token = user.generateJWT();
        const redirectUrl = `http://localhost:3000/home?token=${encodeURIComponent(
          token
        )}`;

        return res.redirect(redirectUrl);
      }
    );
  }

  // ---------- LOGOUT ----------
  router.get("/logout", (req, res) => {
    res.json({
      success: true,
      message: "Just delete your JWT token locally.",
    });
  });

  return router;
};

module.exports = authenticationRouter;