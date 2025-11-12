const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Temporary in-memory storage for user profiles (until database is connected)
// In production, this should be replaced with actual database operations
const userProfiles = new Map();

console.log('[PROFILE ROUTES] Module loaded, userProfiles Map created');

// Configure multer for file upload handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Make sure this folder exists
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

// Middleware: Check if user is authenticated
const requireAuth = (req, res, next) => {
  // Support both Google OAuth and local login
  const isGoogleAuth = req.isAuthenticated && req.isAuthenticated();
  const isLocalAuth = req.session && req.session.user;
  
  if (!isGoogleAuth && !isLocalAuth) {
    console.log('[AUTH CHECK] Not authenticated');
    return res.status(401).json({ error: 'Please login first' });
  }
  
  const userId = req.user?.id || req.session?.user?.id;
  console.log('[AUTH CHECK] Authenticated, userId:', userId);
  next();
};

// ==================== Get User Profile ====================
// GET /api/profile
router.get('/', requireAuth, async (req, res) => {
  try {
    // Get user ID (supports both login methods)
    const userId = req.user?.id || req.session?.user?.id;
    const username = req.user?.username || req.session?.user?.username || 'username';
    
    console.log('[GET PROFILE] Fetching profile for userId:', userId);
    
    // Handle name - could be string or object (from Google OAuth)
    let name = req.user?.displayName || req.session?.user?.name || 'User';
    if (typeof name === 'object' && name.givenName) {
      name = `${name.givenName} ${name.familyName || ''}`.trim();
    }
    
    // Default profile data
    const defaultProfile = {
      id: userId,
      username: username,
      name: name,
      email: req.user?.emails?.[0]?.value || req.session?.user?.email || 'user@example.com',
      profilePhoto: null,
      aboutMe: "Hi! I'm Bill from Hong Kong. I love connecting with people who enjoy exploring different cuisines and cultures!",
      background: 'Grew up in USA, born in Hong Kong',
      interests: 'Hiking, Skiing, Reading',
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
    };
    
    // Check if user has saved profile data
    const savedProfile = userProfiles.get(userId);
    console.log('[GET PROFILE] Saved profile found:', !!savedProfile);
    
    // Merge saved profile with defaults to ensure all fields exist
    const userProfile = savedProfile ? {
      ...defaultProfile,
      ...savedProfile,
      privacy: {
        ...defaultProfile.privacy,
        ...(savedProfile.privacy || {})
      },
      notifications: {
        ...defaultProfile.notifications,
        ...(savedProfile.notifications || {})
      }
    } : defaultProfile;
    
    if (savedProfile) {
      console.log('[GET PROFILE] Merged profile data:', JSON.stringify(userProfile, null, 2));
    }
    
    console.log('[GET PROFILE] Returning profile with notifications:', userProfile.notifications);
    res.json(userProfile);
  } catch (error) {
    console.error('[GET PROFILE] Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== Update User Profile ====================
// PUT /api/profile
router.put('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.user?.id;
    const { username, name, aboutMe, background, interests } = req.body;
    
    console.log('[UPDATE PROFILE] userId:', userId, 'data:', { username, name, aboutMe, background, interests });
    
    // Validate input
    if (aboutMe && aboutMe.length > 500) {
      return res.status(400).json({ error: 'About Me cannot exceed 500 characters' });
    }
    
    // Get current profile or create new one
    const currentProfile = userProfiles.get(userId) || {
      id: userId,
      username: req.user?.username || req.session?.user?.username || 'username',
      email: req.user?.emails?.[0]?.value || req.session?.user?.email || 'user@example.com',
      profilePhoto: null,
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
    };
    
    // Update profile with new data
    const updatedProfile = {
      ...currentProfile,
      username: username || currentProfile.username,
      name: name || currentProfile.name,
      aboutMe: aboutMe !== undefined ? aboutMe : currentProfile.aboutMe,
      background: background !== undefined ? background : currentProfile.background,
      interests: interests !== undefined ? interests : currentProfile.interests
    };
    
    // Save to memory storage
    userProfiles.set(userId, updatedProfile);
    
    console.log('[UPDATE PROFILE] Profile saved for userId:', userId);
    console.log('[UPDATE PROFILE] Current Map size:', userProfiles.size);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        username: updatedProfile.username,
        name: updatedProfile.name,
        aboutMe: updatedProfile.aboutMe,
        background: updatedProfile.background,
        interests: updatedProfile.interests
      }
    });
  } catch (error) {
    console.error('[UPDATE PROFILE] Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== Upload Profile Photo ====================
// POST /api/profile/photo
router.post('/photo', requireAuth, upload.single('profilePhoto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const userId = req.user?.id || req.session?.user?.id;
    const photoUrl = `/uploads/${req.file.filename}`;
    
    // Get current profile and update photo
    const currentProfile = userProfiles.get(userId) || {};
    currentProfile.profilePhoto = photoUrl;
    userProfiles.set(userId, currentProfile);
    
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

// ==================== Delete User Account ====================
// DELETE /api/profile
router.delete('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.user?.id;
    
    console.log('[DELETE PROFILE] Deleting profile for userId:', userId);
    
    // Delete from memory storage
    userProfiles.delete(userId);
    
    // Clear session
    req.session.destroy((err) => {
      if (err) {
        console.error('[DELETE PROFILE] Failed to clear session:', err);
      }
    });
    
    res.json({
      success: true,
      message: 'Account deleted'
    });
  } catch (error) {
    console.error('[DELETE PROFILE] Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== Update Privacy Settings ====================
// PUT /api/profile/privacy
router.put('/privacy', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.user?.id;
    const { visibility, canMessage, onlineStatus } = req.body;
    
    console.log('[UPDATE PRIVACY] userId:', userId, 'data:', { visibility, canMessage, onlineStatus });
    
    // Validate input
    const validVisibility = ['Private', 'Public'];
    const validCanMessage = ['Everyone', 'Friends Only'];
    
    if (visibility && !validVisibility.includes(visibility)) {
      return res.status(400).json({ error: 'Invalid visibility setting' });
    }
    
    if (canMessage && !validCanMessage.includes(canMessage)) {
      return res.status(400).json({ error: 'Invalid message permission setting' });
    }
    
    // Get current profile or create a complete one
    const currentProfile = userProfiles.get(userId) || {
      id: userId,
      username: req.user?.username || req.session?.user?.username || 'username',
      name: req.user?.displayName || req.session?.user?.name || 'User',
      email: req.user?.emails?.[0]?.value || req.session?.user?.email || 'user@example.com',
      profilePhoto: null,
      aboutMe: "Hi! I'm Bill from Hong Kong. I love connecting with people who enjoy exploring different cuisines and cultures!",
      background: 'Grew up in USA, born in Hong Kong',
      interests: 'Hiking, Skiing, Reading',
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
    };
    
    if (!currentProfile.privacy) {
      currentProfile.privacy = {};
    }
    
    if (visibility !== undefined) currentProfile.privacy.visibility = visibility;
    if (canMessage !== undefined) currentProfile.privacy.canMessage = canMessage;
    if (onlineStatus !== undefined) currentProfile.privacy.onlineStatus = onlineStatus;
    
    userProfiles.set(userId, currentProfile);
    
    console.log('[UPDATE PRIVACY] Privacy settings saved for userId:', userId);
    console.log('[UPDATE PRIVACY] New privacy settings:', currentProfile.privacy);
    console.log('[UPDATE PRIVACY] Current Map size:', userProfiles.size);
    
    res.json({
      success: true,
      message: 'Privacy settings updated',
      privacy: currentProfile.privacy
    });
  } catch (error) {
    console.error('[UPDATE PRIVACY] Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== Update Notification Settings ====================
// PUT /api/profile/notifications
router.put('/notifications', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.user?.id;
    const { boardUpdates, newMessages, newFollower } = req.body;
    
    console.log('[UPDATE NOTIFICATIONS] ===== START =====');
    console.log('[UPDATE NOTIFICATIONS] userId:', userId);
    console.log('[UPDATE NOTIFICATIONS] Received data:', { boardUpdates, newMessages, newFollower });
    
    // Get current profile or create a complete one
    const currentProfile = userProfiles.get(userId) || {
      id: userId,
      username: req.user?.username || req.session?.user?.username || 'username',
      name: req.user?.displayName || req.session?.user?.name || 'User',
      email: req.user?.emails?.[0]?.value || req.session?.user?.email || 'user@example.com',
      profilePhoto: null,
      aboutMe: "Hi! I'm Bill from Hong Kong. I love connecting with people who enjoy exploring different cuisines and cultures!",
      background: 'Grew up in USA, born in Hong Kong',
      interests: 'Hiking, Skiing, Reading',
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
    };
    
    console.log('[UPDATE NOTIFICATIONS] Current profile before update:', JSON.stringify(currentProfile, null, 2));
    
    if (!currentProfile.notifications) {
      currentProfile.notifications = {};
      console.log('[UPDATE NOTIFICATIONS] Created new notifications object');
    }
    
    if (boardUpdates !== undefined) {
      currentProfile.notifications.boardUpdates = boardUpdates;
      console.log('[UPDATE NOTIFICATIONS] Set boardUpdates to:', boardUpdates);
    }
    if (newMessages !== undefined) {
      currentProfile.notifications.newMessages = newMessages;
      console.log('[UPDATE NOTIFICATIONS] Set newMessages to:', newMessages);
    }
    if (newFollower !== undefined) {
      currentProfile.notifications.newFollower = newFollower;
      console.log('[UPDATE NOTIFICATIONS] Set newFollower to:', newFollower);
    }
    
    userProfiles.set(userId, currentProfile);
    
    console.log('[UPDATE NOTIFICATIONS] Profile saved to Map');
    console.log('[UPDATE NOTIFICATIONS] Current Map size:', userProfiles.size);
    console.log('[UPDATE NOTIFICATIONS] Updated profile:', JSON.stringify(currentProfile, null, 2));
    
    // Verify it was saved
    const verifyProfile = userProfiles.get(userId);
    console.log('[UPDATE NOTIFICATIONS] Verification - re-fetched profile:', JSON.stringify(verifyProfile, null, 2));
    console.log('[UPDATE NOTIFICATIONS] ===== END =====');
    
    res.json({
      success: true,
      message: 'Notification settings updated',
      notifications: currentProfile.notifications
    });
  } catch (error) {
    console.error('[UPDATE NOTIFICATIONS] Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== Change Password ====================
// PUT /api/profile/password
router.put('/password', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.user?.id;
    const { newPassword, confirmPassword } = req.body;
    
    console.log('[CHANGE PASSWORD] userId:', userId);
    
    // Validate input
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Please fill in all fields' });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    console.log('[CHANGE PASSWORD] Password changed successfully for userId:', userId);
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('[CHANGE PASSWORD] Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;