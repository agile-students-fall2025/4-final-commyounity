const mongoose = require("mongoose");
const { Schema } = mongoose;

const friendSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    contact: { type: Schema.Types.ObjectId, ref: "User", required: true },
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    first_name: { type: String, required: true },
    last_name: { type: String, default: "" },
    avatar: { type: String, default: "" },
    online: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "accepted",
    },
  },
  {
    timestamps: true,
  }
);

friendSchema.index({ owner: 1, contact: 1 }, { unique: true });
friendSchema.index({ owner: 1, status: 1 });

module.exports = mongoose.model("Friend", friendSchema);
