const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

const USERNAME_RE = /^[A-Za-z0-9._-]{3,24}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const authenticationRouter = () => {
  const router = express.Router();

  // ---------- LOCAL SIGNUP ----------
  router.post("/signup", async (req, res) => {
    try {
      const { username, email, password, confirmPassword } = req.body || {};

      if (!username || !email || !password) {
        return res
          .status(400)
          .json({ success: false, message: "username, email, and password are required." });
      }
      if (!USERNAME_RE.test(username)) {
        return res.status(400).json({
          success: false,
          message: "Username must be 3–24 chars and may include letters, digits, . _ -",
        });
      }
      if (!EMAIL_RE.test(email)) {
        return res
          .status(400)
          .json({ success: false, message: "Please provide a valid email address." });
      }
      if (String(password).length < 6) {
        return res
          .status(400)
          .json({ success: false, message: "Password must be at least 6 characters." });
      }
      if (confirmPassword !== undefined && confirmPassword !== password) {
        return res
          .status(400)
          .json({ success: false, message: "Passwords do not match." });
      }

      const existingUsername = await User.findOne({
        username: username.toLowerCase(),
      });
      if (existingUsername) {
        return res
          .status(409)
          .json({ success: false, message: "Username already taken." });
      }

      const existingEmail = await User.findOne({
        email: email.toLowerCase(),
      });
      if (existingEmail) {
        return res
          .status(409)
          .json({ success: false, message: "Email already registered." });
      }

      const user = await new User({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: password,
        name: username,
        authProvider: "local",
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
      return res
        .status(401)
        .json({ success: false, message: "No username or password supplied." });
    }

    try {
      // try username first, then fallback to email for convenience
      let user =
        (await User.findOne({ username: String(username).toLowerCase() }).exec()) ||
        (await User.findOne({ email: String(username).toLowerCase() }).exec());
      if (!user) {
        console.error("[LOCAL LOGIN] User not found.");
        return res
          .status(401)
          .json({ success: false, message: "User not found in database." });
      }

      if (!user.validPassword(password)) {
        console.error("[LOCAL LOGIN] Incorrect password.");
        return res
          .status(401)
          .json({ success: false, message: "Incorrect password." });
      }

      console.log("[LOCAL LOGIN] User logged in:", user._id.toString());
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
      console.error("[LOCAL LOGIN ERROR]", err);
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

            // 1. Find existing user by googleId or email
            let user = await User.findOne({
              $or: [{ googleId }, { email: email?.toLowerCase() }],
            });

            // 2. If not found, create new user
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
              }).save();

              console.log("[GOOGLE AUTH] Created new user:", user._id.toString());
            } else {
              // If existing user is missing googleId, attach it
              if (!user.googleId) {
                user.googleId = googleId;
                user.authProvider = "google";
                await user.save();
                console.log("[GOOGLE AUTH] Linked googleId to existing user:", user._id.toString());
              } else {
                console.log("[GOOGLE AUTH] Existing Google user:", user._id.toString());
              }
            }

            return done(null, user);
          } catch (err) {
            console.error("[GOOGLE AUTH ERROR]", err);
            return done(err, null);
          }
        }
      )
    );

    // Start Google OAuth (login + signup)
    router.get(
      "/google",
      passport.authenticate("google", { scope: ["profile", "email"] })
    );

    // Google OAuth callback
    router.get(
      "/google/callback",
      passport.authenticate("google", { session: false }),
      (req, res) => {
        const user = req.user;
        const token = user.generateJWT();

        // Frontend Protected will read ?token=... and store it
        const redirectUrl = `http://localhost:3000/home?token=${encodeURIComponent(
          token
        )}`;

        return res.redirect(redirectUrl);
      }
    );
  } else {
    console.warn("⚠ Google OAuth disabled: missing GOOGLE_CLIENT_ID/SECRET");
  }

  // ---------- LOGOUT MESSAGE ----------
  router.get("/logout", (req, res) => {
    res.json({
      success: true,
      message:
        "There is actually nothing to do on the server side... you simply need to delete your token from the browser's local storage!",
    });
  });

  return router;
};

module.exports = authenticationRouter;

