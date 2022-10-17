"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError, ExpressError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws BadRequestError if job already in database.
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [
          title,
          salary,
          equity,
          companyHandle,
        ]);
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * Can filter by title, minSlary, hasEquity
   * */

  static async findAll({title, minSalary, hasEquity}) {
    title = title || '';
    minSalary = minSalary || null;
    hasEquity = hasEquity || null;

    let baseQuery = `
    SELECT 
      j.title,
      j.salary,
      j.equity,
      j.company_handle AS "companyHandle",
      c.name AS "companyName"
    FROM jobs j
      LEFT JOIN companies AS c ON c.handle = j.company_handle`;
    let queryVariables = [];
    let whereClauses = [];

    if (title){
      queryVariables.push(`%${title}%`);
      whereClauses.push(`title ILIKE $${queryVariables.length}`);
    }

    if (minSalary){
      queryVariables.push(+minSalary);
      whereClauses.push(`salary >= $${queryVariables.length}`);
    }
    
    // hasEquity: if true, filter to jobs that provide a non-zero amount of equity. If false or not included in the filtering, list all jobs regardless of equity. 

    if (hasEquity){
      queryVariables.push(+hasEquity);
      whereClauses.push(`equity > 0`);
    } 


    if (whereClauses.length>0){
      baseQuery += ' WHERE ' + whereClauses.join(' AND ')
    }

    baseQuery += ' ORDER BY title';

    console.log(baseQuery, queryVariables);

    const jobsRes = await db.query(baseQuery, queryVariables);
    
    return jobsRes.rows;
  }





  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobsRes = await db.query(
      `SELECT 
        title, 
        salary, 
        equity, 
        company_handle AS "companyHandle"
      FROM jobs
      WHERE id = $1`,
    [id]);

    const job = jobsRes.rows[0];

    if (!job) throw new NotFoundError(`No job ID: ${job}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  // Updating a job should never change the ID of a job, nor the company associated with a job.

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          title: "title",
          salary: "salary",
          equity: "equity",
        });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No such job id: ${id}`);

    return job;
  }

  /** Delete a given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job id: ${id}`);
  }

}




module.exports = Job;
