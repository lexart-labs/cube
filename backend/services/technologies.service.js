const TABLE_NAME = 'technologies';
const TABLE_RELATION_NAME = 'user_skills';
const ERROR = { error: 'No results found' };

const getColumns = async () => {
  const sql = `
    SELECT DISTINCT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = '${TABLE_NAME}'
    ORDER BY ORDINAL_POSITION
  `;
  let response = [];

  try {
    response = await conn.query(sql);
  } catch (e) {
    console.log(e.message);
  }

  return response.map(el => el.COLUMN_NAME);
};

const Technologies = {
  get: async (id) => {
    const sql = id
      ? `SELECT * FROM ${TABLE_NAME} WHERE id = ?`
      : `SELECT * FROM ${TABLE_NAME}`;
    let response = [];
    try {
      response = await conn.query(sql, [id]);
    } catch (e) {
      console.log(e.message);
    }
    return response.length > 0 ? { response } : ERROR;
  },
  insert: async (payload) => {
    const columns = await getColumns();
    const fixedColumns = columns.filter(el => el !== 'id').join(', ');
    const values = fixedColumns.split(', ').map(el => payload[el]);
    const preparators = values.map((_el) => '?').join(', ');

    let response = '';
    const sql = `
      INSERT INTO ${TABLE_NAME}
        (${fixedColumns})
      VALUES
        (${preparators})`;

    try {
      response = await conn.query(sql, values);
    } catch (e) {
      console.log(e.message);
    }
    return response.affectedRows === 1 ? { response: 'ok' } : { error: response.sqlMessage };
  },
  update: async (id, payload) => {
    const columns = await getColumns();
    const fixedColumns = columns.filter(el => el !== 'id').join(', ');
    const values = fixedColumns.split(', ').map(el => payload[el]);
    const preparators = fixedColumns.split(', ').map(el => `${el} = ?`).join(', ');
    let response = '';

    const sql = `
      UPDATE ${TABLE_NAME}
      SET ${preparators}
      WHERE id = ?
    `;

    try {
      response = await conn.query(sql, [...values, id]);
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
  createRelation: async (idUser, idTech) => {
    const sql = `
      INSERT INTO ${TABLE_RELATION_NAME}
      (idUser, idTechnology)
      VALUES
      (?, ?)
    `;
    let response;

    try {
      response = await conn.query(sql, [idUser, idTech])
    } catch (e) {
      console.log(e.message);
    }

    return response.affectedRows === 1 ? { response: 'ok' } : { error: response.sqlMessage };
  },
  deleteRelation: async (idUser, idTech) => {
    const sql = `DELETE FROM ${TABLE_RELATION_NAME} WHERE idUser = ? AND idTechnology = ?`;
    let error = { error: 'It wasn\'t possible to delete this element'};
    let response = '';
    try {
      response = await conn.query(sql, [idUser, idTech]);
    } catch (e) {
      console.log(e.message);
    }

    return (response.affectedRows === 1) ? { response: 'Succesfully removed'} : error;
  },
  getByUser: async (idUser) => {
    const sql = `
      SELECT
        u.name AS 'user',
        t.name AS 'name',
        t.id AS 'id',
        t.plataform AS 'plataform'
      FROM ${TABLE_RELATION_NAME} AS us
      INNER JOIN users AS u ON us.idUser = u.id
      INNER JOIN ${TABLE_NAME} AS t on us.idTechnology = t.id
      WHERE us.idUser = ?
    `;
    let response;

    try {
      response = await conn.query(sql, [idUser]);
    } catch (e) {
      console.log(e.message);
    }

    result = response.reduce((acc, cur) => {
      acc[cur.user]  = acc[cur.user] ? acc[cur.user] : [];
      const {name, id, plataform} = cur;
      acc[cur.user] = [...acc[cur.user], {name, id, plataform}];
      return acc;
    }, {});

    return result;
  },
  getByLead: async (idLead) => {
    const sql = `
      SELECT
        u.name AS user,
        t.name AS technology
      FROM ${TABLE_RELATION_NAME} AS us
      INNER JOIN users AS u ON us.idUser = u.id
      INNER JOIN ${TABLE_NAME} AS t on us.idTechnology = t.id
      WHERE u.idUser = ?
    `;
    let response;

    try {
      response = await conn.query(sql, [idLead]);
    } catch (e) {
      console.log(e.message);
    }

    result = response.reduce((acc, cur) => {
      acc[cur.user]  = acc[cur.user] ? acc[cur.user] : [];
      acc[cur.user] = [...acc[cur.user], cur.technology];
      return acc;
    }, {});

    return result;
  },
}

module.exports = Technologies;
