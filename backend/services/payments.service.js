const Utils = require('./utils.service');
const tablaNombre = 'user_payments';
const PAGE_SIZE = 10;

const Payments = {
  update: async (id, payload) => {
    const { idUser, salary, billing, datePromotion, currency } = payload;
    const sql = `
      UPDATE ${tablaNombre} SET
        idUser= ?,
        salary=?,
        currency=?
        billing=?,
        datePromotion=?
      WHERE id = ?
    `;
    let response;

    try {
      response = await conn.query(sql, [idUser, salary, currency, billing, datePromotion, id]);
    } catch (e) {
      console.log('Payments service error --->', e.message, response);
    }

    return response.changedRows ? { response: 'ok' } : { error: 'Operation failed' };
  },
  insert: async (payload) => {
    const { idUser, salary, billing, currency, datePromotion } = payload;
    const sql = `
      INSERT INTO ${tablaNombre}
        (idUser, salary, currency, billing, datePromotion)
      VALUES
        (?, ?, ?, ?, ?)
    `;
    let response;

    try {
      response = await conn.query(sql, [idUser, salary, currency, billing, datePromotion]);
    } catch (e) {
      console.log('Payments service error --->', e.message, response);
    }

    return response.insertId ? { response: 'ok' } : { error: 'Operation failed' };
  },
  remove: async (id) => {
    const sql = `DELETE FROM ${tablaNombre} WHERE id = ?`;
    let response;

    try {
      response = await conn.query(sql, [id]);
    } catch (e) {
      console.log('Payments service error --->', e.message, response);
    }

    return response.changedRows ? { response: 'ok' } : { error: 'Operation failed' };
  },
  getAll: async (slug, year, page, idUser) => {
    const idCompany = await Utils.getIdCompanyBySlug(slug);
    const sql = `
      SELECT
        up.*,
        u.name
      FROM ${tablaNombre} up
      INNER JOIN users u ON u.id = up.idUser
      WHERE u.idCompany = ? AND YEAR(up.datePromotion) = ? ${ idUser? 'AND up.idUser = ?' : ''}
      LIMIT ${PAGE_SIZE} OFFSET ${PAGE_SIZE * page}
    `;
    let response;

    try {
      response = await conn.query(sql, [idCompany, year, idUser]);
    } catch (e) {
      console.log('Payments service -->', e.message, response);
      return { error: 'Operation Failed'};
    }

    return { response };
  },
  getOne: async (id) => {
    const sql = `
      SELECT
        up.*,
        u.name
      FROM ${tablaNombre} up
      INNER JOIN users u ON u.id = up.idUser
      WHERE up.id = ?
    `;
    let response;

    try {
      response = await conn.query(sql, [parseInt(id)]);
    } catch (e) {
      console.log('Payments service error --->', e.message, response);
      return { error: 'Operation failed' };
    }

    return { response };
  },
  count: async (year, slug, idUser) => {
    const idCompany =  await Utils.getIdCompanyBySlug(slug);
    const sql = `
      SELECT COUNT(*) AS 'docsAmount'
      FROM ${tablaNombre} up
      INNER JOIN users u ON u.id = up.idUser
      WHERE u.idCompany = ? AND YEAR(up.datePromotion) = ? ${idUser ? 'AND up.idUser = ?' : ''}
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
