const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const passport = require('passport');

// Import models
const Profile = require('../models/Profile');
const User = require('../models/User');

console.log('[PROFILE ROUTES] Module loaded with MongoDB integration');

// Configure multer for file upload handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif)'));
    }
  }
});

// Middleware: Use JWT authentication (same as other protected routes)
const requireAuth = passport.authenticate('jwt', { session: false });

// Helper: Get user ID from request (JWT sets req.user)
const getUserId = (req) => {
  return req.user?.id || req.user?._id;
};

// ==================== Get User Profile ====================
// GET /api/profile
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    console.log('[GET PROFILE] Fetching profile for userId:', userId);

    // Get user info from User model
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get or create profile from Profile model
    let profile = await Profile.findOne({ userId: userId });
    
    if (!profile) {
      // Create default profile if doesn't exist
      profile = new Profile({
        userId: userId,
        aboutMe: '',
        background: '',
        interests: '',
        profilePhoto: '',
        privacy: {
          visibility: 'Private',
          canMessage: 'Everyone',
          onlineStatus: true
        },
        notifications: {
          boardUpdates: true,
          newMessages: true,
          newFollower: true
        }
      });
      await profile.save();
      console.log('[GET PROFILE] Created new profile for userId:', userId);
    }

    // Combine user and profile data
    const responseData = {
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      profilePhoto: profile.profilePhoto || user.avatar || null,
      aboutMe: profile.aboutMe,
      background: profile.background,
      interests: profile.interests,
      privacy: profile.privacy,
      notifications: profile.notifications
    };

    console.log('[GET PROFILE] Returning profile for userId:', userId);
    res.json(responseData);
  } catch (error) {
    console.error('[GET PROFILE] Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== Update User Profile ====================
// PUT /api/profile
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

      // Update User model (username, name)
      if (username || name) {
        const userUpdate = {};
        if (username) userUpdate.username = username.toLowerCase();
        if (name) userUpdate.name = name;
        
        await User.findByIdAndUpdate(userId, userUpdate);
      }

      // Update or create Profile
      const profileUpdate = {};
      if (aboutMe !== undefined) profileUpdate.aboutMe = aboutMe;
      if (background !== undefined) profileUpdate.background = background;
      if (interests !== undefined) profileUpdate.interests = interests;

      const profile = await Profile.findOneAndUpdate(
        { userId: userId },
        { $set: profileUpdate },
        { new: true, upsert: true }
      );

      // Get updated user for response
      const user = await User.findById(userId).select('-password');

      console.log('[UPDATE PROFILE] Profile saved for userId:', userId);
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        profile: {
          username: user.username,
          name: user.name,
          aboutMe: profile.aboutMe,
          background: profile.background,
          interests: profile.interests
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

// ==================== Upload Profile Photo ====================
// POST /api/profile/photo
router.post('/photo', requireAuth, upload.single('profilePhoto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const userId = getUserId(req);
    const photoUrl = `/uploads/${req.file.filename}`;
    
    // Update profile with new photo
    await Profile.findOneAndUpdate(
      { userId: userId },
      { $set: { profilePhoto: photoUrl } },
      { upsert: true }
    );
    
    console.log('[PHOTO UPLOAD] Photo saved for userId:', userId, 'url:', photoUrl);
    
    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      photoUrl: photoUrl
    });
  } catch (error) {
    console.error('[PHOTO UPLOAD] Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== Update Privacy Settings ====================
// PUT /api/profile/privacy
router.put('/privacy',
  requireAuth,
  [
    body('visibility')
      .optional()
      .isIn(['Public', 'Private', 'Friends Only'])
      .withMessage('Invalid visibility setting'),
    body('canMessage')
      .optional()
      .isIn(['Everyone', 'Friends Only', 'No One'])
      .withMessage('Invalid message permission setting'),
    body('onlineStatus')
      .optional()
      .isBoolean()
      .withMessage('Online status must be true or false'),
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

      // Build update object
      const updateFields = {};
      if (visibility !== undefined) updateFields['privacy.visibility'] = visibility;
      if (canMessage !== undefined) updateFields['privacy.canMessage'] = canMessage;
      if (onlineStatus !== undefined) updateFields['privacy.onlineStatus'] = onlineStatus;

      const profile = await Profile.findOneAndUpdate(
        { userId: userId },
        { $set: updateFields },
        { new: true, upsert: true }
      );

      console.log('[UPDATE PRIVACY] Privacy settings saved for userId:', userId);
      
      res.json({
        success: true,
        message: 'Privacy settings updated',
        privacy: profile.privacy
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

      // Build update object
      const updateFields = {};
      if (boardUpdates !== undefined) updateFields['notifications.boardUpdates'] = boardUpdates;
      if (newMessages !== undefined) updateFields['notifications.newMessages'] = newMessages;
      if (newFollower !== undefined) updateFields['notifications.newFollower'] = newFollower;

      const profile = await Profile.findOneAndUpdate(
        { userId: userId },
        { $set: updateFields },
        { new: true, upsert: true }
      );

      console.log('[UPDATE NOTIFICATIONS] Notification settings saved for userId:', userId);
      
      res.json({
        success: true,
        message: 'Notification settings updated',
        notifications: profile.notifications
      });
    } catch (error) {
      console.error('[UPDATE NOTIFICATIONS] Error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ==================== Delete User Account ====================
// DELETE /api/profile
router.delete('/', requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    
    console.log('[DELETE PROFILE] Deleting profile for userId:', userId);
    
    // Delete profile from database
    await Profile.findOneAndDelete({ userId: userId });
    
    // Optionally delete user account too
    // await User.findByIdAndDelete(userId);
    
    // Clear session
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('[DELETE PROFILE] Failed to clear session:', err);
        }
      });
    }
    
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