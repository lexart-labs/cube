const request = require("supertest");
const conn = require("../../config/conn.js");
const app = require("../../server");

describe("burnout_tests", function () {
  const userId = 1;

  it("/burnout_tests/all", function (done) {
    request(app)
      .get("/burnout_tests/all")
      .set("user-id", userId)
      .query({ page: 2 })
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200)
      .end(function (err, res) {
        expect(conn.query).toHaveBeenCalledWith(expect.anything(), [userId.toString()]);
        if (err) return done(err);
        return done();
      });
  });

  it("/burnout_tests/count", function (done) {
    request(app)
      .get("/burnout_tests/count")
      .set("user-id", userId)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200)
      .end(function (err, res) {
        expect(conn.query).toHaveBeenCalledWith(expect.anything(), [userId.toString()]);
        if (err) return done(err);
        return done();
      });
  });

  const burnOutTestId = 1;
  it(`/burnout_tests/${burnOutTestId}`, function (done) {
    request(app)
      .get(`/burnout_tests/${burnOutTestId}`)
      .set("user-id", userId)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200)
      .end(function (err, res) {
        expect(conn.query).toHaveBeenCalledWith(expect.anything(), [burnOutTestId.toString()]);
        if (err) return done(err);
        return done();
      });
  });

  const entryCreate = {
    value: [0, 0, 1],
    score: 1,
  }

  it("/burnout_tests/upsert -> create", function (done) {
    request(app)
      .post("/burnout_tests/upsert")
      .set("user-id", userId)
      .send({value: entryCreate.value})
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200)
      .end(function (err, res) {
        expect(conn.query).toHaveBeenCalledWith(expect.anything(), [
          userId.toString(), 
          JSON.stringify(entryCreate.value), 
          entryCreate.score
        ]);
        if (err) return done(err);
        return done();
      });
  }, 20000);

  const entryUpdate = {
    id: 1,
    value: [0, 0, 2],
    score: 2,
  }

  it("/burnout_tests/upsert -> modify", function (done) {
    request(app)
      .post("/burnout_tests/upsert")
      .set("user-id", userId)
      .send({ id: entryUpdate.id, value: entryUpdate.value })
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200)
      .end(function (err, res) {
        expect(conn.query).toHaveBeenCalledWith(expect.anything(), [
          userId.toString(), 
          JSON.stringify(entryUpdate.value), 
          entryUpdate.score,
          entryUpdate.id
        ]);
        if (err) return done(err);
        return done();
      });
  }, 20000);

});
