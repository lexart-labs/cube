const TABLE_NAME = 'levels';
const ERROR = { error: 'No fue possible recuperar los datos'};

const Levels = {
  getAll: async () => {
    const sql = `SELECT * FROM ${TABLE_NAME}`;
    let response = [];
    try {
      response = await conn.query(sql);
    } catch (e) {
      console.log(e.message);
    }
    return response.length > 0 ? { response } : ERROR;
  },
};

module.exports = Levels;
