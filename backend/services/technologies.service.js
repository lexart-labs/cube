const TABLE_NAME = 'technologies';
const ERROR = { error: 'No results found' };

const getColumns = async () => {
  const sql = `
    SELECT COLUMN_NAME
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
}

module.exports = Technologies;
