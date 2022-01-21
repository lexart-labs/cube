const utils = require('./utils.service');
const UserSkills = require('./userSkills.service');
const axios = require('axios')

const tablaNombre = 'users';

const PAGE_SIZE = 5;

let User = {
	all: async function (idAdmin, page) {
		let error = { "error": "Error al obtener usuarios" }

		const tablaNombre = 'users'

		// Obtener los usuarios
		const sql = `
			SELECT c.position AS position, l.level AS level, u.* FROM users u
			LEFT JOIN user_position_level uc ON uc.id = u.idPosition
			LEFT JOIN careers c ON uc.idPosition = c.id
			LEFT JOIN levels l ON uc.idLevel = l.id
			WHERE u.idUser = ? OR u.idLextracking = ?
			${page ? `LIMIT ${PAGE_SIZE} OFFSET ${PAGE_SIZE * page}` : ''}
		`
		
		let response = []

		try {
			response = await conn.query(sql, [idAdmin, idAdmin]);
		} catch (e) { }

		return response.length > 0 ? { response: response } : error;
	},
	allUserLextracking: async function (req) {
		let error = { "error": "Error al obtener usuarios" }
		let model = 'user/all'
		const response = await axios.get(API_LEXTRACKING + model,
			{
				"headers": {
					"token": req.headers.token
				}
			})

		return response.data.response.length > 0 ? { response: response.data.response } : error;
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
				DATEDIFF(CURRENT_DATE, usp.createdAt) AS 'since',
				u.*
			FROM users u
			LEFT JOIN user_position_level uc ON uc.id = u.idPosition
			LEFT JOIN careers c ON uc.idPosition = c.id
			LEFT JOIN levels l ON uc.idLevel = l.id
			LEFT JOIN user_skills_per_position usp ON u.idLextracking = usp.idUser AND usp.idPosition = uc.id
			WHERE u.idLextracking = ?;
			`
		// alterado o where, antes estava WHERE u.idLextraking = ? AND u.token = ?;
		// E ele nunca encontrava o usuário, pois quando se cria um, ele não é criado com o token;

		try {
			response = await conn.query(sql, [id, token]);
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
	updateOne: async function (usuario, {idAdmin, idPosition, shouldCreateNewPosition}) {
		console.log(shouldCreateNewPosition);
		const tablaNombre = 'users';
		let response;
		let stack;
		if (usuario.passwordCopy) {
			usuario.password = md5(usuario.passwordCopy);
		}
		usuario.token = utils.makeToken(usuario.email, usuario.id, 'public');
		const idLextracking = usuario.idLextracking ? usuario.idLextracking : usuario.id;

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
				dateEdited = NOW()
			WHERE idLextracking = ?
		`;
		const arr = [
			usuario.name,
			usuario.email,
			usuario.type,
			usuario.password,
			parseInt(usuario.active),
			idAdmin,
			usuario.token,
			idPosition,
			idLextracking,
		];

		try {
			response = await conn.query(sql, arr);
			if(shouldCreateNewPosition) {
				await UserSkills.insert({idUser: usuario.idLextracking, skills: usuario.skills, idPosition});
			} else {
				await UserSkills.update({idUser: usuario.idLextracking, skills: usuario.skills, idPosition});
			};
		} catch (e) {
			console.log("e: ", e)
			stack = e
		}

		return {response, stack, arr, sql };
	},
	insertOne: async function (usuario, {idAdmin}) {
		const tablaNombre = 'users';
		let response;
		let stack;
		let password = usuario.password;
		if (usuario.passwordCopy) {
			password = md5(usuario.passwordCopy);
		}

		const result = await this.updatePosition(usuario);
		const idPosition = result.error ? null : result;

		const sql = `
			INSERT INTO ${tablaNombre}
				(name, idLextracking, idUser, email, type, password, token, idPosition)
			VALUES
				(?, ?, ?, ?, ?, ?, ?, ?)
		`;
		const arr = [
			usuario.name,
			parseInt(usuario.idLextracking),
			idAdmin,
			usuario.email,
			usuario.type,
			password,
			usuario.token,
			idPosition,
		];

		try {
			response = await conn.query(sql, arr);
			await UserSkills.insert(
				{
					idUser: usuario.idLextracking,
					skills: usuario.skills,
					idPosition
				}
			);
		} catch (e) {
			console.log("e: ", e)
			stack = e
		}

		return {response, stack, arr, sql };
	},
	upsert: async function (usuario, idAdmin) {
		let error = { "error": "Error al ingresar/editar usuario" };
		let shouldCreateNewPosition = false;
		let result = [];

		// Verifico si no es admin
		if (usuario.idUser && (idAdmin != usuario.idUser)) {
			idAdmin = usuario.idUser
		}
		// Si ya existe
		const cubeUser = await this.one(usuario.idLextracking, '');
		if (cubeUser.response) {
			shouldCreateNewPosition = (
				cubeUser.response.positionId == usuario.positionId
				&& cubeUser.response.levelId == usuario.levelId
			)
				? false : true;
			usuario.sync = false
		}
		const idPosition = shouldCreateNewPosition
				? await this.updatePosition(usuario)
				: usuario.idPosition;

		if (cubeUser.response && !usuario.sync) {
			result = await this.updateOne(usuario, {idPosition, idAdmin, shouldCreateNewPosition});
		} else {
			result = await this.insertOne(usuario, {idAdmin});
		}

		const { arr, sql, stack, response } = result;

		error.stack = { stack, tail: response, sql, arr }
		return (response.changedRows || response.insertId) ? { response: "Usuario ingresado correctamente" } : error;
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
			WHERE token = ? OR idLextracking = ?
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
	updatePosition: async function({ id, positionId, levelId }) {
		const sql = `
			INSERT INTO user_position_level (idPosition, idLevel, idUser)
			VALUES (?, ?, ?)
		`;
		const error = { error: '¡No fue posible actualizar la posición!' };

		try {
			const { insertId } = await conn.query(sql, [positionId, levelId, id]);
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
}
module.exports = User;
