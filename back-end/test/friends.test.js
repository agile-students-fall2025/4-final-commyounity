import { use, expect } from "chai";
import { default as chaiHttp, request } from "chai-http";
import app from "../app.js";

use(chaiHttp);


it("/api/friends responds with a JSON list of friends", (done) => {
  request
    .execute(app)
    .get("/api/friends")
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body).to.have.property("data").that.is.an("array");
      expect(res.body).to.have.property("meta").that.includes.keys([
        "total",
        "count",
        "cacheSource",
      ]);

      if (res.body.data.length > 0) {
        const f = res.body.data[0];
        expect(f).to.have.property("id");
        expect(f).to.have.property("first_name");
        expect(f).to.have.property("last_name");
        expect(f).to.have.property("username");

        expect(
          f.avatar || f.profilePhotoURL,
          "friend should have avatar or profilePhotoURL"
        ).to.be.a("string");

        if (f.mutualCount !== undefined) expect(f.mutualCount).to.be.a("number");
        if (f.online !== undefined) expect(f.online).to.be.a("boolean");
      }
      done();
    });
});

it("/api/friends items each include an id", (done) => {
  request
    .execute(app)
    .get("/api/friends")
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body).to.have.property("data").that.is.an("array");
      for (const friend of res.body.data) {
        expect(friend).to.be.an("object");
        expect(friend).to.have.property("id");
      }
      done();
    });
});

it("/api/friends filters by username when requested", (done) => {
  request
    .execute(app)
    .get("/api/friends")
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(200);
      const first = res.body?.data?.[0];
      expect(first, "Expected at least one friend to test filtering").to.be.an(
        "object"
      );
      const username = encodeURIComponent(String(first.username || "").trim());
      expect(username.length).to.be.greaterThan(0);

      request
        .execute(app)
        .get(`/api/friends?username=${username}`)
        .end((err2, res2) => {
          expect(err2).to.be.null;
          expect(res2).to.have.status(200);
          expect(res2.body).to.have.property("data").that.is.an("array");
          expect(res2.body.meta).to.have.property("filtered", true);
          expect(res2.body.meta).to.have.property("filterType", "username");
          expect(res2.body.data[0]?.username?.toLowerCase()).to.equal(
            first.username.toLowerCase()
          );
          done();
        });
    });
});

it("/api/friends returns empty data when username is not found", (done) => {
  const fake = `does-not-exist-${Date.now()}`;
  request
    .execute(app)
    .get(`/api/friends?username=${fake}`)
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(200);
      expect(res.body.data).to.be.an("array").that.has.length(0);
      expect(res.body.meta).to.have.property("filtered", true);
      done();
    });
});

it("/api/friends rejects invalid username characters", (done) => {
  request
    .execute(app)
    .get("/api/friends?username=bad name")
    .end((err, res) => {
      expect(res).to.have.status(400);
      expect(res.body).to.have.property("error");
      done();
    });
});

it("/api/friends returns 503 when simulateError flag is set", (done) => {
  request
    .execute(app)
    .get("/api/friends")
    .query({ simulateError: true })
    .end((err, res) => {
      expect(res).to.have.status(503);
      expect(res.body).to.have.property("error");
      expect(res.body.meta).to.have.property("simulated", true);
      done();
    });
});
