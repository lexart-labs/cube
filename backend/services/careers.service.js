const TABLE_NAME = 'careers';
const ERROR = { error: 'No fue possible recuperar los datos' };

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
    try {
      response = await conn.query(sql, [idCompany, idCareerType]);
    } catch (e) {
      console.log(e.message);
    }
    return response.length > 0 ? { response } : ERROR;
  },
  upsert: async (id, position, active, roadmap, idCompany, idCareerType) => {
    let sql = '';
    let error = { "error": "Error al ingresar/editar cargo" };
    let operacion = '';
    let arrayUpsert = [];
    

    if (id) {
      sql = `
        UPDATE careers SET 
	      position=?,
        active=?,
        roadmap=?,
        idCareerType=?
        WHERE id =${id};
      `;
      operacion = 'update';
      arrayUpsert = [position, active, roadmap, idCareerType];
    } else {
      sql = `
        INSERT INTO careers 
	      (position, active, roadmap, idCompany, idCareerType)
        VALUES (?, ?, ?, ?, ?);
      `;
      operacion = 'insert';
      arrayUpsert = [position, active, roadmap, idCompany, idCareerType];
    }

    try {
      const response = await conn.query(sql, arrayUpsert);
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
    let error = { "error": "Error al remover cargo" };
    try {
      const response = await conn.query(sql, [id]);
      return (response.changedRows === 1) ? { response: 'Removido con éxito'} : error;
    } catch (e) {
     console.log(e.message);
     return error;
    }
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
    let error = { "error": "Error al buscar cargo" };
    try {
      const response = await conn.query(sql, [id]);
      return response.length ? { response: response[0] } : error;
    } catch (e) {
     console.log(e.message);
     return error;
    }
  },
};

module.exports = Career;
