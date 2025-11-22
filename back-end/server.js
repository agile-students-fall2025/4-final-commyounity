require("dotenv").config();          // load .env first
const mongoose = require("mongoose");
const app = require("./app");        // your Express app

const port = process.env.PORT || 4000; // backend port

let listener; // we'll only set this after DB connects

// Connect to MongoDB Atlas using MONGODB_URI from .env
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log(" Connected to MongoDB Atlas");

    // Start the Express server only after DB is ready
    listener = app.listen(port, () => {
      console.log(` Server running on port: ${port}`);
    });
  })
  .catch((err) => {
    console.error(" MongoDB connection error:", err.message);
    process.exit(1); // crash early if DB fails
  });

// function to stop the server (used in tests)
const close = () => {
  if (listener) {
    listener.close();
  }
};

module.exports = {
  close,
};