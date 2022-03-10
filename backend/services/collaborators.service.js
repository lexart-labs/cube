const UtilsService = require("./utils.service")
const TABLE_NAME = 'users';
const ERROR = 'Something went wrong, please contact the administrator';
const PAGE_SIZE = 10;

const Collaborators = {
  generalQuery: async function (sql, arr, action, res) {
    let toReturn = {};
    let response = [];
    try {
      response = await conn.query(sql, arr);

      const checkByActionType = {
        write: function (response) {
          if(response.affectedRows === 1) toReturn = { status: 200, message: 'ok' }
          else toReturn = { status: 400, message: response.sqlMessage }
        },

        read: function (response) {
          if(response.sqlMessage) toReturn = { status: 400, message: response.sqlMessage }
          else toReturn = { status: 200, response: response, message: 'ok' }
        },

        count: function (response) {
          if(response.sqlMessage) toReturn = { status: 400, message: response.sqlMessage }
          else {
            let res = { totalOfPages: Math.ceil(response[0].total / PAGE_SIZE), registersByPage: PAGE_SIZE};
            toReturn = { status: 200, response: [res], message: 'ok' }
          }
        }
      }

      checkByActionType[action](response)

      return toReturn
    } catch (e) {
      toReturn = { status: 500, error: ERROR };
      return toReturn
    }
  },
  getByIdUser: async (id, company_slug, res) => {
    const companyId = await UtilsService.getIdCompanyBySlug(company_slug, res);

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

    const arr = [companyId, parseInt(id)];

    return Collaborators.generalQuery(sql, arr, 'read', res);
  },
  getByCompany: async (company_slug, page_number, name_to_filter, res) => {
    const companyId = await UtilsService.getIdCompanyBySlug(company_slug, res);
    const queryByName = name_to_filter ? `AND u.name LIKE '%${name_to_filter}%'` : '';
    const queryByPage = page_number ? `LIMIT ${PAGE_SIZE} OFFSET ${PAGE_SIZE * page_number}` : '';

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
      WHERE u.idCompany = ? ${queryByName}
      ${queryByPage}
    `;
    const arr = [companyId];
    
    return Collaborators.generalQuery(sql, arr, 'read', res);
  },
  insert: async (payload, company_slug, res) => {
    const companyId = await UtilsService.getIdCompanyBySlug(company_slug, res);

    const sql = `
      INSERT INTO ${TABLE_NAME}
        (name, email, password, type, active, idPlataform, idCompany)
      VALUES
        (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const arr = [
      payload.name, 
      payload.email, 
      md5(payload.password),
      payload.type,
      parseInt(payload.active),
      payload.idPlataform,
      companyId,
    ];

    return Collaborators.generalQuery(sql, arr, 'write', res);
  },
  update: async (id, payload, company_slug, res) => {
    const companyId = await UtilsService.getIdCompanyBySlug(company_slug, res);

    const queryToGetPassword = `SELECT password FROM ${TABLE_NAME} WHERE idCompany = ? AND id = ?`;

    try {
      const userCurrentPassword = await conn.query(queryToGetPassword, [companyId, payload.id]);

      const passwordToSend = payload.password ? md5(payload.password) : userCurrentPassword[0].password;

      const sql = `
        UPDATE ${TABLE_NAME}
        SET 
          name = ?,
          email = ?,
          password = ?,
          type = ?,
          active = ?,
          idPlataform = ?,
          idCompany = ?,
          dateEdited = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      const arr = [
        payload.name,
        payload.email,
        passwordToSend,
        payload.type,
        payload.active,
        payload.idPlataform,
        companyId,
        id
      ];

      return Collaborators.generalQuery(sql, arr, 'write', res);
    } catch (error) {
      res.send({ status: 500, message: ERROR });
    }
  },
  countPages: async (company_slug, name_to_filter, res) => {
    const companyId = await UtilsService.getIdCompanyBySlug(company_slug, res);
    const queryByName = name_to_filter ? `AND u.name LIKE '%${name_to_filter}%'` : '';

    const sql = `
			SELECT COUNT(*) AS total FROM ${TABLE_NAME} AS u
			WHERE u.idCompany = ? ${queryByName}
		`;
    
    const arr = [companyId];

    return Collaborators.generalQuery(sql, arr, 'count', res);
  },
  remove: async (id, res) => {
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
