// test/setup.js (CommonJS version)
const mongoose = require("mongoose");

let connectionReady = false;

module.exports = {
  mochaHooks: {
    async beforeAll() {
      if (mongoose.connection.readyState === 1) {
        connectionReady = true;
        return;
      }

      process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

      const uri =
        process.env.MONGODB_URI_TEST ||
        process.env.MONGODB_URI ||
        process.env.MONGODB_URL;

      if (!uri) {
        throw new Error(
          "No Mongo URI available for tests. Set MONGODB_URI_TEST or MONGODB_URI."
        );
      }

      try {
        await mongoose.connect(uri);
        connectionReady = true;
      } catch (err) {
        console.warn(
          "[TEST SETUP] Unable to connect to Mongo URI. Skipping tests:",
          err.message
        );
        return this.skip();
      }
    },

    async afterAll() {
      if (connectionReady) {
        await mongoose.disconnect();
      }
    },
  },
};