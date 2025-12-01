const mongoose = require("mongoose");
const { Schema } = mongoose;

const profileSchema = new Schema(
  {
    // Reference to User model - links this profile to a user account
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Each user can only have one profile
    },

    // Personal bio/description (max 500 characters)
    aboutMe: {
      type: String,
      maxlength: 500,
      default: "",
      trim: true,
    },

    // Background information (education, work history, etc.)
    background: {
      type: String,
      default: "",
      trim: true,
    },

    // User's interests and hobbies
    interests: {
      type: String,
      default: "",
      trim: true,
    },

    // Profile photo URL or file path
    profilePhoto: {
      type: String,
      default: null,
    },

    // Privacy settings
    privacy: {
      // Who can view this profile
      visibility: {
        type: String,
        enum: ["Public", "Private", "Friends Only"],
        default: "Private",
      },
      // Who can send messages to this user
      canMessage: {
        type: String,
        enum: ["Everyone", "Friends Only", "No One"],
        default: "Everyone",
      },
      // Whether to show online status
      onlineStatus: {
        type: Boolean,
        default: true,
      },
    },

    // Notification preferences
    notifications: {
      // Receive board update notifications
      boardUpdates: {
        type: Boolean,
        default: true,
      },
      // Receive new message notifications
      newMessages: {
        type: Boolean,
        default: true,
      },
      // Receive new follower notifications
      newFollower: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Index for faster queries by userId
profileSchema.index({ userId: 1 });

module.exports = mongoose.model("Profile", profileSchema);