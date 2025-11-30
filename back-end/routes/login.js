/**
 * Login Routes Module
 * 
 * This module handles user authentication through username/password login.
 * It provides database operations for verifying user credentials and generating JWT tokens.
 * 
 * Features:
 * - Username and password validation
 * - Database lookup for user existence
 * - Password verification using bcrypt (via User model's validPassword method)
 * - JWT token generation for authenticated sessions
 * - Comprehensive error handling for different failure scenarios
 */

const express = require("express");
const User = require("../models/User");

/**
 * Login Router Factory Function
 * 
 * Creates and returns an Express router configured with login routes.
 * This follows the pattern used in authentication-routes.js for consistency.
 * 
 * @returns {express.Router} Express router instance with login routes configured
 */
const loginRouter = () => {
  const router = express.Router();

  /**
   * POST /login
   * 
   * Local authentication endpoint that verifies user credentials against the database.
   * 
   * Request Body:
   *   - username: string (required) - The user's username
   *   - password: string (required) - The user's plaintext password
   * 
   * Success Response (200):
   *   {
   *     success: true,
   *     message: "User logged in successfully.",
   *     token: "JWT_TOKEN_STRING",
   *     username: "user123",
   *     email: "user@example.com",
   *     name: "User Name"
   *   }
   * 
   * Error Responses:
   *   - 401: Missing credentials, user not found, or incorrect password
   *   - 500: Database error or server error
   * 
   * Database Operations:
   *   1. Find user by username (case-insensitive lookup)
   *   2. Verify password using bcrypt comparison
   *   3. Generate JWT token with user information
   */
  router.post("/login", async (req, res) => {
    // Extract username and password from request body
    // Use empty object as fallback to prevent errors if body is undefined
    const { username, password } = req.body || {};

    // Input validation: Check if username and password are provided
    if (!username || !password) {
      return res
        .status(401)
        .json({ success: false, message: "No username or password supplied." });
    }

    try {
      /**
       * Database Operation: Find user by username
       * 
       * - Searches for user with matching username (case-insensitive)
       * - Uses .exec() to return a promise for better async/await handling
       * - Returns null if no user is found
       */
      const user = await User.findOne({ username: username.toLowerCase() }).exec();

      // Check if user exists in database
      if (!user) {
        console.error("[LOCAL LOGIN] User not found.");
        return res
          .status(401)
          .json({ success: false, message: "User not found in database." });
      }

      /**
       * Password Verification
       * 
       * Uses the User model's validPassword method which:
       * - Compares the provided plaintext password with the stored bcrypt hash
       * - Returns true if passwords match, false otherwise
       * - Handles bcrypt comparison internally
       */
      if (!user.validPassword(password)) {
        console.error("[LOCAL LOGIN] Incorrect password.");
        return res
          .status(401)
          .json({ success: false, message: "Incorrect password." });
      }

      // Log successful login for monitoring/debugging
      console.log("[LOCAL LOGIN] User logged in:", user._id.toString());

      /**
       * JWT Token Generation
       * 
       * Generates a JSON Web Token containing:
       * - User ID (_id)
       * - Username
       * - Email
       * - Expiration timestamp (default: 7 days from now)
       * 
       * The token is signed with JWT_SECRET from environment variables
       * and can be used for subsequent authenticated requests.
       */
      const token = user.generateJWT();

      /**
       * Success Response
       * 
       * Returns user information and JWT token for client-side storage.
       * The client should store this token (e.g., in localStorage) and
       * include it in the Authorization header for protected routes.
       */
      return res.json({
        success: true,
        message: "User logged in successfully.",
        token, // JWT token for authentication
        username: user.username, // User's username
        email: user.email, // User's email address
        name: user.name, // User's display name
      });
    } catch (err) {
      /**
       * Error Handling
       * 
       * Catches any unexpected errors during database operations or token generation.
       * This could include:
       * - Database connection errors
       * - Mongoose query errors
       * - JWT generation errors
       * 
       * Logs the full error for debugging while returning a user-friendly message.
       */
      console.error("[LOCAL LOGIN ERROR]", err);
      return res.status(500).json({
        success: false,
        message: "Error looking up user in database.",
        error: err.message, // Include error message for debugging
      });
    }
  });

  // Return the configured router to be mounted in app.js
  return router;
};

// Export the router factory function
// Usage in app.js: const loginRouter = require('./routes/login'); app.use('/auth', loginRouter());
module.exports = loginRouter;

