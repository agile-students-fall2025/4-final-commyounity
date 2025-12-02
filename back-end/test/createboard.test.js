import { use, expect } from "chai";
import chaiHttp, { request } from "chai-http";
import app from "../app.js";
import fs from "fs";
import os from "os";
import path from "path";

use(chaiHttp);

let jwtToken;


function createTempPng() {
  const base64Png =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGP4BwQACfsD/Qqk4mQAAAAASUVORK5CYII=";
  const buf = Buffer.from(base64Png, "base64");
  const tmpFile = path.join(os.tmpdir(), `test-${Date.now()}.png`);
  fs.writeFileSync(tmpFile, buf);
  return tmpFile;
}

before(async function () {
  this.timeout(15000);
  const ts = Date.now();
  const payload = {
    username: `cb_${ts}`,
    email: `cb_${ts}@example.com`,
    password: "Password123!",
    confirmPassword: "Password123!",
  };
  const res = await request.execute(app).post("/auth/signup").send(payload);
  expect(res).to.have.status(200);
  jwtToken = res.body.token;
});

describe("createBoard", () => {
  it("POST /api/boards/create -> 400 (missing title)", (done) => {
    request
      .execute(app)
      .post("/api/boards/create")
      .set("Authorization", `JWT ${jwtToken}`)
      .type("form")
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        expect(res.body).to.have.property("status", "error");
        expect(res.body).to.have.property("message").that.match(/title/i);
        done();
      });
  });

  it("POST /api/boards/create -> 400 (missing photo)", (done) => {
    request
      .execute(app)
      .post("/api/boards/create")
      .set("Authorization", `JWT ${jwtToken}`)
      .type("form")
      .field("title", "My Test Board")
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        expect(res.body).to.have.property("status", "error");
        expect(res.body).to.have.property("message").that.match(/cover photo/i);
        done();
      });
  });

  it("POST /api/boards/create -> 401 (unauthenticated)", (done) => {
    const tmpPng = createTempPng();
    request
      .execute(app)
      .post("/api/boards/create")
      .type("form")
      .field("title", "No Auth Board")
      .attach("photo", fs.createReadStream(tmpPng), "tiny.png")
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(401);
        done();
      });
  });

  it("POST /api/boards/create -> 201 (created)", (done) => {
    const tmpPng = createTempPng();
    request
      .execute(app)
      .post("/api/boards/create")
      .set("Authorization", `JWT ${jwtToken}`)
      .type("form")
      .field("title", "Created Board")
      .field("descriptionLong", "Created by test")
      .attach("photo", fs.createReadStream(tmpPng), "tiny.png")
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(201);
        expect(res.body).to.have.property("status", "created");
        expect(res.body).to.have.property("data").that.is.an("object");
        const { data } = res.body;
        expect(data).to.have.property("_id");
        expect(data).to.have.property("title", "Created Board");
        expect(data).to.have.property("isOwner", true);
        expect(data).to.have.property("isJoined", true);
        expect(data).to.have.property("memberCount").that.is.a("number");
        done();
      });
  });
});


