import { use, expect } from "chai";
import chaiHttp, { request } from "chai-http";
import mongoose from "mongoose";
import app from "../app.js";
import Board from "../models/Board.js";

use(chaiHttp);

let userToken;
let userId;

before(async function () {
  this.timeout(20000);
  const ts = Date.now();

  // 注册测试用户，获取 JWT
  const signup = await request
    .execute(app)
    .post("/auth/signup")
    .send({
      username: `br_${ts}`,
      email: `browse_${ts}@example.com`,
      password: "Password123!",
      confirmPassword: "Password123!",
    });
  expect(signup).to.have.status(200);
  userToken = signup.body.token;

  // 获取用户 id
  const me = await request
    .execute(app)
    .get("/api/profile")
    .set("Authorization", `JWT ${userToken}`);
  expect(me).to.have.status(200);
  userId = String(me.body.id);
});

describe("browseBoards 路由", () => {
  it("GET /api/browse/boards -> 200 且返回数组", (done) => {
    request
      .execute(app)
      .get("/api/browse/boards")
      .set("Authorization", `JWT ${userToken}`)
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body).to.have.property("status", "success");
        expect(res.body).to.have.property("data").that.is.an("array");
        done();
      });
  });

  it("过滤：排除自己拥有/已加入，包含其他可浏览的看板", async function () {
    this.timeout(20000);

    // 构造数据
    const otherOwner = new mongoose.Types.ObjectId();

    // 包含：其他拥有，用户未加入
    const includeA = await Board.create({
      title: "Public Board A",
      descriptionLong: "A",
      owner: otherOwner,
      members: [],
    });

    // 排除：自己拥有
    const excludeOwned = await Board.create({
      title: "My Owned Board",
      descriptionLong: "Owned by me",
      owner: new mongoose.Types.ObjectId(userId),
      members: [new mongoose.Types.ObjectId(userId)],
    });

    // 排除：其他拥有但我已加入
    const excludeJoined = await Board.create({
      title: "Already Joined",
      descriptionLong: "I am a member",
      owner: otherOwner,
      members: [new mongoose.Types.ObjectId(userId)],
    });

    // 包含：其他拥有，用户未加入
    const includeB = await Board.create({
      title: "Public Board B",
      descriptionLong: "B",
      owner: otherOwner,
      members: [],
    });

    const res = await request
      .execute(app)
      .get("/api/browse/boards")
      .set("Authorization", `JWT ${userToken}`);

    expect(res).to.have.status(200);
    expect(res.body).to.have.property("status", "success");
    const list = res.body.data;
    expect(list).to.be.an("array");

    const ids = new Set(list.map((b) => String(b.id)));

    expect(ids.has(includeA._id.toString())).to.equal(true, "should include includeA");
    expect(ids.has(includeB._id.toString())).to.equal(true, "should include includeB");
    expect(ids.has(excludeOwned._id.toString())).to.equal(false, "should exclude my owned board");
    expect(ids.has(excludeJoined._id.toString())).to.equal(false, "should exclude board I joined");

    // 结果每项字段存在性校验
    if (list.length > 0) {
      const item = list[0];
      expect(item).to.have.property("id");
      expect(item).to.have.property("title");
      expect(item).to.have.property("descriptionLong");
      expect(item).to.have.property("coverPhotoURL");
      expect(item).to.have.property("memberCount");
    }
  });
});


