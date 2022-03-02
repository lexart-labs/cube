const tablaNombre = 'colaborators_continuity';

const toSecond = (hrs) => {
  const [hr, min] = hrs.split(':');
  return (parseInt(min) * 60) + (parseInt(hr) * 3600);
};
const toTimeString = (sec) => {
  const hr = Math.trunc(sec / 3600);
  const min = Math.trunc((sec % 3600) /60);
  return `${hr}:${min}`;
};


const Hours = {
  update: async (id, payload) => {
    const { month, year, continuity, idColaborator } = payload;
    const sql = `
      UPDATE ${tablaNombre} SET
        month= ?,
        year=?,
        continuity=?,
        idColaborator=?,
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
  getByLead: async (idCompany, filters) => {
    const { month, year } = filters;
    const sql = `
      SELECT
        cc.*,
        u.name
      FROM ${tablaNombre} cc
      INNER JOIN users u ON u.id = cc.idColaborator
      WHERE u.idCompany = ?
        ${month && 'AND cc.month = ?'}
        ${year && 'AND year = ?'}
    `;
    let response;

    try {
      response = await conn.query(sql, [idCompany, month, year]);
      response = response.map(el => ({...el, continuity: toTimeString(el.continuity)}));
    } catch (e) {
      console.log('Continuity service -->', e.message, response);
      return { error: 'Operation Filed'};
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
      WHERE id = ?
    `;
    let response;

    try {
      response = await conn.query(sql, [id]);
      response[0].continuity = toTimeString(response[0].continuity);
    } catch (e) {
      console.log('Continuity service error --->', e.message, response);
      return { error: 'Operation failed' };
    }

    return { response };
  },
};

module.exports = Hours;
