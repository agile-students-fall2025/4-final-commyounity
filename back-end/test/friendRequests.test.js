import { use, expect } from "chai";
import { default as chaiHttp, request } from "chai-http";
import app from "../app.js";

use(chaiHttp);

describe("Friend Requests API", () => {
  it("GET /api/friend-requests returns cached requests", (done) => {
    request
      .execute(app)
      .get("/api/friend-requests")
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body).to.have.property("data").that.is.an("array");
        expect(res.body).to.have.property("meta");
        done();
      });
  });

  it("POST /api/friend-requests/:id/accept removes the request and returns friend payload", (done) => {
    request
      .execute(app)
      .get("/api/friend-requests")
      .end((err, res) => {
        expect(err).to.be.null;
        const target = res.body.data[0];
        expect(target).to.exist;

        request
          .execute(app)
          .post(`/api/friend-requests/${encodeURIComponent(target.id)}/accept`)
          .end((err2, res2) => {
            expect(err2).to.be.null;
            expect(res2).to.have.status(200);
            expect(res2.body).to.include({ status: "accepted" });
            expect(res2.body.friend).to.include.keys(
              "id",
              "first_name",
              "last_name",
              "username"
            );
            done();
          });
      });
  });

  it("POST /api/friend-requests/:id/decline removes the request and echoes declined data", (done) => {
    request
      .execute(app)
      .get("/api/friend-requests")
      .end((err, res) => {
        expect(err).to.be.null;
        const target = res.body.data[0];
        expect(target).to.exist;

        request
          .execute(app)
          .post(`/api/friend-requests/${encodeURIComponent(target.id)}/decline`)
          .end((err2, res2) => {
            expect(err2).to.be.null;
            expect(res2).to.have.status(200);
            expect(res2.body).to.include({ status: "declined" });
            expect(res2.body.declinedRequest).to.include.keys("id", "username");
            done();
          });
      });
  });
});
