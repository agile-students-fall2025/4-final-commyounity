const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "profile-photos", // folder name in Cloudinary
    allowedFormats: ["jpg", "jpeg", "png"],
  },
});

module.exports = multer({ storage });