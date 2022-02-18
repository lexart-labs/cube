const TABLE_NAME = 'hiring_plataforms';
const ERROR = { error: 'No results found' };

const DevOrigins = {
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
    const { plataform } = payload;
    let response = '';
    const sql = `
      INSERT INTO ${TABLE_NAME}
        (plataform, updatedAt)
      VALUES
        (?, NOW())`;

    try {
      response = await conn.query(sql, [plataform.toLowerCase()]);
    } catch (e) {
      console.log(e.message);
    }
    return response.affectedRows === 1 ? { response: 'ok' } : { error: response.sqlMessage };
  },
  update: async (id, payload) => {
    const { plataform } = payload;
    let response = '';
    const sql = `
      UPDATE ${TABLE_NAME}
      SET plataform = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      response = await conn.query(sql, [plataform.toLowerCase(), id]);
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
}

module.exports = DevOrigins;
