const MODEL = 'user_skills_per_position';

const UserSkills = {
  insert: async function (payload) {
    const { idUser, skills, idPosition } = payload;
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
      console.log(e.message);
    }

    return response.changedRows ? { resposne: 'ok' } : { error: response.sqlMessage };
  },
  update: async function (payload) {
    const { skills, idUser, idPosition } = payload;
    const sql = `
      UPDATE ${MODEL}
      SET
        skills = ?,
        updatedAt= CURRENT_TIMESTAMP
      WHERE idUser = ? AND idPosition = ?
    `;

    let response;

    try {
      response = await conn.query(sql, [JSON.stringify(skills), idUser, idPosition]);
      if (!response.changedRows) {
        response = await this.insert(payload);
      }
    } catch (e) {
      e.message
    }

    return response.changedRows ? { resposne: 'ok' } : { error: response.sqlMessage };
  },
};

module.exports = UserSkills;
