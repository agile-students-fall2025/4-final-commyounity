// test/createboard.test.js (CommonJS version)
const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("../app");
const fs = require("fs");
const os = require("os");
const path = require("path");
const mongoose = require("mongoose");          // ⬅️ add this
const Board = require("../models/Board");

const { expect } = chai;
chai.use(chaiHttp);

let jwtToken;
let createdBoards = [];     // track created boards
let tempFiles = [];         // track temp files

function createTempPng() {
  const base64Png =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGP4BwQACfsD/Qqk4mQAAAAASUVORK5CYII=";
  const buf = Buffer.from(base64Png, "base64");
  const tmpFile = path.join(os.tmpdir(), `test-${Date.now()}.png`);
  fs.writeFileSync(tmpFile, buf);
  tempFiles.push(tmpFile);       // remember for cleanup
  return tmpFile;
}

// ---------------------------
// BEFORE: create user
// ---------------------------
before(async function () {
  this.timeout(15000);
  const ts = Date.now();
  const payload = {
    username: `cb_${ts}`,
    email: `cb_${ts}@example.com`,
    password: "Password123!",
    confirmPassword: "Password123!",
  };
  const res = await chai.request(app).post("/auth/signup").send(payload);
  expect(res).to.have.status(200);
  jwtToken = res.body.token;
});

// ---------------------------
// TESTS (unchanged)
// ---------------------------
it("POST /api/boards/create returns 400 when title is missing", (done) => {
  const tmpFile = createTempPng();
  chai
    .request(app)
    .post("/api/boards/create")
    .set("Authorization", `JWT ${jwtToken}`)
    .field("descriptionLong", "A board without a title")
    .attach("photo", tmpFile)
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(400);
      expect(res.body).to.have.property("status", "error");
      done();
    });
});

it("POST /api/boards/create returns 201 when board is created successfully", (done) => {
  const tmpFile = createTempPng();
  chai
    .request(app)
    .post("/api/boards/create")
    .set("Authorization", `JWT ${jwtToken}`)
    .field("title", `Test Board ${Date.now()}`)
    .field("descriptionLong", "A test board description")
    .attach("photo", tmpFile)
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(201);
      expect(res.body).to.have.property("status").that.matches(/created|success/);
      expect(res.body).to.have.property("data");
      expect(res.body.data).to.have.property("title");

      // Track created board for cleanup
      if (res.body?.data?._id) {
        createdBoards.push(res.body.data._id);
      }

      done();
    });
});

// ---------------------------
// AFTER: clean up DB + temp files
// ---------------------------
after(async () => {
  // Only touch Mongo if connection still open
  if (mongoose.connection.readyState === 1 && createdBoards.length > 0) {
    await Board.deleteMany({ _id: { $in: createdBoards } });
  }

  // Always try to remove temp PNGs
  for (const file of tempFiles) {
    try {
      fs.unlinkSync(file);
    } catch (_) {
      // ignore
    }
  }
});