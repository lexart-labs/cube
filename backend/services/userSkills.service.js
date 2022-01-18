const MODEL = 'user_skills_per_position';

const UserSkills = {
  insert: async function(payload) {
    const {idUser, skills, idPosition} = payload;
    const sql = `
    INSERT INTO ${MODEL}
      (idUser, skills, idPosition)
    VALUES
      (?, ?, ?)
    `;
    let response;

    try {
      response = await conn.query(sql, [idUser, JSON.stringify(skills), idPosition]);
    } catch (e) {
      e.message
    }

    return response.changedRows ? { resposne: 'ok' } : { error: response.sqlMessage };
  },
  update: async function(idUser, payload) {
    const {skills, idUser} = payload;
    const sql = `
    UPDATE ${MODEL}
      SET
        skills = ?,
        updatedAt= CURRENT_TIMESTAMP
      WHERE idUser = ?
    `;

    let response;

    try {
      response = await conn.query(sql, [JSON.stringify(skills), idUser]);
    } catch (e) {
      e.message
    }

    return response.changedRows ? { resposne: 'ok' } : { error: response.sqlMessage };
  },
};

module.exports = UserSkills;
