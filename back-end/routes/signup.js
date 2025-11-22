const express = require("express");
const router = express.Router();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

// Validation constants
const USERNAME_RE = /^[A-Za-z0-9._-]{3,24}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSignup({ username, email, password, confirmPassword }) {
  if (!username || !email || !password) {
    return "username, email, and password are required.";
  }
  if (!USERNAME_RE.test(username)) {
    return "Username must be 3–24 chars and may include letters, digits, ., _, or -";
  }
  if (!EMAIL_RE.test(email)) {
    return "Please provide a valid email address.";
  }
  if (String(password).length < 6) {
    return "Password must be at least 6 characters long.";
  }
  if (confirmPassword !== undefined && confirmPassword !== password) {
    return "Passwords do not match.";
  }
  return null;
}

// Helper function to setup Google OAuth strategy for signup
function setupGoogleSignupStrategy(passport) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return;
  }

  passport.use(
    "google-signup",
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:4000/auth/google/signup/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value || null;
          const name = profile.displayName || "Google User";
          const googleId = profile.id;

          // Check if user already exists by googleId or email
          let user = await User.findOne({
            $or: [{ googleId }, { email: email?.toLowerCase() }],
          });

          if (!user) {
            // Create new user
            const username =
              email?.split("@")[0] || `google_${googleId.substring(0, 20)}`;
            
            // Ensure username is unique
            let uniqueUsername = username;
            let counter = 1;
            while (await User.findOne({ username: uniqueUsername })) {
              uniqueUsername = `${username}_${counter}`;
              counter++;
            }

            user = new User({
              googleId,
              email: email?.toLowerCase(),
              name,
              username: uniqueUsername,
              authProvider: "google",
            });

            await user.save();
            console.log("[GOOGLE SIGNUP SUCCESS]", user);
          } else {
            // Update existing user if needed
            if (!user.googleId) {
              user.googleId = googleId;
              user.authProvider = "google";
              await user.save();
            }
            console.log("[GOOGLE SIGNUP - EXISTING USER]", user);
          }

          return done(null, user);
        } catch (err) {
          console.error("[GOOGLE SIGNUP ERROR]", err);
          return done(err);
        }
      }
    )
  );
}

// POST /auth/signup (manual signup)
router.post("/auth/signup", async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body || {};

    const errMsg = validateSignup({ username, email, password, confirmPassword });
    if (errMsg) {
      return res.status(400).json({ ok: false, error: errMsg });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({
      username: username.toLowerCase(),
    });
    if (existingUsername) {
      return res.status(409).json({ ok: false, error: "Username already taken." });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({
      email: email.toLowerCase(),
    });
    if (existingEmail) {
      return res.status(409).json({ ok: false, error: "Email already registered." });
    }

    // Create new user
    const newUser = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: String(password),
      name: String(username),
      authProvider: "local",
    });

    await newUser.save();

    // Set session user (without password)
    if (req.session) {
      req.session.user = {
        id: newUser._id.toString(),
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
      };
    }

    console.log("[SIGNUP SUCCESS]", newUser);

    res.status(201).json({
      ok: true,
      message: "Account created successfully.",
      user: {
        id: newUser._id.toString(),
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
      },
    });
  } catch (err) {
    console.error("[SIGNUP ERROR]", err);
    
    // Handle duplicate key errors from MongoDB
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      const message = field === "username" 
        ? "Username already taken." 
        : "Email already registered.";
      return res.status(409).json({ ok: false, error: message });
    }

    res.status(500).json({ ok: false, error: "Internal server error." });
  }
});

// Export router and setup function
module.exports = router;
module.exports.setupGoogleSignupStrategy = setupGoogleSignupStrategy;

