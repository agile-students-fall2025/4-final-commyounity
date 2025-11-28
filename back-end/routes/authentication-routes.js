const express = require('express');
const User = require('../models/User.js');


const USERNAME_RE = /^[A-Za-z0-9._-]{3,24}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSignup({ username, email, password, confirmPassword }) {
  if (!username || !email || !password) {
    return 'username, email, and password are required.';
  }
  if (!USERNAME_RE.test(username)) {
    return 'Username must be 3–24 chars and may include letters, digits, ., _, or -';
  }
  if (!EMAIL_RE.test(email)) {
    return 'Please provide a valid email address.';
  }
  if (String(password).length < 6) {
    return 'Password must be at least 6 characters long.';
  }
  if (confirmPassword !== undefined && confirmPassword !== password) {
    return 'Passwords do not match.';
  }
  return null;
}

// -----------------------------
// Auth router
// -----------------------------
const authenticationRouter = () => {
  const router = express.Router();

  // SIGNUP: POST /auth/signup
  router.post('/signup', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body || {};

    const errMsg = validateSignup({ username, email, password, confirmPassword });
    if (errMsg) {
      return res.status(400).json({
        ok: false,
        success: false,
        error: errMsg,
      });
    }

    try {
      // check username
      const existingUsername = await User.findOne({
        username: username.toLowerCase(),
      });
      if (existingUsername) {
        return res.status(409).json({
          ok: false,
          success: false,
          error: 'Username already taken.',
        });
      }

      // check email
      const existingEmail = await User.findOne({
        email: email.toLowerCase(),
      });
      if (existingEmail) {
        return res.status(409).json({
          ok: false,
          success: false,
          error: 'Email already registered.',
        });
      }

      // create user
      const user = await new User({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: String(password),
        name: username,
        authProvider: 'local',
      }).save();

      console.error(`New user: ${user}`);

      const token = user.generateJWT();

      return res.status(201).json({
        ok: true,               
        success: true,
        message: 'User saved successfully.',
        token,
        username: user.username,
        email: user.email,
        name: user.name,
      });
    } catch (err) {
      console.error(`Failed to save user: ${err}`);
      return res.status(500).json({
        ok: false,
        success: false,
        error: 'Error saving user to database.',
      });
    }
  });

  // LOGIN: POST /auth/login
  router.post('/login', async function (req, res) {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({
        ok: false,
        success: false,
        error: 'No username or password supplied.',
      });
    }

    try {
      const user = await User.findOne({
        username: username.toLowerCase(),
      }).exec();

      if (!user) {
        console.error('User not found.');
        return res.status(401).json({
          ok: false,
          success: false,
          error: 'User not found in database.',
        });
      }

      if (!user.validPassword(password)) {
        console.error('Incorrect password.');
        return res.status(401).json({
          ok: false,
          success: false,
          error: 'Incorrect password.',
        });
      }

      console.log('User logged in successfully.');
      const token = user.generateJWT();

      return res.json({
        ok: true,                 
        success: true,
        message: 'User logged in successfully.',
        token,
        username: user.username,
        email: user.email,
        name: user.name,
      });
    } catch (err) {
      console.error(`Error looking up user: ${err}`);
      return res.status(500).json({
        ok: false,
        success: false,
        error: 'Error looking up user in database.',
      });
    }
  });

  // LOGOUT (still just informational for JWT)
  router.get('/logout', function (req, res) {
    res.json({
      ok: true,
      success: true,
      message:
        "With JWT, logging out is handled on the client by deleting the token from storage.",
    });
  });

  return router;
};

module.exports = authenticationRouter;