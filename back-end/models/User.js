const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 24,
      match: /^[A-Za-z0-9._-]+$/,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },

    password: {
      type: String,
      required: function() {
        // Password is required unless user is from Google OAuth
        return !this.googleId;
      },
      minlength: 6,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Google OAuth fields
    googleId: {
      type: String,
      sparse: true, // Allows multiple null values but unique when present
      index: true,
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    // Optional profile fields
    avatar: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for faster lookups
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ googleId: 1 });

module.exports = mongoose.model("User", userSchema);

