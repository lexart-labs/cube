require('dotenv').config();
const utils = require('./utils.service');
const UserSkills = require('./userSkills.service');
const CollaboratorsService = require('./collaborators.service');
const Course = require('./courses.service');
const { setUpData } = require('./EvaluationsHandler.service');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const tablaNombre = 'users';
const trackingApi = process.env.API_LEXTRACKING;
const SECRET_KEY = process.env.SECRET_KEY;
const PAGE_SIZE = 10;

let User = {
	all: async function (idAdmin, page, query) {
		let error = { "error": "Error al obtener usuarios" };
		const filter = query ? `AND u.name LIKE '%${query}%'` : '';

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
			WHERE (u.idUser = ? OR u.id = ?) ${filter}
			${parseInt(page) ? `LIMIT ${PAGE_SIZE} OFFSET ${PAGE_SIZE * page}` : ''}
		`
		let response = [];
		let fixedRsp = [];

		try {
			response = await conn.query(sql, [idAdmin, idAdmin]);
			fixedRsp = response.map(el => {
				const { password, ...all } = el;
				return all;
			});
		} catch (e) {
			console.log(e.message);
		}

		return response.length > 0 ? { response: fixedRsp } : error;
	},
	allUserLextracking: async function (req, shouldOmit, res) {
		const { company_slug, lextoken } = req.headers;
		let error = { "error": "Error al obtener usuarios" };
		let model = trackingApi.includes('dev') ? 'user/all/1' : 'user/all';
		const headers = { token: lextoken };

		if(company_slug === 'lexart_labs') {
			let { data } = await axios.get(API_LEXTRACKING + model, { headers });
				let response = data.response;
			if (shouldOmit && response?.length) {
				response = response?.reduce((acc, { name, id, email, role }) => {
					if (role == 'developer') {
						acc.push({ name, id, email });
					}
					return acc;
				}, []);
			}
	
			return response?.length > 0 ? { response } : error;
		} else {
			let cubeUsers = await CollaboratorsService.getByCompany(company_slug, null, null, res);
			return cubeUsers;
		}
	},
	one: async function (id) {
		let error = { "error": "Error al obtener usuarios" }
		let response = [];
		let stack;

		// Obtener los usuario
		const sql = `
			SELECT
				c.position AS position,
				c.roadmap,
				c.minimumTime,
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
	getByEmail: async function (email, idCompany) {
		const error = { error: 'User not found' };
		const sql = `SELECT * FROM users u WHERE u.email = ? AND u.idCompany = ?`;

		try {
			const response = await conn.query(sql, [email, idCompany]);
			return response.length ? response[0] : error;
		} catch ({message}) {
			console.log(message);
			return error;
		}
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
	updateOne: async function (usuario, idAdmin, id_company) {
		const tablaNombre = 'users';
		let response, stack, token;
		let shouldCreatePosition = true;
		token = utils.makeToken(usuario.email, usuario.id, 'public');

		// Compara los ids de cargo y nível, si los nuevos son iguales a los atuales
		const currentPosition = usuario.idPosition
			? await conn.query(
				'SELECT * FROM user_position_level WHERE id = ?', [usuario.idPosition]
			) : [{ idPosition: null, idLevel: null }];


		if (currentPosition[0]) {
			shouldCreatePosition = (
				currentPosition[0].idPosition == usuario.positionId
				&& currentPosition[0].idLevel == usuario.levelId
			) ? false : true;
		}

		const idPosition = shouldCreatePosition
			? await this.updatePosition(usuario.id, usuario.positionId, usuario.levelId)
			: usuario.idPosition;

		const sql = `
			UPDATE ${tablaNombre}
			SET name = ?,
				email  = ?,
				${usuario.password ? `password = '${usuario.password}',` : ''}
				type   = ?,
				active = ?,
				idUser = ?,
				token = ?,
				idPosition = ?,
				idPlataform = ?,
				idCompany = ?,
				idCareerType = ?,
				dateEdited = NOW()
			WHERE email = ? AND idCompany = ?
		`;
		const arr = [
			usuario.name,
			usuario.email,
			usuario.type,
			parseInt(usuario.active),
			idAdmin,
			token,
			idPosition,
			usuario.idPlataform || null,
			id_company,
			usuario.idCareerType,
			usuario.email,
			id_company
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
	insertOne: async function (usuario, idAdmin, company_slug, id_company) {
		const tablaNombre = 'users';
		let response, stack, idPosition;
		let password = company_slug !== 'lexart_labs' ? md5(usuario.password) : usuario.password;

		if (company_slug === "lexart_labs") {
			const result = await this.updatePosition(usuario.id, usuario.positionId, usuario.levelId);
			idPosition = result.error ? null : result;
		}


		token = utils.makeToken(usuario.email, usuario.id, 'public');

		const sql = `
			INSERT INTO ${tablaNombre}
				(idUser, idLextracking, name, email, type, password, token, active, idPosition, idPlataform, idCompany, idCareerType)
			VALUES
				(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
			id_company,
			usuario.idCareerType
		];

		try {
			response = await conn.query(sql, arr);
			if (company_slug === "lexart_labs") {
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

		const id_company = await utils.getIdCompanyBySlug(company_slug);
		
		const userSearchResult = await this.checkUserAlreadyExists(usuario.email, id_company);

		if (userSearchResult.status === 404) {
			result = await this.insertOne(usuario, idLead, company_slug, id_company);
			// await this.changeLeader(idLead, idLextracking);
		} else if (userSearchResult.status === 200) {
			usuario.sync = false;
			result = await this.updateOne(usuario, idLead, id_company);
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
	
	loginCube: async function (email, idCompany = null) {
		//const sqlCompany = `SELECT id FROM companies`;
		const error = { error: 'Usuario y/o clave incorrecta.' };
		let sql = `
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
		if (idCompany) sql += "AND u.idCompany = ?"
		let response = [];
		let token = '';

		try {
			//const [{ id: idCompany }] = await conn.query(sqlCompany, [company]);
			let arr = [email];
			if (idCompany) arr.push(idCompany);
			response = await conn.query(sql, arr);

			if(!response.length) return error;

			const { password: p, ...usr } = response[0];
			if(!usr.idUser) return error;
			token = utils.makeToken(usr);
			response = { ...usr, token, lexToken: utils.makeLexToken(email) };
			return { response };
		} catch (e) {
			console.log(e.message);
			return error;
		}
	},

	validateCaptcha: async function (tk) {
		if (!tk) return false;
		const urlParams = `secret=${SECRET_KEY}&response=${tk}`;
	
		const { data } = await axios.post(`https://www.google.com/recaptcha/api/siteverify?${urlParams}`);
	
		return data.success;
	},

	loginVerify: async function (email, password, captcha) {
		const error = { error: 'Usuario y/o clave incorrecta.' };
		let sql = `
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
			WHERE u.email = ? AND u.password = MD5(?) AND u.active = 1
		`
		let response = [];
		let token = '';

		try {
			const isValid = await this.validateCaptcha(captcha);
			if(!isValid) return {error: 'Invalid human verification. please try again.'};
			response = await conn.query(sql, [email, password]);

			if(!response.length) return error;

			const { password: p, ...usr } = response[0];
			if(!usr.idUser) return error;
			token = utils.makeToken(usr);
			response = { token, lexToken: utils.makeLexToken(password, email) };
			return { response };
		} catch (e) {
			console.log(e.message);
			return error;
		}
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
	countResults: async function (idAdmin, q) {
		const filter = q ? `AND u.name LIKE '%${q}%'` : '';
		const sql = `
			SELECT COUNT(*) AS total FROM users AS u
			WHERE (u.idUser = ? OR u.id = ?) ${filter}
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
	getLeads: async function (slug) {
		const idCompany = await utils.getIdCompanyBySlug(slug);
		const sql = `
			SELECT * FROM ${tablaNombre} WHERE type IN ('admin', 'pm') AND idCompany = ?
		`;
		let response = [];

		try {
			response = await conn.query(sql, [idCompany]);
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
	getLeaderDevTree: async function (slug = 'lexart_labs') {
		const companyId = await utils.getIdCompanyBySlug(slug);
		const sql = `
			SELECT
				users.name AS 'name',
				(
					SELECT GROUP_CONCAT(name)
					FROM users AS dev
					WHERE dev.idUser = users.id AND dev.id <> users.id
				) AS 'devs'
			FROM users
			WHERE users.type IN ('admin', 'pm') AND users.idCompany = ?;
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
			WHERE u.idCompany = ?
		`;

		const [response, devInfos] = await Promise.all([
			conn.query(sql, [companyId]),
			conn.query(sqlDevsInfo, [companyId])
		]);
		let fixed = [];

		const devsObj = devInfos.reduce((acc, cur) => {
			const key = cur.name;
			return { ...acc, [key]: cur };
		}, {});

		try {
			fixed = response.reduce((acc, el) => {
				if (el.devs) {
					const devs = el.devs.split(',').map(dev => devsObj[dev] || { name: dev, position: 'No position asigned', time: 0 });
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
		if (techs && techs.length) {
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
	devIds: async function (techs, page, slug = 'lexart_labs') {
		const PAGE_LENGTH = 10;
		const currentPage = page || 1;
		const idCompany = await utils.getIdCompanyBySlug(slug);
		let sql = '';
		if (techs && techs.length) {
			const techsFilter = techs.map((el) => `'${el}'`).join();
			sql = `
				SELECT
					DISTINCT us.idUser AS id
				FROM user_skills us
				INNER JOIN technologies t ON us.idTechnology = t.id
				INNER JOIN users u ON u.id = us.idUser
				WHERE u.type = 'developer' AND t.name IN (${techsFilter}) AND u.idCompany = ${idCompany}
				LIMIT ${PAGE_LENGTH} OFFSET ${(currentPage - 1) * PAGE_LENGTH}
			`;
		} else {
			sql = `
				SELECT
					idLextracking AS 'id'
				FROM users
				WHERE type = 'developer' AND idCompany = ${idCompany}
				LIMIT ${PAGE_LENGTH} OFFSET ${(currentPage - 1) * PAGE_LENGTH};
		`;
		}

		const response = await conn.query(sql);
		// console.log(response);
		const ids = response.map(el => el.id);
		return { response: ids };
	},
	getLeaderDevs: async function (idLead) {
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
	allDevelopersIndicators: async function (token, query, techs, page, slug) {
		const idCompany = await utils.getIdCompanyBySlug(slug);
		const { response: devsIds } = await this.devIds(techs, page, slug);

		const sql = `
			SELECT
				c.position AS position,
				l.level AS level,
				u.name,
				u.id,
				GROUP_CONCAT(t.name) AS 'technologies'
			FROM users u
			LEFT JOIN user_position_level uc ON uc.id = u.idPosition
			LEFT JOIN careers c ON uc.idPosition = c.id
			LEFT JOIN levels l ON uc.idLevel = l.id
			INNER JOIN user_skills us ON u.id = us.idUser
			INNER JOIN technologies t ON t.id = us.idTechnology
			WHERE u.id = ? AND u.idCompany = ?;
		`;
		const callbackBasics = async (devId) => {
			let result = {};
			try {
				result = await conn.query(sql, [devId, idCompany]);
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
	findUnasigneds: async function (slug) {
		const idCompany = await utils.getIdCompanyBySlug(slug);
		const sql = `SELECT name FROM ${tablaNombre} WHERE idUser IS NULL AND idCompany = ?`;
		let response = [];

		try {
			response = await conn.query(sql, [idCompany]);
		} catch ({ message }) {
			console.log(message);
		}

		return response.length ? { response } : { error: 'No users found'}
	},
	getCompaniesWhichUserParticipate: async function (userToken) {
		let userEmail;

		try {
			const { email } = jwt.decode(userToken).data;
			userEmail = email;
		} catch (error) {
			return { status: 401, response: error, message: "You are not authorized to make this request." };
		}

		const sql = `
			SELECT 
				c.id,
				c.company as name,
				c.slug
			FROM users AS u
				INNER JOIN companies c ON c.id = u.idCompany
			WHERE u.email = ?
		`

		const arr = [userEmail];
		const response = await utils.generalQuery(sql, arr, 'read');
		return response
	}
}

module.exports = User;
