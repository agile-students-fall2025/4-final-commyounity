const mongoose = require("mongoose");
const { Schema } = mongoose;
const bcrypt = require('bcryptjs')

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

// hash the password before the user is saved
// mongoose provides hooks that allow us to run code before or after specific events
userSchema.pre('save', function (next) {
  const user = this
  // if the password has not changed, no need to hash it
  if (!user.isModified('password')) return next()
  // if user is from Google OAuth and has no password, skip hashing
  if (user.googleId && !user.password) return next()
  // otherwise, the password is being modified, so hash it
  bcrypt.hash(user.password, 10, (err, hash) => {
    if (err) return next(err)
    user.password = hash // update the password to the hashed version
    next()
  })
})

// mongoose allows us to attach methods to a model...

// compare a given password with the database hash
userSchema.methods.validPassword = function (password) {
  return bcrypt.compareSync(password, this.password)
}

module.exports = mongoose.model("User", userSchema);

