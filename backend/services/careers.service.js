const TABLE_NAME = 'careers';
const ERROR = { error: 'No fue possible recuperar los datos' };

const Career = {
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
  upsert: async (id, position, active) => {
    let sql = '';
    let error = { "error": "Error al ingresar/editar cargo" };
    let operacion = '';

    if (id) {
      sql = `
        UPDATE careers SET 
	      position=?, active=?
        WHERE ${id};
      `;
      operacion = 'update';
    } else {
      sql = `
        INSERT INTO careers 
	      (position, active)
        VALUES (?, ?);
      `;
      operacion = 'insert';
    }
    try {
      const response = await conn.query(sql, [position, active]);
      return (response.changedRows || response.insertId)
        ? { response: `Operación de ${operacion} realizada con éxito`}
        : error;
    } catch (e) {
      console.log(e.message);
      return error;
    }
  },
  remove: async (id) => {
    const sql = `DELETE FROM careers WHERE id = ?`;
    let error = { "error": "Error al ingresar/editar cargo" };
    try {
      const response = await conn.query(sql, [id]);
      return (response.changedRows === 1) ? { response: 'Removido con éxito'} : error;
    } catch (e) {
     console.log(e.message);
     return error;
    }
  },
};

module.exports = Career;
