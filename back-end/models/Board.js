const mongoose = require("mongoose");
const { Schema } = mongoose;

const boardSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    descriptionLong: {
      type: String,
      default: "",
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false, 
      default: null,
    },

    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // We store only the URL, storing images in DB is not recommended
    coverPhotoURL: {
      type: String,
      default: "",
    },

    // Optional: fields for discover/search features later
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
  },
  {
    timestamps: true, 
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

boardSchema.virtual("memberCount").get(function () {
  return this.members ? this.members.length : 0;
});

module.exports = mongoose.model("Board", boardSchema);