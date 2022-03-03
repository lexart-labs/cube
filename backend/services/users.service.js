const utils = require('./utils.service');
const UserSkills = require('./userSkills.service');
const Course = require('./courses.service');
const { setUpData } = require('./EvaluationsHandler.service');
const axios = require('axios');

const tablaNombre = 'users';
const PAGE_SIZE = 5;

let User = {
	all: async function (idAdmin, page) {
		let error = { "error": "Error al obtener usuarios" }

		// Obtener los usuarios
		const sql = `
			SELECT
				c.position AS position,
				l.level AS level,
				hp.plataform AS 'plataform',
				u.*
			FROM users u
			LEFT JOIN user_position_level uc ON uc.id = u.idPosition
			LEFT JOIN hiring_plataforms hp ON u.idPlataform = hp.id
			LEFT JOIN careers c ON uc.idPosition = c.id
			LEFT JOIN levels l ON uc.idLevel = l.id
			WHERE u.idUser = ? OR u.id = ?
			${page ? `LIMIT ${PAGE_SIZE} OFFSET ${PAGE_SIZE * page}` : ''}
		`

		let response = []

		try {
			response = await conn.query(sql, [idAdmin, idAdmin]);
		} catch (e) { }

		return response.length > 0 ? { response: response } : error;
	},
	allUserLextracking: async function (req, shouldOmit) {
		let error = { "error": "Error al obtener usuarios" }
		let model = 'user/all'
		let { data: { response } } = await axios.get(API_LEXTRACKING + model,
			{
				"headers": {
					"token": req.headers.token
				}
			})
		if (shouldOmit && response.length) {
			response = response.reduce((acc, { name, id, email, role }) => {
				if (role == 'developer') {
					acc.push({ name, id, email });
				}
				return acc;
			}, []);
		}

		return response.length > 0 ? { response } : error;
	},
	one: async function (id, token) {
		let error = { "error": "Error al obtener usuarios" }
		let response = [];
		let stack;

		// Obtener los usuario
		const sql = `
			SELECT
				c.position AS position,
				c.id AS positionId,
				l.level AS level,
				l.id AS levelId,
				usp.skills AS 'skills',
				hp.plataform AS 'plataform',
				DATEDIFF(CURRENT_DATE, uc.dateCreated) AS 'since',
				u.*
			FROM users u
			LEFT JOIN user_position_level uc ON uc.id = u.idPosition
			LEFT JOIN careers c ON uc.idPosition = c.id
			LEFT JOIN hiring_plataforms hp ON u.idPlataform = hp.id
			LEFT JOIN levels l ON uc.idLevel = l.id
			LEFT JOIN user_skills_per_position usp ON u.id = usp.idUser AND usp.idPosition = uc.id
			WHERE u.id = ?;
			`
		// alterado o where, antes estava WHERE u.idLextraking = ? AND u.token = ?;
		// E ele nunca encontrava o usuário, pois quando se cria um, ele não é criado com o token;

		try {
			response = await conn.query(sql, [id]);
		} catch (e) {
			console.log(e.message);
			stack = e
		}

		error.stack = stack
		return response.length > 0 ? { response: response[0] } : error;
	},
	byToken: async function (token) {
		let error = { "error": "Error al obtener la configuración" }

		const tablaNombre = 'users'

		// Obtener los usuarios
		const sql = `
			SELECT background, logo, escuela, web FROM ${tablaNombre}
			WHERE token = ?
		`
		let response = []
		let stack
		try {
			response = await conn.query(sql, [token]);
		} catch (e) {
			stack = e
		}
		error.stack = stack
		return response.length > 0 ? { response: response[0] } : error;
	},
	updateOne: async function (usuario, idAdmin) {
		const tablaNombre = 'users';
		let response, stack, token;
		let shouldCreatePosition = true;

		// Defino en cual clave esta el id de lextracking
		// const idLextracking = usuario.idLextracking ? usuario.idLextracking : usuario.id;

		// const { positionId, levelId, idPlataform } = usuario;
		token = utils.makeToken(usuario.email, usuario.id, 'public');
		const password = md5(usuario.password);
		
		// if (usuario.passwordCopy) { 
		// }

		// Compara los ids de cargo y nível, si los nuevos son iguales a los atuales
		const currentPosition = await conn.query(
			'SELECT * FROM user_position_level WHERE id = ?', [usuario.idPosition]
		);

		if (currentPosition[0]) {
			shouldCreatePosition = (
				currentPosition[0].idPosition == usuario.positionId
				&& currentPosition[0].idLevel == usuario.levelId
			) ? false : true;
		}

		const idPosition = shouldCreatePosition
			? await this.updatePosition(usuario.idLextracking, usuario.positionId, usuario.levelId)
			: usuario.idPosition;

		const sql = `
			UPDATE ${tablaNombre}
			SET name = ?,
				email  = ?,
				type   = ?,
				password = ?,
				active = ?,
				idUser = ?,
				token = ?,
				idPosition = ?,
				idPlataform = ?,
				idCompany = ?,
				dateEdited = NOW()
			WHERE id = ?
		`;
		const arr = [
			usuario.name,
			usuario.email,
			usuario.type,
			password,
			parseInt(usuario.active),
			idAdmin,
			token,
			idPosition,
			usuario.idPlataform || null,
			usuario.idCompany,
			usuario.id,
		];

		try {
			response = await conn.query(sql, arr);
			if (shouldCreatePosition) {
				await UserSkills.insert({ idUser: usuario.id, skills: usuario.skills, idPosition });
			} else {
				await UserSkills.update({ idUser: usuario.id || usuario.id, skills: usuario.skills, idPosition });
			};
		} catch (e) {
			console.log("e: ", e)
			stack = e
		}

		return { response, stack, arr, sql };
	},
	insertOne: async function (usuario, idAdmin, company_slug) {
		const tablaNombre = 'users';
		let response, stack, idPosition;
		let password = md5(usuario.password);

		const queryGetIdCompany =  `SELECT id FROM companies WHERE slug = ?`
		let company = await conn.query(queryGetIdCompany, [company_slug]);
		let idCompany = company[0].id;

		if(company_slug === "lexart_labs") {
			const result = await this.updatePosition(usuario.id, usuario.positionId, usuario.levelId);
			idPosition = result.error ? null : result;
		}


		token = utils.makeToken(usuario.email, usuario.id, 'public');

		const sql = `
			INSERT INTO ${tablaNombre}
				(idUser, idLextracking, name, email, type, password, token, active, idPosition, idPlataform, idCompany)
			VALUES
				(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`;

		const arr = [
			idAdmin || null,
			usuario.id || null,
			usuario.name,
			usuario.email,
			usuario.type,
			password,
			token,
			usuario.active,
			idPosition,
			usuario.idPlataform || null,
			idCompany
		];

		try {
			response = await conn.query(sql, arr);
			if(company_slug === "lexart_labs") {
				await UserSkills.insert({
					idUser: usuario.id,
					skills: usuario.skills,
					idPosition
				});
			}
		} catch (e) {
			console.log("e: ", e)
			stack = e
		}

		return { response, stack, arr, sql };
	},
	upsert: async function (usuario, currentLeadId, company_slug) {
		let error = { "error": "Error al ingresar/editar usuario" };
		let result = [];
		const idLextracking = usuario.idLextracking ? usuario.idLextracking : usuario.id;
		const idLead = usuario.lead ? usuario.lead.id : idLextracking;

		const userSearchResult = await this.checkUserAlreadyExists(usuario.email, usuario.idCompany);

		if (userSearchResult.status === 404) {
			result = await this.insertOne(usuario, idLead, company_slug);
			// await this.changeLeader(idLead, idLextracking);
		} else if (userSearchResult.status === 200) {
			usuario.sync = false;
			result = await this.updateOne(usuario, idLead);
			if (idLead != currentLeadId) {
				await this.changeLeader(idLead, idLextracking);
			}
		} else if (userSearchResult.status === 500) {
			result = { response: { changedRows: false, insertId: false } };
			error = { "error": "Internal server error, contact the administrator" };
		}

		const { arr, sql, stack, response } = result;

		error.stack = { stack, tail: response, sql, arr };
		return (response.changedRows || response.insertId) ? { response: "Usuario ingresado correctamente" } : error;
	},
	checkUserAlreadyExists: async function (email, idCompany) {
		const sql = `
			SELECT
				u.id,
				u.name,
				u.email,
				u.idCompany
			FROM ${tablaNombre} u
			WHERE u.email = ? AND u.idCompany = ?
		`
		const arr = [email, idCompany];

		let response = [];

		try {
			let search = await conn.query(sql, arr);
			
			response = search[0] 
			? { status: 200, response: search[0] }
			: { status: 404, response: "User not found" };
		} catch (e) {
			response = { status: 500, error: "Request failed" };
		}

		return response;
	},
	loginLextracking: async function (email, password) {
		let error = { "error": "Error al obtener usuarios" }
		let model = 'login'
		const res = await axios.post(API_LEXTRACKING + model, { email: email, password: password })
		const response = res.data

		if (response.response) {
			// Obtengo el usuario dentro del cube
			const lxUser = response.response

			// console.log("lxUser: ", lxUser)

			// Si no hay usuario en el cube
			response.response.idLextracking = response.response.id

			const cubeUser = await this.loginCube(lxUser.email);

			if (cubeUser.response) {
				response.response.cubeUser = cubeUser.response
				response.response.cubeExist = true
				response.response.active = cubeUser.response.active
				response.response.idUser = cubeUser.response.idUser
				// Local ID
				response.response.id = cubeUser.response.id
				response.response.idLextracking = cubeUser.response.idLextracking
			} else if (response.response.role != "admin" && response.response.role != "pm") {
				return { error: "Usuario no disponible en la plataforma." };
			}
		}

		return response.response ? { response: response.response } : error;
	},
	loginCube: async function (email) {
		const sql = `
			SELECT
				u.id,
				u.name,
				u.email,
				u.type,
				u.active,
				u.idUser,
				u.idLextracking,
				uc.idPosition,
				uc.idLevel
			FROM ${tablaNombre} u
			LEFT JOIN user_position_level uc ON uc.id = u.idPosition
			WHERE u.email = ? AND u.active = 1
		`
		let response = [];

		try {
			response = await conn.query(sql, [email]);
		} catch (e) { }

		return response.length > 0 ? { response: response[0] } : { error: 'Usuario y/o clave incorrecta.' };
	},
	courses: async function (id) {

		const sql = `
			SELECT courses.id, courses.name  FROM courses
			INNER JOIN user_course ON courses.id = user_course.idCourse
			INNER JOIN users ON users.id = user_course.idUser
			WHERE users.id = ?
		`
		let response = []

		try {
			response = await conn.query(sql, [id]);
		} catch (e) { }

		return response.length > 0 ? { response: response } : { error: '¡Aún no tienes cursos! Puedes reservar ahora!' };
	},
	resources: async function (idCourse) {

		const sql = `
			SELECT resources.id, 
				   resources.name,
				   resources.description,
				   resources.link,
				   resources.type
			FROM resources
			INNER JOIN course_resource ON course_resource.idResource = resources.id
			WHERE course_resource.idCourse = ?
			AND resources.active = 1
		`
		let response = []

		try {
			response = await conn.query(sql, [idCourse]);
		} catch (e) { }

		return response.length > 0 ? { response: response } : { error: '¡Aún no tienes materiales!' };
	},
	checkType: async function (token, id) {

		let userCorrect = 'default';
		const tablaNombre = 'users'

		// check if its admin or pm
		const allowRoles = ['admin', 'pm']
		// Obtener los usuarios
		const sql = `
			SELECT * FROM ${tablaNombre}
			WHERE token = ? OR id = ?
		`
		let response = []

		try {
			response = await conn.query(sql, [token, id]);
		} catch (e) { }

		if (response.length > 0) {
			response.map((usr) => {
				userCorrect = allowRoles.includes(usr.type) ? 'admin' : userCorrect;
				return;
			})
		}
		return { response: userCorrect }
	},
	updatePosition: async function (id, idPosition, idLevel) {
		const error = { error: '¡No fue posible actualizar la posición!' };
		
		const sql = `
			INSERT INTO user_position_level (idUser, idPosition, idLevel)
			VALUES (?, ?, ?)
		`;

		try {
			const { insertId } = await conn.query(sql, [id, idPosition, idLevel]);
			return insertId ? insertId : error;
		} catch (e) {
			console.log(e.message);
			return error;
		}
	},
	countResults: async function (idAdmin) {
		const sql = `
			SELECT COUNT(*) AS total FROM users AS u
			WHERE u.idUser = ? OR u.idLextracking = ?
		`;
		const error = { "error": "Error al obtener usuarios" };
		let response = 0;

		try {
			const result = await conn.query(sql, [idAdmin, idAdmin]);
			response = Math.ceil(result[0].total / PAGE_SIZE);
		} catch (e) {
			console.log(e.message);
		}

		return response > 0 ? { response } : error;
	},
	getLeads: async function () {
		const sql = `
			SELECT * FROM ${tablaNombre} WHERE type IN ('admin', 'pm')
		`;
		let response = [];

		try {
			response = await conn.query(sql);
		} catch (e) {
			console.log(e.message);
		}

		return response.length ? { response } : { error: 'No leads found.' }
	},
	changeLeader: async function (idLead, idDev) {
		const TABLE_NAME = 'lead_dev_logs';
		const sql = `
			INSERT INTO ${TABLE_NAME} (idDev, idLead)
			VALUES (?, ?)
		`;
		let response;

		try {
			response = await conn.query(sql, [idDev, idLead]);
		} catch (e) {
			console.log(e.message);
		}

		return response.affectedRows === 1
			? { response: 'ok' }
			: { error: 'Not possible to asign new user' };
	},
	getLeadersLog: async function (idDev) {
		const TABLE_NAME = 'lead_dev_logs';
		const sql = `
			SELECT * FROM ${TABLE_NAME} WHERE idDev = ?
		`;
		let response;

		try {
			response = await conn.query(sql, [idDev]);
		} catch (e) {
			console.log(e.message);
		}

		return response.length
			? { response }
			: { error: 'No leaders found for this user' };
	},
	getLeaderDevTree: async function () {
		const sql = `
			SELECT
				users.name AS 'name',
				(
					SELECT GROUP_CONCAT(name)
					FROM users AS dev
					WHERE dev.idUser = users.id AND dev.id <> users.id
				) AS 'devs'
			FROM users
			WHERE users.type IN ('admin', 'pm');
		`;
		const sqlDevsInfo = `
			SELECT
				u.name,
				c.position AS position,
				(CASE
						WHEN uc.dateCreated THEN DATEDIFF(CURRENT_DATE, uc.dateCreated)
							ELSE DATEDIFF(CURRENT_DATE, u.dateCreated)
				END) AS 'time'
			FROM users u
			LEFT JOIN user_position_level uc ON uc.id = u.idPosition
			LEFT JOIN careers c ON uc.idPosition = c.id
		`;

		const [response, devInfos] = await Promise.all([
			conn.query(sql),
			conn.query(sqlDevsInfo)
		]);
		let fixed = [];

		const devsObj = devInfos.reduce((acc, cur) => {
			const key = cur.name;
			return { ...acc, [key]: cur};
		}, {});

		try {
			fixed = response.reduce((acc, el) => {
				if (el.devs) {
					const devs = el.devs.split(',').map(dev => devsObj[dev]);
					acc.push({ ...el, devs });
				}
				return acc;
			}, []);
		} catch (e) {
			console.log('response->', response);
			console.log(e.message);
		}


		return { response: fixed };
	},
	countDevs: async function (techs) {
		const PAGE_LENGTH = 10;
		let sql = '';
		if(techs && techs.length) {
			const techsFilter = techs.map((el) => `'${el}'`).join();
			sql = `
				SELECT
					COUNT(DISTINCT us.idUser) AS 'total'
				FROM user_skills us
				INNER JOIN technologies t ON us.idTechnology = t.id
				INNER JOIN users u ON u.idLextracking = us.idUser
				WHERE u.type = 'developer' AND t.name IN (${techsFilter})
				`;
		} else {
			sql = `
				SELECT COUNT(*) AS total FROM users AS u
				WHERE u.type = 'developer'
			`;
		}

		const error = { "error": "Error al obtener usuarios" };
		let response = 0;

		try {
			const result = await conn.query(sql);
			response = Math.ceil(result[0].total / PAGE_LENGTH);
		} catch (e) {
			console.log(e.message);
		}

		return response > 0 ? { response } : error;
	},
	devIds: async function (techs, page) {
		const PAGE_LENGTH = 10;
		const currentPage = page || 1;
		let sql = '';
		if (techs && techs.length) {
			const techsFilter = techs.map((el) => `'${el}'`).join();
			sql = `
				SELECT
					DISTINCT us.idUser AS id
				FROM user_skills us
				INNER JOIN technologies t ON us.idTechnology = t.id
				INNER JOIN users u ON u.id = us.idUser
				WHERE u.type = 'developer' AND t.name IN (${techsFilter})
				LIMIT ${PAGE_LENGTH} OFFSET ${(currentPage - 1) * PAGE_LENGTH}
			`;
		} else {
			sql = `
				SELECT
					id AS 'id'
				FROM users WHERE type = 'developer'
				LIMIT ${PAGE_LENGTH} OFFSET ${(currentPage - 1) * PAGE_LENGTH};
		`;
		}

		const response = await conn.query(sql);
		// console.log(response);
		const ids = response.map(el => el.id);
		return { response: ids };
	},
	getLeaderDevs: async function(idLead) {
		const sql = `
			SELECT
				users.name,
				users.token,
				users.id
			FROM users
			WHERE idUser = ?;
		`;
		let response;

		try {
			response = await conn.query(sql, idLead);
		} catch (e) {
			console.log('response->', response);
			console.log(e.message);
		}		

		return { response };
	},
	allDevelopersIndicators: async function (token, query, techs, page) {
		const { response: devsIds } = await this.devIds(techs, page);

		const sql = `
			SELECT
				c.position AS position,
				l.level AS level,
				u.name,
				u.id,
				u.idLextracking,
				GROUP_CONCAT(t.name) AS 'technologies'
			FROM users u
			LEFT JOIN user_position_level uc ON uc.id = u.idPosition
			LEFT JOIN careers c ON uc.idPosition = c.id
			LEFT JOIN levels l ON uc.idLevel = l.id
			INNER JOIN user_skills us ON u.id = us.idUser
			INNER JOIN technologies t ON t.id = us.idTechnology
			WHERE u.id = ?;
		`;
		const callbackBasics = async (devId) => {
			let result = {};
			try {
				result = await conn.query(sql, [devId]);
				console.log(result)
			} catch (e) {
				console.log('callBackBasics ->', e.message);
			}
			return result;
		};
		const callbackIndicators = async (devId) => {
			let result = [];
			try {
				result = await this.devIndexes(devId, token, query);
			} catch (e) {
				console.log('callBackIndicators ->', e.message);
			}
			return result;
		};

		const [bsc, ind] = await Promise.all([
			Promise.all(devsIds.map((devId) => callbackBasics(devId))),
			Promise.all(devsIds.map((devId) => callbackIndicators(devId)))
		]);

		const response = bsc.map(([el], i) => ({
			...el,
			technologies: el.technologies ? el.technologies.split(',') : [],
			indicadores: ind[i],
		}))

		return { response }
	},
	devIndexes: async function (idDev, token, query) {
		const defaultIndicators = [
			{
				label: 'Human Factor',
				value: '0.00'
			},
			{
				label: 'Performance',
				value: '0.00'
			},
			{
				label: 'Ability',
				value: '0.00'
			},
			{
				label: 'Evolution',
				value: '0.00'
			},
			{
				label: 'Continuity',
				value: '0.00'
			}
		];
		const year = isNaN(query) ? (new Date()).getFullYear() : query;
		const { response: evaluations } = await Course.byUser(idDev, year);

		if (!evaluations) return defaultIndicators;
		return setUpData(idDev, year, token, evaluations);
	},
	getByCompany: async function(idLead, idCompany) {
		const sql = `SELECT u.name, u.id FROM users u WHERE u.idCompany = ?`;
		let response;

		try {
			response = await conn.query(sql, [idCompany]);
		} catch (e) {
			console.log(response, e.message);
		}

		return response.length ? { response } : { error: 'Operation failed'}
	},
}
module.exports = User;
