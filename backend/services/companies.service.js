require('dotenv').config();
const TABLE_NAME = 'companies';
const axios = require('axios');

const SECRET_KEY = process.env.SECRET_KEY;
const parseToSlug = (str) => str.toLowerCase().replace(/\s+/g, '_');

const Companies = {
  getAll: async () => {
    const sql = `SELECT * FROM ${TABLE_NAME}`;
    const error = { error: 'Error to get the results from db' }
    let response = [];
    try {
      response = await conn.query(sql);
    } catch (e) {
      console.log(e.message);
    }
    return response.length > 0 ? { response } : { error: error };
  },

  getById: async (id) => {
    const sql = `SELECT * FROM ${TABLE_NAME} WHERE id = ?`;
    const error = { error: 'Error to get information about this company' }
    let response = [];
    try {
      response = await conn.query(sql, [id]);
    } catch (e) {
      console.log(e.message);
    }
    return Array.isArray(response) ? { response } : { error: error };
  },

  validateCaptcha: async function (tk) {
    if (!tk) return false;
    const urlParams = `secret=${SECRET_KEY}&response=${tk}`;

    const { data } = await axios.post(`https://www.google.com/recaptcha/api/siteverify?${urlParams}`);

    return data.success;
  },

  insert: async function (payload) {
    const { company, email, password, captcha } = payload;
    let response = {};
    const error = { error: 'Failed to register' };
    const LAST_USER_ID = `(SELECT AUTO_INCREMENT FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA ='${process.env.DATABASE}' AND TABLE_NAME = 'users')`;
    const sql = `
      INSERT INTO ${TABLE_NAME} (company, email, slug)
      VALUES (?, ?, ?)
    `;

    const sql2 = `
      INSERT INTO users
        (name, email, type, password, active, idCompany, idUser)
      VALUES
        (?, ?, ?, ?, ?, LAST_INSERT_ID(), ${LAST_USER_ID})
    `;

    try {
      const isValid = await this.validateCaptcha(captcha);
      if(!isValid) return {error: 'Invalid human verification. please try again.'};
      response = await conn.query(sql, [company, email, company.toLowerCase().replace(/\s+/g, '_')]);
      response = await conn.query(sql2, [company, email, 'admin', md5(password), '1']);
    } catch (e) {
      console.log(e.message);
      error.message = e.message;
    }

    //return response.insertId ? { response: 'ok' } : error;
    return response.insertId ? { response: 'Successfully registered' } : error;
    //console.log(response.insertId);
    //return response.insertId ? { response: 'ok' } : { error: response.sqlMessage };
  },

  update: async (id, payload) => {
    const { company } = payload;
    let error = { error: 'Cannot update this company' };
    let response = '';
    const sql = `
      UPDATE ${TABLE_NAME}
      SET company = ?
      WHERE id = ?
    `;

    try {
      response = await conn.query(sql, [company, id]);
    } catch (e) {
      console.log(e.message);
    }

    //return response.affectedRows === 1 ? { response: 'ok' } : { error: response.sqlMessage };
    return response.affectedRows === 1 ? { response: 'Successfully updated' } : { error: error };
  },

  remove: async (id) => {
    //const sql = `
    //DELETE FROM ${TABLE_NAME}
    //WHERE id = ?
    //INNER JOIN users DELETE FROM users WHERE idCompany = ?`;

    const sql = `
    DELETE c
    FROM ${TABLE_NAME} AS c
    INNER JOIN users AS u
        ON u.idCompany = c.id
    WHERE c.id = ?
    `;

    let error = { error: 'Cannot delete company because it is associated with a user' };
    let response = '';
    try {
      response = await conn.query(sql, [id]);
    } catch (e) {
      console.log(e.message);
    }
    return (response.affectedRows === 1) ? { response: 'Successfully removed company' } : { error: error };
  },

  exists: async (company) => {
    const slug = parseToSlug(company);
    const sql = `SELECT * FROM ${TABLE_NAME} where slug = ?`;
    let response = [];
    try {
      response = await conn.query(sql, [slug]);
    } catch ({message}) {
      console.log(message);
    }

    return response.length ? { response: 'ok', slug } : { error: 'Company not found' };
  },

};

module.exports = Companies;
