const utils = require('./utils.service')
const axios = require('axios')

const tablaNombre = 'users';

let User = {
	all: async function (idAdmin) {

		let error = { "error": "Error al obtener usuarios" }

		const tablaNombre = 'users'

		// Obtener los usuarios
		const sql = `
			SELECT c.position AS position, l.level AS level, u.* FROM users u
			LEFT JOIN user_position_level uc ON uc.id = u.idPosition
			LEFT JOIN careers c ON uc.idPosition = c.id
			LEFT JOIN levels l ON uc.idLevel = l.id
			WHERE u.idUser = ? OR u.idLextracking = ?
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
					u.*
				FROM users u
				LEFT JOIN user_position_level uc ON uc.id = u.idPosition
				LEFT JOIN careers c ON uc.idPosition = c.id
				LEFT JOIN levels l ON uc.idLevel = l.id
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
	upsert: async function (usuario, idAdmin) {

		let error = { "error": "Error al ingresar/editar usuario" }
		let sql = ``;
		let arr = [];
		let shouldCreateNewPosition = false;

		const tablaNombre = 'users'

		// console.log("usuario.type: ", usuario.type)

		// Verifico si no es admin
		if (usuario.idUser && (idAdmin != usuario.idUser)) {
			idAdmin = usuario.idUser
		}

		// Si ya existe
		const cubeUser = await this.loginCube(usuario.email);

		if (cubeUser.response) {
			shouldCreateNewPosition = (
				cubeUser.response.idPosition == usuario.positionId
				&& cubeUser.response.idLevel == usuario.levelId
			)
				? false : true;
			usuario.sync = false
		}

		const idPosition = shouldCreateNewPosition
				? await this.updatePosition(usuario)
				: usuario.idPosition;

		if (usuario.id && !usuario.sync) {

			// Si viene clave nueva
			if (usuario.passwordCopy) {
				usuario.password = md5(usuario.passwordCopy);
			}

			// Generate token in update
			usuario.token = utils.makeToken(usuario.email, usuario.id, 'public')

			// Actualizar usuario
			sql = `
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
				WHERE id = ? 
			`
			arr = [
				usuario.name,
				usuario.email,
				usuario.type,
				usuario.password,
				parseInt(usuario.active),
				idAdmin,
				usuario.token,
				idPosition,
				usuario.id,
			]

		} else {
			// Hasheo con MD5
			// Si viene el sync del lextracking
			let password = usuario.password

			if (usuario.passwordCopy) {
				password = md5(usuario.passwordCopy);
			}

			const result = await this.updatePosition(usuario);
			const idPosition = result.error ? null : result;
			

			// Insertar usuario
			sql = `
				INSERT INTO ${tablaNombre}
					(name, idLextracking, idUser, email, type, password, token, idPosition)
				VALUES
				 	(?, ?, ?, ?, ?, ?, ?, ?)
			`
			arr = [
				usuario.name,
				parseInt(usuario.id),
				idAdmin,
				usuario.email,
				usuario.type,
				password,
				usuario.token,
				idPosition,
			]
		}

		let response = [];

		let stack
		try {
			response = await conn.query(sql, arr);
		} catch (e) {
			console.log("e: ", e)
			stack = e
		}
		error.stack = { stack: stack, tail: response, sql: sql, arr: arr }
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
			LEFT JOIN user_position_level uc ON u.idPosition = uc.id
			WHERE u.email = ?
				AND u.active = 1
			;
		`
		let response = []

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
	}
}
module.exports = User;
