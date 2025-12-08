
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

require("dotenv").config({ silent: true });   

let connectionReady = false;
let testRunStartedAt = new Date();

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
        testRunStartedAt = new Date();
      } catch (err) {
        console.warn(
          "[TEST SETUP] Unable to connect to Mongo URI. Skipping tests:",
          err.message
        );
        return this.skip();
      }
    },

    async afterAll() {
      if (!connectionReady) return;

      const db = mongoose.connection;
      const cutoff = testRunStartedAt;


      try {
        const cleanupOps = [];

      cleanupOps.push(
        db.collection("users").deleteMany({
          createdAt: { $gte: cutoff },
          username: { $regex: /^(testuser_|fr_test_|cb_|edit_user_|feedtester_|br_)/i }
        })
      );

        cleanupOps.push(
          db.collection("boards").deleteMany({
            $or: [{ title: /^TEST_/ }, { createdAt: { $gte: cutoff } }],
          })
        );

        cleanupOps.push(
          db.collection("boardinvites").deleteMany({
            createdAt: { $gte: cutoff },
          }).catch(() => {})
        );

        cleanupOps.push(
          db.collection("friendrequests").deleteMany({
            createdAt: { $gte: cutoff },
          }).catch(() => {})
        );
        cleanupOps.push(
          db.collection("friends").deleteMany({
            createdAt: { $gte: cutoff },
          }).catch(() => {})
        );

        await Promise.allSettled(cleanupOps);
      } catch (err) {
        console.warn("[TEST CLEANUP] DB cleanup failed:", err.message);
      }

      try {
        const uploadsDir = path.join(process.cwd(), "uploads");
        if (!fs.existsSync(uploadsDir)) return;

        const files = fs.readdirSync(uploadsDir);
        const deleteOps = [];

        for (const file of files) {
          const full = path.join(uploadsDir, file);

          const stat = fs.statSync(full);
          if (!stat.isFile()) continue;

          const isRecent = stat.mtime.getTime() >= cutoff.getTime();

          const isTestName = file.startsWith("test-") || file.startsWith("feed-");

          const isTinyProfilePng =
            file.startsWith("profile-") &&
            file.endsWith(".png") &&
            stat.size < 5000;

          if (isTestName || isTinyProfilePng || isRecent) {
            deleteOps.push(fs.promises.unlink(full));
          }
        }

        await Promise.allSettled(deleteOps);

      } catch (err) {
        console.warn("[TEST CLEANUP] uploads/ cleanup failed:", err.message);
      }

      await mongoose.disconnect();
    },
  },
};