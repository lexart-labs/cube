const TABLE_NAME = 'careers';
const ERROR = { error: 'No fue possible recuperar los datos' };
const Utils = require('./utils.service');

const Career = {
  getIdCareerType: async (idCareerType, idCompany) => {
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
    
    const arr = [idCompany, idCareerType];
    
    let res = await Utils.generalQuery(sql, arr, 'read');
    res.response = res.response.map(item => { return {...item, roadmap: JSON.parse(item.roadmap)}})
    
    return res
  },
  getByUser: async (idUser) => {
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
    const arr = [idCompany, idCareerType];
    
    let res = await Utils.generalQuery(sql, arr, 'read');
    res.response = res.response.map(item => { return {...item, roadmap: JSON.parse(item.roadmap)}})
    
    return res
  },
  getByCompany: async (idCompany) => {
    const sql = `
      SELECT
        c.*,
        ct.careerName AS 'careerType',
        cp.company
      FROM ${TABLE_NAME} c
      INNER JOIN companies cp ON cp.id = c.idCompany
      INNER JOIN careers_type ct ON ct.id = c.idCareerType
      WHERE c.idCompany = ?
    `;
    const arr = [idCompany]

    let res = await Utils.generalQuery(sql, arr, 'read');
    res.response = res.response.map(item => { return {...item, roadmap: JSON.parse(item.roadmap)}})
    
    return res
  },
  upsert: async (id, position, active, roadmap, idCompany, idCareerType, minimumTime) => {
    let sql = '';
    let operacion = '';
    let arrayUpsert = [];
    
    if (id) {
      sql = `
        UPDATE careers SET 
          position=?,
          active=?,
          roadmap=?,
          idCareerType=?,
          minimumTime=?
        WHERE id =${id};
      `;
      operacion = 'write';
      arrayUpsert = [position, active, JSON.stringify(roadmap), idCareerType, minimumTime];
    } else {
      sql = `
        INSERT INTO careers 
	      (position, active, roadmap, idCompany, idCareerType, minimumTime)
        VALUES (?, ?, ?, ?, ?, ?);
      `;
      operacion = 'write';
      arrayUpsert = [position, active, JSON.stringify(roadmap), idCompany, idCareerType, minimumTime];
    }

    return await Utils.generalQuery(sql, arrayUpsert, operacion);
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
    let res = await Utils.generalQuery(sql, arr, 'read');
    res.response = res.response.map(item => { return {...item, roadmap: JSON.parse(item.roadmap)}})
    
    return res
  },
};

module.exports = Career;
