// test/profile.test.js
const chai = require("chai");
const request = require("supertest");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const app = require("../app");
const User = require("../models/User");

const { expect } = chai;

let token;
let userId;
let testUser;

// Helpers
const authGet = (p) => request(app).get(p).set("Authorization", `JWT ${token}`);
const authPut = (p) => request(app).put(p).set("Authorization", `JWT ${token}`);
const authPost = (p) => request(app).post(p).set("Authorization", `JWT ${token}`);
const authDelete = (p) => request(app).delete(p).set("Authorization", `JWT ${token}`);

describe("Profile routes", () => {
  
  beforeEach(async () => {
    const tsShort = Date.now().toString().slice(-6);

    
    await User.deleteMany({
      $or: [
        { username: /^ptest_/i },
        { username: /^min_/i },
        { username: /^guser_/i },
        { email: /^profile_.*@example\.com$/i },
        { email: /^minimal_.*@example\.com$/i },
        { email: /^google_.*@example\.com$/i },
      ],
    });

    testUser = await new User({
      username: `ptest_${tsShort}`,
      email: `profile_${tsShort}@example.com`,
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

 
  describe("GET /api/profile", () => {
    it("returns user profile with all fields", async () => {
      const res = await authGet("/api/profile");

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("username");
      expect(res.body).to.have.property("name", "Profile Tester");
      expect(res.body).to.have.property("email");
      expect(res.body).to.have.property("aboutMe", "Test about me");
      expect(res.body).to.have.property("background", "Test background");
      expect(res.body).to.have.property("interests", "Test interests");
      expect(res.body).to.have.property("privacy");
      expect(res.body).to.have.property("notifications");
    });

    it("returns default values for empty fields", async () => {
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
      expect(res.body.profilePhoto).to.match(/^http:\/\/.+\/uploads\//);
    });

    it("returns 401 when user does not exist", async () => {
     
      await User.deleteOne({ _id: userId });

      const res = await authGet("/api/profile");
      expect(res.status).to.equal(401);
    });

    it("returns 401 without token", async () => {
      const res = await request(app).get("/api/profile");
      expect(res.status).to.equal(401);
    });
  });

 
  describe("PUT /api/profile", () => {
    it("updates profile fields", async () => {
      const res = await authPut("/api/profile").send({
        name: "Updated Name",
      });
      expect(res.status).to.equal(200);
    });

    it("updates username", async () => {
      const newU = "newuser_" + Date.now().toString().slice(-6);
      const res = await authPut("/api/profile").send({ username: newU });
      expect(res.status).to.equal(200);
      expect(res.body.profile.username).to.equal(newU.toLowerCase());
    });

    it("rejects invalid username", async () => {
      const res = await authPut("/api/profile").send({ username: "bad user" });
      expect(res.status).to.equal(400);
    });

    it("returns 404 when user missing", async () => {
      await User.deleteOne({ _id: userId });

      const res = await authPut("/api/profile").send({ name: "X" });
      expect(res.status).to.equal(404);
    });
  });

  
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
        password: "Placeholder123!",
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
      await User.deleteOne({ _id: userId });

      const res = await authPut("/api/profile/password").send({
        currentPassword: "password123",
        newPassword: "newpassword456",
      });

      expect(res.status).to.equal(404);
      expect(res.body).to.have.property("error", "User not found");
    });

    it("returns 401 without JWT token", async () => {
      const res = await request(app).put("/api/profile/password").send({
        currentPassword: "password123",
        newPassword: "newpassword456",
      });

      expect(res.status).to.equal(401);
    });
  });

  

    describe("POST /api/profile/photo", () => {
      const testImagePath = path.join(__dirname, "test-image.jpg");
      const badFilePath = path.join(__dirname, "not-image.txt");
  
      const authPost = (url) => {
        return request(app)
          .post(url)
          .set("Authorization", `JWT ${global.testToken}`); 
      };
  
      before(() => {
        const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]); 
        fs.writeFileSync(testImagePath, jpeg);
        fs.writeFileSync(badFilePath, "not image");
      });
  
      after(() => {
        if (fs.existsSync(testImagePath)) fs.unlinkSync(testImagePath);
        if (fs.existsSync(badFilePath)) fs.unlinkSync(badFilePath);
      });
  
      it("returns 401 without JWT token", async () => {
        const res = await request(app)
          .post("/api/profile/photo")
          .attach("profilePhoto", testImagePath);
  
        expect(res.status).to.equal(401);
      });
    });

  
  describe("DELETE /api/profile", () => {
    it("deletes user account successfully", async () => {
      const res = await authDelete("/api/profile");

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body).to.have.property("message", "Account deleted");

      const deletedUser = await User.findById(userId);
      expect(deletedUser).to.be.null;
    });

    it("returns 401 without JWT token", async () => {
      const res = await request(app).delete("/api/profile");
      expect(res.status).to.equal(401);
    });
  });

 
  after(async () => {
    if (mongoose.connection.readyState !== 1) return;


    await new Promise((r) => setTimeout(r, 150));

    const deletedUsers = await User.deleteMany({
      $or: [
        { username: /^ptest_/i },
        { username: /^min_/i },
        { username: /^guser_/i },
        { email: /^profile_.*@example\.com$/i },
        { email: /^minimal_.*@example\.com$/i },
        { email: /^google_.*@example\.com$/i },
      ],
    });

    console.log(`[PROFILE CLEANUP] Removed ${deletedUsers.deletedCount} test users`);

   
  });
});