const mongoose = require("mongoose");
const { Schema } = mongoose;

const boardFeedSchema = new Schema(
  {
    boardId: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      required: true,
      index: true,
    },

    author: {
      type: String,
      required: true,
    },

    avatar: {
      type: String,
      default: function () {
        return `https://i.pravatar.cc/64?u=${Date.now()}`;
      },
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    likes: {
      type: Number,
      default: 0,
      min: 0,
    },

    likedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      }
    ],

    ts: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("BoardFeed", boardFeedSchema);
