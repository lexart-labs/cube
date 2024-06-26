const TABLE_NAME = 'levels';
const ERROR = { error: 'No fue possible recuperar los datos' };
const User = require('./users.service');
const Utils = require('./utils.service');

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
    const sql = `SELECT u.id, u.level, ct.careerName, ct.id AS idCareerType FROM ${TABLE_NAME} 
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
  getByUserAdmin: async (company_slug, res) => {
    const idCompany = await Utils.getIdCompanyBySlug(company_slug, res);
    const sql = `
      SELECT l.id, l.level, l.active, l.idCompany, c.id as idCareerType, c.careerName FROM ${TABLE_NAME} l
        INNER JOIN careers_type c
        ON l.idCareerType = c.id
      WHERE l.idCompany = ?
    `;
    const arr = [idCompany];

    return Utils.generalQuery(sql, arr, 'read');
  },
  getByCareerType: async(company_slug, idCareerType, res) => {
    const idCompany = await Utils.getIdCompanyBySlug(company_slug, res);
    const sql = `SELECT * FROM ${TABLE_NAME} WHERE idCompany = ? AND idCareerType = ?`;
    const arr = [idCompany, idCareerType];

    return Utils.generalQuery(sql, arr, 'read')
  },
  upsert: async (id, level, active, idCareerType, company_slug, res) => {
    const idCompany = await Utils.getIdCompanyBySlug(company_slug, res)
    let sql = '';
    let error = { "error": "Error al ingresar/editar cargo" };
    let operacion = '';

    if(id) {
      sql = `
        UPDATE levels SET
	        level=?, active=?, idCareerType=?
          WHERE id = ${id};
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
      let response;
      if(operacion === 'update'){
        response = await conn.query(sql, [level, active, idCareerType]);
      }else{
        response = await conn.query(sql, [level, active, idCompany,idCareerType]);
      }
      return (response.changedRows || response.insertId)
        ? { response: `Operación de ${operacion} realizada con éxito` }
        : error;
        
    } catch (e) {
      return error;
    }
  },
  remove: async (id, company_slug, res) => {
    const idCompany = await Utils.getIdCompanyBySlug(company_slug, res);

    const sql = `DELETE FROM levels WHERE id = ? AND idCompany = ?`;
    let error = { "error": "Error al borrar level" };
    try {
      const response = await conn.query(sql, [id, idCompany]);
      console.log(response);
      if(response.errno === 1451){
        error = {'error': "Can't delete a level related to a user", 'cod': 1451}
      }
      return (response.affectedRows === 1) ? { response: 'Borrado con éxito' } : error;

    } catch (e) {
      console.log(e.message);
      return error;
    }
  },
};

module.exports = Levels;
