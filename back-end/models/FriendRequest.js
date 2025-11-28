const mongoose = require("mongoose");
const { Schema } = mongoose;

const friendRequestSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    requester: { type: Schema.Types.ObjectId, ref: "User", required: true },
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    first_name: { type: String, required: true },
    last_name: { type: String, default: "" },
    avatar: { type: String, default: "" },
    message: { type: String, default: "" },
    mutualFriends: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

friendRequestSchema.index({ owner: 1, requester: 1 }, { unique: true });

module.exports = mongoose.model("FriendRequest", friendRequestSchema);
