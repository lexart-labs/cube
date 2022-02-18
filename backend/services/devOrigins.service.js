const TABLE_NAME = 'developer_origins';
const ERROR = { error: 'No results found' };

const DevOrigins = {
  getByDev: async (idDev) => {
    const sql =`SELECT * FROM ${TABLE_NAME} WHERE idDev = ?`;
    let response = [];
    try {
      response = await conn.query(sql, [idDev]);
    } catch (e) {
      console.log(e.message);
    }
    return Array.isArray(response) ? { response } : ERROR;
  },
  getById: async (id) => {
    const sql =`SELECT * FROM ${TABLE_NAME} WHERE id = ?`;
    let response = [];
    try {
      response = await conn.query(sql, [id]);
    } catch (e) {
      console.log(e.message);
    }
    return Array.isArray(response) ? { response } : ERROR;
  },
  getAll: async () => {
    const sql =`SELECT * FROM ${TABLE_NAME}`;
    let response = [];
    try {
      response = await conn.query(sql);
    } catch (e) {
      console.log(e.message);
    }
    return Array.isArray(response) ? { response } : ERROR;
  },
  insert: async (payload) => {
    const { idDev, plataform } = payload;
    let response = '';
    const sql = `
      INSERT INTO ${TABLE_NAME}
        (idDev, plataform, updatedAt)
      VALUES
        (?, ?, CURRENT_TIMESTAMP)`;

    try {
      response = await conn.query(sql, [idDev, plataform]);
    } catch (e) {
      console.log(e.message);
    }
    return response.affectedRows === 1 ? { response: 'ok' } : { error: response.sqlMessage };
  },
  update: async (id, payload) => {
    const { idDev, plataform } = payload;
    let response = '';
    const sql = `
      UPDATE ${TABLE_NAME}
      SET idDev = ?, plataform = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      response = await conn.query(sql, [idDev, plataform, id]);
    } catch (e) {
      console.log(e.message);
    }

    return response.affectedRows === 1 ? { response: 'ok' } : { error: response.sqlMessage };
  },
  remove: async (id) => {
    const sql = `DELETE FROM ${TABLE_NAME} WHERE id = ?`;
    let error = { error: 'It wasn\'t possible to delete this element'};
    let response = '';
    try {
      response = await conn.query(sql, [id]);
    } catch (e) {
      console.log(e.message);
    }
    return (response.affectedRows === 1) ? { response: 'Succesfully removed'} : error;
  },
  getByPlataform: async (plataform) => {
    const sql =`SELECT * FROM ${TABLE_NAME} WHERE plataform = ?`;
    let response = [];
    try {
      response = await conn.query(sql, [plataform]);
    } catch (e) {
      console.log(e.message);
    }
    return Array.isArray(response) ? { response } : ERROR;
  },
}

module.exports = DevOrigins;
