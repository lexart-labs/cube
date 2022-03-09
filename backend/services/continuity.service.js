const tablaNombre = 'colaborators_continuity';
const PAGE_SIZE = 10;

const toSecond = (hrs) => {
  const [hr, min, sec] = hrs.split(':');
  return (parseInt(min) * 60) + (parseInt(hr) * 3600) + parseInt(sec);
};
const toTimeString = (sec) => {
  let hr = Math.trunc(sec / 3600);
  let min = Math.trunc((sec % 3600) /60);
  let scn = Math.trunc((sec % 3600) % 60);

  const [hh, mm, ss] = [hr, min, scn].map(el => el < 10 ? ('0' + el) : el);
  return `${hh}:${mm}:${ss}`;
};


const Hours = {
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
  getAll: async (idCompany, month, year, page) => {
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
  count: async (month, year) => {
    const sql = `
      SELECT COUNT(*) AS 'docsAmount'
      FROM ${tablaNombre} WHERE year = ? ${parseInt(month) ? 'AND month = ?' : ''}
    `;

    try {
      const response = await conn.query(sql, [+year, +month]);
      return { response: Math.ceil(response[0]['docsAmount'] / PAGE_SIZE) };
    } catch (e) {
      console.log('Continuity Service -->', e.message);
      return { error: 'Operation failed'};
    }
  },
};

module.exports = Hours;
