const TABLE_NAME = 'teams';
const ERROR = { error: 'No fue possible recuperar los datos' };

const Team = {
  all: async (idLead) => {
    const sql = `
      SELECT *
      FROM ${TABLE_NAME}
      WHERE idLead = ?
    `;
    let response = [];
    try {
      response = await conn.query(sql, [idLead]);
    } catch (e) {
      console.log(e.message);
    }
    return response.length > 0 ? { response } : ERROR;
  },
  updateOne: async (id, payload) => {
    const {idLead, team, name} = payload;
    let response = {};
    const error = { error: 'Operation not realized'}
    const sql = `
      UPDATE ${TABLE_NAME}
      SET
        idLead=?,
        team=?,
        name=?,
        updatedAt=CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      response = await conn.query(sql, [idLead, team, name, id]);
    } catch (e) {
      console.log(e.message);
      error.message = e.message;
    }

    return response.changedRows ? { response: 'ok' } : error;
  },
  insertOne: async (payload) => {
    const {idLead, team, name} = payload;
    let response = {};
    const error = { error: 'Operation not realized'}
    const sql = `
      INSERT INTO ${TABLE_NAME} (idLead, team, name, updatedAt)
      VALUES (?, ?, ?)
    `;

    try {
      response = await conn.query(sql, [idLead, team, name]);
    } catch (e) {
      console.log(e.message);
      error.message = e.message;
    }

    return response.insertId ? { response: 'ok' } : error;
  },
  remove: async (id) => {
    const sql = `DELETE FROM ${TABLE_NAME} WHERE id = ?`;
    let response;
    let error = { error: "Operation failed" };
    try {
      response = await conn.query(sql, [id]);
    } catch (e) {
     console.log(e.message);
     error.message = e.message;
    }

    return response.changedRows == 1 ? { response: 'Succesfully removed'} : error;
  },
};

module.exports = Team;
