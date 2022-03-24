const Utils = require('./utils.service');
const tablaNombre = 'user_payments';
const PAGE_SIZE = 10;

const Payments = {
  update: async (id, payload) => {
    const { month, year, continuity, idColaborator } = payload;
    const sql = `
      UPDATE ${tablaNombre} SET
        month= ?,
        year=?,
        continuity=?,
        idColaborator=?
      WHERE id = ?
    `;
    let response;

    try {
      response = await conn.query(sql, [month, year, toSecond(continuity), idColaborator, id]);
    } catch (e) {
      console.log('Continuity service error --->', e.message, response);
    }

    return response.changedRows ? { response: 'ok' } : { error: 'Operation failed' };
  },
  insert: async (payload) => {
    const { month, year, continuity, idColaborator } = payload;
    const sql = `
      INSERT INTO ${tablaNombre}
        (month, year, continuity, idColaborator)
      VALUES
        (?, ?, ?, ?)
    `;
    let response;

    try {
      response = await conn.query(sql, [month, year, toSecond(continuity), idColaborator]);
    } catch (e) {
      console.log('Continuity service error --->', e.message, response);
    }

    return response.insertId ? { response: 'ok' } : { error: 'Operation failed' };
  },
  remove: async (id) => {
    const sql = `DELETE FROM ${tablaNombre} WHERE id = ?`;
    let response;

    try {
      response = await conn.query(sql, [id]);
    } catch (e) {
      console.log('Continuity service error --->', e.message, response);
    }

    return response.changedRows ? { response: 'ok' } : { error: 'Operation failed' };
  },
  getAll: async (companySlug, month, year, page) => {
    const idCompany = await Utils.getIdCompanyBySlug(companySlug);
    const sql = `
      SELECT
        cc.*,
        u.name
      FROM ${tablaNombre} cc
      INNER JOIN users u ON u.id = cc.idColaborator
      WHERE u.idCompany = ? AND cc.year = ? ${month ? 'AND cc.month = ?' : ''}
      LIMIT ${PAGE_SIZE} OFFSET ${PAGE_SIZE * page}
    `;
    let response;

    try {
      response = await conn.query(sql, [idCompany, year, month]);
      response = response.map(el => ({...el, continuity: toTimeString(el.continuity)}));
    } catch (e) {
      console.log('Continuity service -->', e.message, response);
      return { error: 'Operation Failed'};
    }

    return { response };
  },
  getOne: async (id) => {
    const sql = `
      SELECT
        cc.*,
        u.name
      FROM ${tablaNombre} cc
      INNER JOIN users u ON u.id = cc.idColaborator
      WHERE cc.id = ?
    `;
    let response;

    try {
      response = await conn.query(sql, [parseInt(id)]);
      response[0].continuity = toTimeString(response[0].continuity);
    } catch (e) {
      console.log('Continuity service error --->', e.message, response);
      return { error: 'Operation failed' };
    }

    return { response };
  },
  count: async (idUser, year, slug) => {
    const idCompany =  await Utils.getIdCompanyBySlug(slug);
    const sql = `
      SELECT COUNT(*) AS 'docsAmount'
      FROM ${tablaNombre} up
      INNER JOIN users u ON u.id = up.idUser
      WHERE u.idCompany = ? AND up.year = ? ${idUser ? 'AND up.idUser = ?' : ''}
    `;

    try {
      const response = await conn.query(sql, [idCompany, +year, idUser]);
      return { response: Math.ceil(response[0]['docsAmount'] / PAGE_SIZE) };
    } catch (e) {
      console.log('payments Service -->', e.message);
      return { error: 'Operation failed'};
    }
  },
};

module.exports = Payments;
