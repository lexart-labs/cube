const TABLE_NAME = 'users';
const ERROR = { error: 'Request failed, contact the administrator' };

const Collaborators = {
  generalGet: async function (sql, arr, company_slug) {
    let response = [];
    try {
      const [{ companyId }] = await conn.query(`SELECT id AS companyId FROM companies WHERE slug = ?`, [company_slug]);
      
      response = await conn.query(sql, [companyId, ...arr]);
    } catch (e) {
      response = ERROR;
    }
    return {response};
  },
  getByIdUser: async (id, company_slug) => {
    const sql = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.type, 
        u.active,
        u.idPlataform, 
        hp.plataform
      FROM ${TABLE_NAME} AS u
      LEFT JOIN hiring_plataforms hp ON hp.id = u.idPlataform
      WHERE u.idCompany = ? AND u.id = ?
    `;
    const arr = [id];
    return Collaborators.generalGet(sql, arr, company_slug);
  },
  getByCompany: async (company_slug) => {
    const sql = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.type, 
        u.active,
        u.idPlataform, 
        hp.plataform
      FROM ${TABLE_NAME} AS u
      LEFT JOIN hiring_plataforms hp ON hp.id = u.idPlataform
      WHERE u.idCompany = ?
    `;
    const arr = [];
    return Collaborators.generalGet(sql, arr, company_slug);
  },
  insert: async (payload) => {
    const { plataform } = payload;
    let response = '';

    const sql = `
      INSERT INTO ${TABLE_NAME}
        (name, email, password, type, active, idPlataform, idCompany)
      VALUES
        (?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      response = await conn.query(sql, [plataform]);
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
      SET 
        name = ?,
        email = ?,
        password = ?,
        type = ?,
        active= ?,
        idPlataform = ?,
        idCompany = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      response = await conn.query(sql, [plataform, id]);
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

module.exports = Collaborators;
