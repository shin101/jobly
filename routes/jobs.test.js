"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "Software engineer",
    salary: 150000,
    equity: "0",
    companyHandle: "c1"
  };

  test("ok for users", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${adminToken}`);
    
    console.log(resp.body)
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "Software engineer",
        salary: 150000,
        equity: "0",
        companyHandle: "c1"
      }
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          salary: 10,
          equity: "0"
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          equity: -2,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
          [
            {
              title: "Conservator, furniture",
              salary: 110000,
              equity: "0",
              companyHandle: "c1",
              companyName: "C1"
            },
            {
              title: "Consulting civil engineer",
              salary: 60000,
              equity: "0",
              companyHandle: "c3",
              companyName: "C3"
            },
            {
              title: "Information officer",
              salary: 200000,
              equity: "0",
              companyHandle: "c2",
              companyName: "C2"
            }
          ],
    });
  });


  test("fails: test next() handler", async function () {
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});




/************************************** GET /companies/:handle */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const res = await db.query("SELECT * FROM jobs")
    const id = res.rows[0].id;

    const resp = await request(app).get(`/jobs/${id}`);
    expect(resp.body).toEqual({
      job: {
        title: "Conservator, furniture",
        salary: 110000,
        equity: "0",
        companyHandle: "c1"
      },
    });
  });

  test("works for anon: job", async function () {
    const res = await db.query("SELECT * FROM jobs")
    const id = res.rows[0].id;

    const resp = await request(app).get(`/jobs/${id}`);
    
    expect(resp.body).toEqual({
      job: {
        title: "Conservator, furniture",
        salary: 110000,
        equity: "0",
        companyHandle: "c1"
      },
    });
  });


  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/10000`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for users", async function () {

    const res = await db.query("SELECT * FROM jobs")
    const id = res.rows[0].id;
    
    const resp = await request(app)
        .patch(`/jobs/${id}`)
        .send({
          title: "C1-new",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job: {
        title: "C1-new",
        salary: 110000,
        equity: "0",
        companyHandle: "c1"
      },
    });
  });

  test("unauth for anon", async function () {
    const res = await db.query("SELECT * FROM jobs")
    const id = res.rows[0].id;
    
    const resp = await request(app)
        .patch(`/jobs/${id}`)
        .send({
          title: "C1-new",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/1000000`)
        .send({
          title: "C1-new",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on handle change attempt", async function () {
    const res = await db.query("SELECT * FROM jobs")
    const id = res.rows[0].id;

    const resp = await request(app)
        .patch(`/jobs/${id}`)
        .send({
          handle: "c1-new",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const res = await db.query("SELECT * FROM jobs")
    const id = res.rows[0].id;

    const resp = await request(app)
        .patch(`/jobs/c1`)
        .send({
          title: 221,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for users", async function () {

    const res = await db.query("SELECT * FROM jobs")
    const id = res.rows[0].id;

    const resp = await request(app)
        .delete(`/jobs/${id}`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: `${id}` });
  });

  test("unauth for anon", async function () {
    const res = await db.query("SELECT * FROM jobs")
    const id = res.rows[0].id;

    const resp = await request(app)
        .delete(`/jobs/${id}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
        .delete(`/jobs/1000`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
