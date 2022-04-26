const TABLE_NAME = 'careers';
const ERROR = { error: 'No fue possible recuperar los datos' };
const Utils = require('./utils.service');

const Career = {
  getAll: async (idUser) => {
    const [careerInfo] = await conn.query('SELECT idCompany, idCareerType FROM users WHERE id = ?', [idUser]);
    if(!careerInfo) return ERROR;

    const { idCompany, idCareerType } = careerInfo;

    const sql = `
      SELECT
        c.*,
        ct.careerName AS 'careerType',
        cp.company
      FROM ${TABLE_NAME} c
      INNER JOIN companies cp ON cp.id = c.idCompany
      INNER JOIN careers_type ct ON ct.id = c.idCareerType
      WHERE c.idCompany = ? AND c.idCareerType = ?

    `;
    let response = [];
    const arr = [idCompany, idCareerType];
    
    return await Utils.generalQuery(sql, arr, 'read');
  },
  upsert: async (id, position, active, roadmap, idCompany, idCareerType, res) => {
    let sql = '';
    let operacion = '';
    let arrayUpsert = [];
    
    if (id) {
      sql = `
        UPDATE careers SET 
	      position = ?,
        active = ?,
        roadmap = ?,
        idCareerType = ?
        WHERE id = ${id};
      `;
      operacion = 'write';
      arrayUpsert = [position, active, roadmap, idCareerType];
    } else {
      sql = `
        INSERT INTO careers 
	      (position, active, roadmap, idCompany, idCareerType)
        VALUES (?, ?, ?, ?, ?);
      `;
      operacion = 'write';
      arrayUpsert = [position, active, roadmap, idCompany, idCareerType];
    }

    return await Utils.generalQuery(sql, arrayUpsert, operacion, res);
  },
  remove: async (id) => {
    const sql = `DELETE FROM careers WHERE id = ?`;
    const arr = [id];
    
    return await Utils.generalQuery(sql, arr, 'write');
  },
  getById: async (id) => {
    const sql = `
      SELECT
        c.*,
        ct.careerName AS 'careerType',
        cp.company
      FROM ${TABLE_NAME} c
      INNER JOIN companies cp ON cp.id = c.idCompany
      INNER JOIN careers_type ct ON ct.id = c.idCareerType
      WHERE c.id = ?
    `;
    const arr = [id];

    return await Utils.generalQuery(sql, arr, 'read');
  },
};

module.exports = Career;
