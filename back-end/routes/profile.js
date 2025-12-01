const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const passport = require('passport');

// Import User model only (Profile fields are now in User schema)
const User = require('../models/User');

console.log('[PROFILE ROUTES] Module loaded with MongoDB integration');

// Configure multer for file upload handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
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

    // Get user with all profile fields (excluding password)
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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

// ==================== Upload Profile Photo ====================
// POST /api/profile/photo
router.post('/photo', requireAuth, upload.single('profilePhoto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const userId = getUserId(req);
    // Build full URL for the photo
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const photoUrl = `${baseUrl}/uploads/${req.file.filename}`;
    
    // Update user avatar field
    await User.findByIdAndUpdate(userId, { $set: { avatar: photoUrl } });
    
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

// ==================== Delete User Account ====================
// DELETE /api/profile
router.delete('/', requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    
    console.log('[DELETE PROFILE] Deleting user for userId:', userId);
    
    // Delete user from database (this now includes all profile data)
    await User.findByIdAndDelete(userId);
    
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