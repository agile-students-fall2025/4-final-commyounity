const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const passport = require("passport");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const User = require("../models/User");
const Friend = require("../models/Friend");
const FriendRequest = require("../models/FriendRequest");
const Board = require("../models/Board");
const BoardInvite = require("../models/BoardInvite");
const BoardFeed = require("../models/BoardFeed");

// ----------------------------
// Cloudinary Config
// ----------------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ----------------------------
// Multer + Cloudinary Storage
// ----------------------------
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "profile_photos",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, crop: "limit" }],
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed"));
    }
    cb(null, true);
  },
});


// Auth middleware
const requireAuth = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err) return res.status(500).json({ error: "Auth error" });
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    req.user = user;
    next();
  })(req, res, next);
};

const getUserId = (req) => req.user?._id || req.user?.id;

// ==================== GET PROFILE ====================
// GET /api/profile
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    console.log('[GET PROFILE] Fetching profile for userId:', userId);

    // Get user with all profile fields (excluding password)
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists - Please login again' });
    }

    // Build full URL for avatar if it's a relative path
    let profilePhoto = user.avatar || null;
    if (profilePhoto && !profilePhoto.startsWith('http')) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      profilePhoto = `${baseUrl}${profilePhoto}`;
    }

    console.log('[GET PROFILE] User avatar from DB:', user.avatar);
    console.log('[GET PROFILE] Returning profilePhoto:', profilePhoto);

    // Return user data with profile fields
    const responseData = {
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      profilePhoto: profilePhoto,
      aboutMe: user.aboutMe || '',
      background: user.background || '',
      interests: user.interests || '',
      privacy: user.privacy || {
        visibility: 'Private',
        canMessage: 'Everyone',
        onlineStatus: true
      },
      notifications: user.notifications || {
        boardUpdates: true,
        newMessages: true,
        newFollower: true
      }
    };

    console.log('[GET PROFILE] Returning profile for userId:', userId);
    res.json(responseData);
  } catch (error) {
    console.error('[GET PROFILE] Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== UPDATE TEXT FIELDS ====================
router.put('/', 
  requireAuth,
  // express-validator validation rules
  [
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 24 })
      .withMessage('Username must be 3-24 characters')
      .matches(/^[A-Za-z0-9._-]+$/)
      .withMessage('Username can only contain letters, numbers, dots, underscores, and hyphens'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be 1-100 characters'),
    body('aboutMe')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('About Me cannot exceed 500 characters'),
    body('background')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Background cannot exceed 200 characters'),
    body('interests')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Interests cannot exceed 200 characters'),
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: errors.array()[0].msg,
          errors: errors.array() 
        });
      }

      const userId = getUserId(req);
      const { username, name, aboutMe, background, interests } = req.body;
      
      console.log('[UPDATE PROFILE] userId:', userId, 'data:', { username, name, aboutMe, background, interests });

      // Build update object - all fields now in User model
      const updateFields = {};
      if (username) updateFields.username = username.toLowerCase();
      if (name) updateFields.name = name;
      if (aboutMe !== undefined) updateFields.aboutMe = aboutMe;
      if (background !== undefined) updateFields.background = background;
      if (interests !== undefined) updateFields.interests = interests;

      // Update user with all profile fields
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      console.log('[UPDATE PROFILE] Profile saved for userId:', userId);
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        profile: {
          username: user.username,
          name: user.name,
          aboutMe: user.aboutMe,
          background: user.background,
          interests: user.interests
        }
      });
    } catch (error) {
      console.error('[UPDATE PROFILE] Error:', error);
      
      // Handle duplicate username error
      if (error.code === 11000) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ==================== CLOUDINARY UPLOAD ====================
router.post("/photo", requireAuth, upload.single("profilePhoto"), async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ error: "No file uploaded" });

      const imageUrl = req.file.path; // Cloudinary generated URL

      await User.findByIdAndUpdate(getUserId(req), { avatar: imageUrl });

      console.log("[CLOUDINARY UPLOAD] Saved:", imageUrl);

      res.json({
        success: true,
        message: "Profile photo updated",
        photoUrl: imageUrl,
      });
    } catch (err) {
      console.error("[PHOTO UPLOAD ERROR]", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// PUT /api/profile/privacy
router.put('/privacy',
  requireAuth,
  [
    body('visibility')
      .optional()
      .isIn(['Public', 'Private', 'Friends Only'])
      .withMessage('Invalid visibility option'),
    body('canMessage')
      .optional()
      .isIn(['Everyone', 'Friends Only', 'No One'])
      .withMessage('Invalid canMessage option'),
    body('onlineStatus')
      .optional()
      .isBoolean()
      .withMessage('onlineStatus must be true or false'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: errors.array()[0].msg,
          errors: errors.array() 
        });
      }

      const userId = getUserId(req);
      const { visibility, canMessage, onlineStatus } = req.body;
      
      console.log('[UPDATE PRIVACY] userId:', userId, 'data:', { visibility, canMessage, onlineStatus });

      // Build update object for nested privacy fields
      const updateFields = {};
      if (visibility !== undefined) updateFields['privacy.visibility'] = visibility;
      if (canMessage !== undefined) updateFields['privacy.canMessage'] = canMessage;
      if (onlineStatus !== undefined) updateFields['privacy.onlineStatus'] = onlineStatus;

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { new: true }
      ).select('privacy');

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      console.log('[UPDATE PRIVACY] Privacy settings saved for userId:', userId);
      
      res.json({
        success: true,
        message: 'Privacy settings updated',
        privacy: user.privacy
      });
    } catch (error) {
      console.error('[UPDATE PRIVACY] Error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ==================== Update Notification Settings ====================
// PUT /api/profile/notifications
router.put('/notifications',
  requireAuth,
  [
    body('boardUpdates')
      .optional()
      .isBoolean()
      .withMessage('boardUpdates must be true or false'),
    body('newMessages')
      .optional()
      .isBoolean()
      .withMessage('newMessages must be true or false'),
    body('newFollower')
      .optional()
      .isBoolean()
      .withMessage('newFollower must be true or false'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: errors.array()[0].msg,
          errors: errors.array() 
        });
      }

      const userId = getUserId(req);
      const { boardUpdates, newMessages, newFollower } = req.body;
      
      console.log('[UPDATE NOTIFICATIONS] userId:', userId, 'data:', { boardUpdates, newMessages, newFollower });

      // Build update object for nested notification fields
      const updateFields = {};
      if (boardUpdates !== undefined) updateFields['notifications.boardUpdates'] = boardUpdates;
      if (newMessages !== undefined) updateFields['notifications.newMessages'] = newMessages;
      if (newFollower !== undefined) updateFields['notifications.newFollower'] = newFollower;

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { new: true }
      ).select('notifications');

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      console.log('[UPDATE NOTIFICATIONS] Notification settings saved for userId:', userId);
      
      res.json({
        success: true,
        message: 'Notification settings updated',
        notifications: user.notifications
      });
    } catch (error) {
      console.error('[UPDATE NOTIFICATIONS] Error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ==================== Change Password ====================
// PUT /api/profile/password
router.put(
  "/password",
  requireAuth,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: errors.array()[0].msg,
          errors: errors.array(),
        });
      }

      const userId = getUserId(req);
      const { currentPassword, newPassword } = req.body;

      console.log(
        "[CHANGE PASSWORD] Attempting password change for userId:",
        userId
      );

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

     
      if (user.authProvider === "google") {
        return res.status(400).json({
          error: "Cannot change password for Google OAuth accounts",
        });
      }

      // Verify current password
      const isValidPassword = user.validPassword(currentPassword);
      if (!isValidPassword) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      // Update password (pre-save hook will hash it)
      user.password = newPassword;
      await user.save();

      console.log(
        "[CHANGE PASSWORD] Password changed successfully for userId:",
        userId
      );

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("[CHANGE PASSWORD] Error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ==================== Delete User Account ====================
// DELETE /api/profile
router.delete('/', requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    
    console.log('[DELETE PROFILE] Deleting user and all related data for userId:', userId);
    
    // 1. Remove user from other users' friends arrays
    const friendsUpdateResult = await User.updateMany(
      { friends: userId },
      { $pull: { friends: userId } }
    );
    console.log('[DELETE PROFILE] Removed user from', friendsUpdateResult.modifiedCount, 'users\' friends arrays');
    
    // 2. Delete all Friend records where user is owner or contact
    const friendDeleteResult = await Friend.deleteMany(
      { $or: [{ owner: userId }, { contact: userId }] }
    );
    console.log('[DELETE PROFILE] Deleted', friendDeleteResult.deletedCount, 'Friend records');
    
    // 3. Delete all FriendRequest records where user is owner or requester
    const friendRequestDeleteResult = await FriendRequest.deleteMany(
      { $or: [{ owner: userId }, { requester: userId }] }
    );
    console.log('[DELETE PROFILE] Deleted', friendRequestDeleteResult.deletedCount, 'FriendRequest records');
    
    // 4. Handle Board records
    // Remove user from all boards' members arrays
    const boardMembersUpdateResult = await Board.updateMany(
      { members: userId },
      { $pull: { members: userId } }
    );
    console.log('[DELETE PROFILE] Removed user from', boardMembersUpdateResult.modifiedCount, 'board members lists');
    
    // Delete boards where user is the owner
    const boardDeleteResult = await Board.deleteMany(
      { owner: userId }
    );
    console.log('[DELETE PROFILE] Deleted', boardDeleteResult.deletedCount, 'Board records (owned by user)');
    
    // 5. Delete all BoardInvite records where user is invitedUserId or invitedBy
    const boardInviteDeleteResult = await BoardInvite.deleteMany(
      { $or: [{ invitedUserId: userId }, { invitedBy: userId }] }
    );
    console.log('[DELETE PROFILE] Deleted', boardInviteDeleteResult.deletedCount, 'BoardInvite records');
    
    // 6. Remove user from all BoardFeed likedBy arrays
    const boardFeedUpdateResult = await BoardFeed.updateMany(
      { likedBy: userId },
      { $pull: { likedBy: userId } }
    );
    console.log('[DELETE PROFILE] Removed user from', boardFeedUpdateResult.modifiedCount, 'BoardFeed likedBy arrays');
    
    // 7. Finally, delete the user itself
    await User.findByIdAndDelete(userId);
    console.log('[DELETE PROFILE] Deleted user record');
    
    // Clear session
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('[DELETE PROFILE] Failed to clear session:', err);
        }
      });
    }
    
    console.log('[DELETE PROFILE] Successfully deleted user and all related data for userId:', userId);
    res.json({
      success: true,
      message: 'Account deleted'
    });
  } catch (error) {
    console.error('[DELETE PROFILE] Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
