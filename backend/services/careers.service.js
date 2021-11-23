const utils 	  = require('./utils.service');

const TABLE_NAME = 'career';
const ERROR = { error: 'No fue possible recuperar los datos'};

const Career = {
  getAll: async () => {
    const sql = `SELECT * FROM ${TABLE_NAME}`;
    let response = [];
    try {
      response = await conn.query(sql);
    } catch (e) { }

    return response.length > 0 ? { response } : ERROR;
  },
};

module.exports = Career;
