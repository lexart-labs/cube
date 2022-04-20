const TABLE_NAME = 'levels';
const ERROR = { error: 'No fue possible recuperar los datos' };
const User = require('./users.service')

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
  getByUser: async(id_company, id_career_type)=> {
    const sql = `SELECT u.id, u.level, ct.careerName FROM ${TABLE_NAME} 
      AS u
      LEFT JOIN careers_type ct
      ON u.idCareerType = ct.id
      WHERE u.idCompany=${id_company} AND u.idCareerType=${id_career_type}
      ;
     `;
    let response = [];
    try {
      response = await conn.query(sql);
    } catch (e) {
      console.log(e.message);
    }
    return response.length > 0 ? { response } : ERROR;
  },
  upsert: async (id, level, active, user_id) => {
    const user = await User.one(user_id)
    let sql = '';
    let error = { "error": "Error al ingresar/editar cargo" };
    let operacion = '';

    if (id) {
      sql = `
        UPDATE levels SET 
	      level=?, active=?
        WHERE ${id} AND idCompany= ? AND idCareerType = ?;
      `;
      operacion = 'update';
    } else {
      sql = `
        INSERT INTO levels 
	      (level, active, idCompany, idCareerType)
        VALUES (?, ?, ?, ?);
      `;
      operacion = 'insert';
    }
    try {
      const response = await conn.query(sql, [level, active, user.response.idCompany, user.response.idCareerType]);
      return (response.changedRows || response.insertId)
        ? { response: `Operación de ${operacion} realizada con éxito` }
        : error;
    } catch (e) {
      console.log(e.message);
      return error;
    }
  },
  remove: async (id, user_id) => {
    const user = await User.one(user_id)
    const sql = `DELETE FROM levels WHERE id = ? AND idCompany = ? AND idCareerType = ?`;
    let error = { "error": "Error al ingresar/editar level" };
    try {
      const response = await conn.query(sql, [id, user.response.idCompany, user.response.idCareerType]);
      return (response.affectedRows === 1) ? { response: 'Removido con éxito' } : error;

    } catch (e) {
      console.log(e.message);
      return error;
    }
  },
};

module.exports = Levels;
