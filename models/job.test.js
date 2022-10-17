"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


/************************************** create */

describe("create", function () {
  const newJob = {
    title: "new job",
    salary: 80000,
    equity: 0.010,
    companyHandle: 'c1'
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    // expect(job).toEqual({
    //     title: "new job",
    //     salary: 80000,
    //     equity: 0.010,
    //     company_handle: 'c1'
    // });
    expect(job.id).toEqual(expect.any(Number));
    expect(job.salary).toEqual(80000);
  });

});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    // const res = await db.query(
    //   "SELECT * FROM jobs");
    // let id = res.rows[0].id;

    let jobs = await Job.findAll({});
    expect(jobs).toEqual([
      {
        title: 'Conservator, furniture',
        salary: 110000,
        equity: "0",
        "companyHandle": 'c1',
        "companyName": "C1"
      },
      {
        title: 'Consulting civil engineer',
        salary: 60000,
        equity: "0",
        "companyHandle": 'c3',
        "companyName": "C3"
      },
      {
        title: 'Information officer',
        salary: 200000,
        equity: "0",
        "companyHandle": 'c2',
        "companyName": "C2"
      },

    ]);
  });


  test("test title filter", async function () {

    let jobs = await Job.findAll({title:'Con'});
    expect(jobs).toEqual([
      {
        title: 'Conservator, furniture',
        salary: 110000,
        equity: "0",
        "companyHandle": 'c1',
        "companyName": "C1"
      },
      {
        title: 'Consulting civil engineer',
        salary: 60000,
        equity: "0",
        "companyHandle": 'c3',
        "companyName": "C3"
      }

    ]);
  });


});


/************************************** findAll with filtering */

describe("findAll", function () {
  test("works with name filter", async function () {
    let jobs = await Job.findAll({title:'rnit'});
    // console.log(jobs)
    expect(jobs).toEqual([
        {
            title: 'Conservator, furniture',
            salary: 110000,
            equity: "0",
            companyHandle: 'c1',
            companyName: "C1"
          }
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    const res = await db.query(
        "SELECT * FROM jobs");
    let id = res.rows[0].id;
    let job = await Job.get(id);
    expect(job).toEqual({
        title: 'Conservator, furniture',
        salary: 110000,
        equity: "0",
        companyHandle: 'c1',
      });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: 'Updated Title'
  };

  test("works", async function () {

    const res = await db.query(
      "SELECT * FROM jobs");
    let id = res.rows[0].id;
    console.log(id)

    let job = await Job.update(id, updateData);
    console.log(job);
    expect(job).toEqual({
      companyHandle: "c1",
      salary: 110000,
      equity: '0',
      title: 'Updated Title'
    });
  });

  test("works: null fields", async function () {
    const res = await db.query(
      "SELECT * FROM jobs");
    let id = res.rows[0].id;

    const updateDataSetNulls = {
      title: 'New',
      salary: null,
      equity: null,
    };

    let job = await Job.update(id, updateDataSetNulls);
    
    expect(job).toEqual({
      companyHandle:'c1',
      ...updateDataSetNulls,
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${id}`);

    expect(result.rows).toEqual([{
      'id': id,
      title: 'New',
      salary: null,
      equity: null,
      company_handle: "c1"
    }]);
  });

  test("not found if no such job", async function () {
    const updateData = {
      title: 'Burner, furniture',
      salary: 120000,
      equity: 0,
    };

    try {
      await Job.update(1000, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    const res = await db.query(
      "SELECT * FROM jobs");
    let id = res.rows[0].id;

    try {
      await Job.update(id, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    const res = await db.query(
        "SELECT * FROM jobs");
    const id = res.rows[0].id;

    await Job.remove(id);

    const newRes = await db.query(
      "SELECT COUNT(*) FROM jobs WHERE id = $1", [id]
    );
    expect(newRes.rows[0].count).toEqual("0");
  });

  test("not found if no such company", async function () {
    try {
      await Job.remove(1000);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
