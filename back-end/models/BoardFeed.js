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

    message: {
      type: String,
      required: true,
      trim: true,
    },

    author: {
      type: String,
      default: "Anonymous",
    },

    avatar: {
      type: String,
      default: function () {
        return `https://i.pravatar.cc/64?u=${Date.now()}`;
      },
    },

    likes: {
      type: Number,
      default: 0,
      min: 0,
    },

    ts: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
  }
);

module.exports = mongoose.model("BoardFeed", boardFeedSchema);
