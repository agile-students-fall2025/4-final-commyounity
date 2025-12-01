// test/profile.test.js
const chai = require("chai");
const request = require("supertest");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const sinon = require("sinon");
const app = require("../app");
const User = require("../models/User");

const { expect } = chai;

let token;
let userId;
let testUser;

// Helper to make authenticated requests
const authGet = (path) =>
  request(app).get(path).set("Authorization", `JWT ${token}`);

const authPut = (path) =>
  request(app).put(path).set("Authorization", `JWT ${token}`);

const authPost = (path) =>
  request(app).post(path).set("Authorization", `JWT ${token}`);

const authDelete = (path) =>
  request(app).delete(path).set("Authorization", `JWT ${token}`);

describe("Profile routes", () => {
  beforeEach(async () => {
    sinon.restore();
    await User.deleteMany({});

    // Create a test user (username max 24 chars)
    const ts = Date.now().toString().slice(-6);
    testUser = await new User({
      username: `ptest_${ts}`,
      email: `profile_${ts}@example.com`,
      password: "password123",
      name: "Profile Tester",
      aboutMe: "Test about me",
      background: "Test background",
      interests: "Test interests",
      privacy: {
        visibility: "Private",
        canMessage: "Everyone",
        onlineStatus: true,
      },
      notifications: {
        boardUpdates: true,
        newMessages: true,
        newFollower: true,
      },
    }).save();

    token = testUser.generateJWT();
    userId = testUser._id;
  });

  afterEach(async () => {
    sinon.restore();
    await User.deleteMany({});
  });

  // ==================== GET /api/profile ====================
  describe("GET /api/profile", () => {
    it("returns user profile with all fields", async () => {
      const res = await authGet("/api/profile");

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("id");
      expect(res.body).to.have.property("username");
      expect(res.body).to.have.property("name", "Profile Tester");
      expect(res.body).to.have.property("email");
      expect(res.body).to.have.property("aboutMe", "Test about me");
      expect(res.body).to.have.property("background", "Test background");
      expect(res.body).to.have.property("interests", "Test interests");
      expect(res.body).to.have.property("privacy");
      expect(res.body).to.have.property("notifications");
    });

    it("returns default values for empty profile fields", async () => {
      // Create user without profile fields
      const ts = Date.now().toString().slice(-6);
      const minimalUser = await new User({
        username: `min_${ts}`,
        email: `minimal_${ts}@example.com`,
        password: "password123",
        name: "Minimal User",
      }).save();

      const minimalToken = minimalUser.generateJWT();

      const res = await request(app)
        .get("/api/profile")
        .set("Authorization", `JWT ${minimalToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.aboutMe).to.equal("");
      expect(res.body.background).to.equal("");
      expect(res.body.interests).to.equal("");
    });

    it("prepends base URL when avatar is a relative path", async () => {
      testUser.avatar = "/uploads/test-avatar.jpg";
      await testUser.save();

      const res = await authGet("/api/profile");

      expect(res.status).to.equal(200);
      expect(res.body.profilePhoto).to.include("/uploads/test-avatar.jpg");
      // supertest 默认 host 会是 127.0.0.1:port
      expect(res.body.profilePhoto).to.match(/^http:\/\/.+\/uploads\//);
    });

    it("returns 404 when user does not exist", async () => {
      await User.deleteMany({});
      const res = await authGet("/api/profile");
      expect(res.status).to.equal(404);
      expect(res.body).to.have.property("error", "User not found");
    });

    it("returns 500 when DB error occurs", async () => {
      const stub = sinon
        .stub(User, "findById")
        .throws(new Error("DB error in GET"));

      const res = await authGet("/api/profile");

      expect(res.status).to.equal(500);
      expect(res.body).to.have.property("error", "Server error");
      stub.restore();
    });

    it("returns 401 without JWT token", async () => {
      const res = await request(app).get("/api/profile");
      expect(res.status).to.equal(401);
    });
  });

  // ==================== PUT /api/profile ====================
  describe("PUT /api/profile", () => {
    it("updates profile fields successfully", async () => {
      const res = await authPut("/api/profile").send({
        name: "Updated Name",
        aboutMe: "Updated about me",
        background: "Updated background",
        interests: "Updated interests",
      });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body.profile).to.have.property("name", "Updated Name");
      expect(res.body.profile).to.have.property("aboutMe", "Updated about me");
    });

    it("updates username successfully", async () => {
      const ts = Date.now().toString().slice(-6);
      const newUsername = `newuser_${ts}`;
      const res = await authPut("/api/profile").send({ username: newUsername });

      expect(res.status).to.equal(200);
      expect(res.body.profile.username).to.equal(newUsername.toLowerCase());
    });

    it("rejects username that is too short", async () => {
      const res = await authPut("/api/profile").send({ username: "ab" });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property("error");
    });

    it("rejects username with invalid characters", async () => {
      const res = await authPut("/api/profile").send({ username: "invalid user!" });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property("error");
    });

    it("rejects aboutMe exceeding 500 characters", async () => {
      const longText = "a".repeat(501);
      const res = await authPut("/api/profile").send({ aboutMe: longText });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property("error");
    });

    it("returns 404 when user not found during profile update", async () => {
      await User.deleteMany({});
      const res = await authPut("/api/profile").send({ name: "No User" });

      expect(res.status).to.equal(404);
      expect(res.body).to.have.property("error", "User not found");
    });

    it("rejects duplicate username", async () => {
      const dupUser = await new User({
        username: "duplicateuser",
        email: "dup@example.com",
        password: "password123",
        name: "Dup",
      }).save();

      const res = await authPut("/api/profile").send({
        username: dupUser.username,
      });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property("error", "Username already taken");
    });

    it("returns 500 when DB error occurs in profile update", async () => {
      const stub = sinon
        .stub(User, "findByIdAndUpdate")
        .throws(new Error("DB error in PUT /profile"));

      const res = await authPut("/api/profile").send({ name: "Broken" });

      expect(res.status).to.equal(500);
      expect(res.body).to.have.property("error", "Server error");
      stub.restore();
    });

    it("returns 401 without JWT token", async () => {
      const res = await request(app)
        .put("/api/profile")
        .send({ name: "Test" });

      expect(res.status).to.equal(401);
    });
  });

  // ==================== PUT /api/profile/password ====================
  describe("PUT /api/profile/password", () => {
    it("changes password successfully with correct current password", async () => {
      const res = await authPut("/api/profile/password").send({
        currentPassword: "password123",
        newPassword: "newpassword456",
      });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body).to.have.property(
        "message",
        "Password changed successfully"
      );
    });

    it("rejects incorrect current password", async () => {
      const res = await authPut("/api/profile/password").send({
        currentPassword: "wrongpassword",
        newPassword: "newpassword456",
      });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property(
        "error",
        "Current password is incorrect"
      );
    });

    it("rejects new password that is too short", async () => {
      const res = await authPut("/api/profile/password").send({
        currentPassword: "password123",
        newPassword: "12345",
      });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property("error");
    });

    it("rejects missing current password", async () => {
      const res = await authPut("/api/profile/password").send({
        newPassword: "newpassword456",
      });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property("error");
    });

    it("rejects missing new password", async () => {
      const res = await authPut("/api/profile/password").send({
        currentPassword: "password123",
      });

      expect(res.status).to.equal(400);
    });

    it("rejects password change for Google OAuth accounts", async () => {
      const ts = Date.now().toString().slice(-6);
      const googleUser = await new User({
        username: `guser_${ts}`,
        email: `google_${ts}@example.com`,
        // password 为空，让 !user.password 为 true
        password: "",
        name: "Google User",
        authProvider: "google",
      }).save();

      const googleToken = googleUser.generateJWT();

      const res = await request(app)
        .put("/api/profile/password")
        .set("Authorization", `JWT ${googleToken}`)
        .send({
          currentPassword: "anything",
          newPassword: "newpassword456",
        });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property(
        "error",
        "Cannot change password for Google OAuth accounts"
      );
    });

    it("returns 404 when user not found during password change", async () => {
      await User.deleteMany({});
      const res = await authPut("/api/profile/password").send({
        currentPassword: "password123",
        newPassword: "newpassword456",
      });

      expect(res.status).to.equal(404);
      expect(res.body).to.have.property("error", "User not found");
    });

    it("returns 500 when DB error occurs in password change", async () => {
      const stub = sinon
        .stub(User, "findById")
        .throws(new Error("DB error in password"));

      const res = await authPut("/api/profile/password").send({
        currentPassword: "password123",
        newPassword: "newpassword456",
      });

      expect(res.status).to.equal(500);
      expect(res.body).to.have.property("error", "Server error");
      stub.restore();
    });

    it("returns 401 without JWT token", async () => {
      const res = await request(app).put("/api/profile/password").send({
        currentPassword: "password123",
        newPassword: "newpassword456",
      });

      expect(res.status).to.equal(401);
    });
  });

  // ==================== PUT /api/profile/privacy ====================
  describe("PUT /api/profile/privacy", () => {
    it("updates visibility setting", async () => {
      const res = await authPut("/api/profile/privacy").send({
        visibility: "Public",
      });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body.privacy).to.have.property("visibility", "Public");
    });

    it("updates canMessage setting", async () => {
      const res = await authPut("/api/profile/privacy").send({
        canMessage: "Friends Only",
      });

      expect(res.status).to.equal(200);
      expect(res.body.privacy).to.have.property(
        "canMessage",
        "Friends Only"
      );
    });

    it("updates onlineStatus setting", async () => {
      const res = await authPut("/api/profile/privacy").send({
        onlineStatus: false,
      });

      expect(res.status).to.equal(200);
      expect(res.body.privacy).to.have.property("onlineStatus", false);
    });

    it("updates multiple privacy settings at once", async () => {
      const res = await authPut("/api/profile/privacy").send({
        visibility: "Friends Only",
        canMessage: "No One",
        onlineStatus: false,
      });

      expect(res.status).to.equal(200);
      expect(res.body.privacy.visibility).to.equal("Friends Only");
      expect(res.body.privacy.canMessage).to.equal("No One");
      expect(res.body.privacy.onlineStatus).to.equal(false);
    });

    it("rejects invalid visibility option", async () => {
      const res = await authPut("/api/profile/privacy").send({
        visibility: "InvalidOption",
      });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property("error");
    });

    it("rejects invalid canMessage option", async () => {
      const res = await authPut("/api/profile/privacy").send({
        canMessage: "InvalidOption",
      });

      expect(res.status).to.equal(400);
    });

    it("rejects non-boolean onlineStatus", async () => {
      const res = await authPut("/api/profile/privacy").send({
        onlineStatus: "yes",
      });

      expect(res.status).to.equal(400);
    });

    it("returns 404 when user not found during privacy update", async () => {
      await User.deleteMany({});
      const res = await authPut("/api/profile/privacy").send({
        visibility: "Public",
      });

      expect(res.status).to.equal(404);
      expect(res.body).to.have.property("error", "User not found");
    });

    it("returns 500 when DB error occurs in privacy update", async () => {
      const stub = sinon
        .stub(User, "findByIdAndUpdate")
        .throws(new Error("DB error in privacy"));

      const res = await authPut("/api/profile/privacy").send({
        visibility: "Public",
      });

      expect(res.status).to.equal(500);
      expect(res.body).to.have.property("error", "Server error");
      stub.restore();
    });

    it("returns 401 without JWT token", async () => {
      const res = await request(app)
        .put("/api/profile/privacy")
        .send({ visibility: "Public" });

      expect(res.status).to.equal(401);
    });
  });

  // ==================== PUT /api/profile/notifications ====================
  describe("PUT /api/profile/notifications", () => {
    it("updates boardUpdates setting", async () => {
      const res = await authPut("/api/profile/notifications").send({
        boardUpdates: false,
      });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body.notifications).to.have.property("boardUpdates", false);
    });

    it("updates newMessages setting", async () => {
      const res = await authPut("/api/profile/notifications").send({
        newMessages: false,
      });

      expect(res.status).to.equal(200);
      expect(res.body.notifications).to.have.property(
        "newMessages",
        false
      );
    });

    it("updates newFollower setting", async () => {
      const res = await authPut("/api/profile/notifications").send({
        newFollower: false,
      });

      expect(res.status).to.equal(200);
      expect(res.body.notifications).to.have.property(
        "newFollower",
        false
      );
    });

    it("updates multiple notification settings at once", async () => {
      const res = await authPut("/api/profile/notifications").send({
        boardUpdates: false,
        newMessages: false,
        newFollower: false,
      });

      expect(res.status).to.equal(200);
      expect(res.body.notifications.boardUpdates).to.equal(false);
      expect(res.body.notifications.newMessages).to.equal(false);
      expect(res.body.notifications.newFollower).to.equal(false);
    });

    it("rejects non-boolean boardUpdates", async () => {
      const res = await authPut("/api/profile/notifications").send({
        boardUpdates: "yes",
      });

      expect(res.status).to.equal(400);
    });

    it("rejects non-boolean newMessages", async () => {
      const res = await authPut("/api/profile/notifications").send({
        newMessages: "abc",
      });

      expect(res.status).to.equal(400);
    });

    it("returns 404 when user not found during notifications update", async () => {
      await User.deleteMany({});
      const res = await authPut("/api/profile/notifications").send({
        boardUpdates: false,
      });

      expect(res.status).to.equal(404);
      expect(res.body).to.have.property("error", "User not found");
    });

    it("returns 500 when DB error occurs in notifications update", async () => {
      const stub = sinon
        .stub(User, "findByIdAndUpdate")
        .throws(new Error("DB error in notifications"));

      const res = await authPut("/api/profile/notifications").send({
        boardUpdates: false,
      });

      expect(res.status).to.equal(500);
      expect(res.body).to.have.property("error", "Server error");
      stub.restore();
    });

    it("returns 401 without JWT token", async () => {
      const res = await request(app)
        .put("/api/profile/notifications")
        .send({ boardUpdates: false });

      expect(res.status).to.equal(401);
    });
  });

  // ==================== POST /api/profile/photo ====================
  describe("POST /api/profile/photo", () => {
    // Create a test image file
    const testImagePath = path.join(__dirname, "test-image.jpg");
    const badFilePath = path.join(__dirname, "not-image.txt");

    before(() => {
      // Minimal valid JPEG file for testing
      const minimalJpeg = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
        0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
        0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
        0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
        0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
        0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
        0x09, 0x0a, 0x0b, 0xff, 0xc4, 0x00, 0xb5, 0x10, 0x00, 0x02, 0x01, 0x03,
        0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7d,
        0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
        0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08,
        0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72,
        0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28,
        0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45,
        0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
        0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75,
        0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
        0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3,
        0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6,
        0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9,
        0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2,
        0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4,
        0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01,
        0x00, 0x00, 0x3f, 0x00, 0xfb, 0xd5, 0xdb, 0x20, 0xa8, 0xf1, 0x7e, 0xff,
        0xd9,
      ]);
      fs.writeFileSync(testImagePath, minimalJpeg);
      fs.writeFileSync(badFilePath, "not an image");
    });

    after(() => {
      if (fs.existsSync(testImagePath)) fs.unlinkSync(testImagePath);
      if (fs.existsSync(badFilePath)) fs.unlinkSync(badFilePath);
    });

    it("uploads profile photo successfully", async () => {
      const res = await authPost("/api/profile/photo").attach(
        "profilePhoto",
        testImagePath
      );

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body)
        .to.have.property("photoUrl")
        .that.includes("/uploads/");
    });

    it("rejects upload without file", async () => {
      const res = await authPost("/api/profile/photo");

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property("error", "No file uploaded");
    });

    it("rejects non-image file", async () => {
      const res = await authPost("/api/profile/photo").attach(
        "profilePhoto",
        badFilePath
      );

      // Multer 会抛错，由全局 error handler 处理，一般是 500
      expect(res.status).to.be.oneOf([400, 500]);
    });

    it("returns 500 when DB error occurs in photo upload", async () => {
      const stub = sinon
        .stub(User, "findByIdAndUpdate")
        .throws(new Error("DB error in photo"));

      const res = await authPost("/api/profile/photo").attach(
        "profilePhoto",
        testImagePath
      );

      expect(res.status).to.equal(500);
      expect(res.body).to.have.property("error", "Server error");
      stub.restore();
    });

    it("returns 401 without JWT token", async () => {
      const res = await request(app)
        .post("/api/profile/photo")
        .attach("profilePhoto", testImagePath);

      expect(res.status).to.equal(401);
    });
  });

  // ==================== DELETE /api/profile ====================
  describe("DELETE /api/profile", () => {
    it("deletes user account successfully", async () => {
      const res = await authDelete("/api/profile");

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body).to.have.property("message", "Account deleted");

      // Verify user is deleted
      const deletedUser = await User.findById(userId);
      expect(deletedUser).to.be.null;
    });

    it("returns 500 when DB error occurs during delete", async () => {
      const stub = sinon
        .stub(User, "findByIdAndDelete")
        .throws(new Error("DB error in delete"));

      const res = await authDelete("/api/profile");

      expect(res.status).to.equal(500);
      expect(res.body).to.have.property("error", "Server error");
      stub.restore();
    });

    it("returns 401 without JWT token", async () => {
      const res = await request(app).delete("/api/profile");

      expect(res.status).to.equal(401);
    });
  });
});
