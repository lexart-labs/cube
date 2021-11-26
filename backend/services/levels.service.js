const TABLE_NAME = 'levels';
const ERROR = { error: 'No fue possible recuperar los datos' };

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
  upsert: async (id, level, active) => {
    let sql = '';
    let error = { "error": "Error al ingresar/editar cargo" };
    let operacion = '';

    if (id) {
      sql = `
        UPDATE levels SET 
	      level=?, active=?
        WHERE ${id};
      `;
      operacion = 'update';
    } else {
      sql = `
        INSERT INTO levels 
	      (level, active)
        VALUES (?, ?);
      `;
      operacion = 'insert';
    }
    try {
      const response = await conn.query(sql, [level, active]);
      return (response.changedRows || response.insertId)
        ? { response: `Operación de ${operacion} realizada con éxito` }
        : error;
    } catch (e) {
      console.log(e.message);
      return error;
    }
  },
  remove: async (id) => {
    const sql = `DELETE FROM levels WHERE id = ?`;
    let error = { "error": "Error al ingresar/editar level" };
    try {
      const response = await conn.query(sql, [id]);
      return (response.changedRows === 1) ? { response: 'Removido con éxito' } : error;
    } catch (e) {
      console.log(e.message);
      return error;
    }
  },
};

module.exports = Levels;
