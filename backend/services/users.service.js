const utils 	  = require('./utils.service')
const axios 	  = require('axios')

const tablaNombre = 'users';

let User = {
	all: async function (idAdmin){
		
		let error = {"error":"Error al obtener usuarios"}

		const tablaNombre = 'users'

		// Obtener los usuarios
		const sql = `
			SELECT * FROM ${tablaNombre}
			WHERE idUser = ? OR id = ?
		`
		let response = []
		
		try {
			response = await conn.query(sql, [idAdmin, idAdmin]);
		} catch(e){}

		return response.length > 0 ? {response: response} : error;
	},
	allUserLextracking: async function (req){
		
		let error    = {"error":"Error al obtener usuarios"}
		let response = {}

		let model = 'user/all'
		axios.get(MIDDLEWARE_LEXTRACKING + model, 
		{
		  "headers": {
			"token": req.headers.token
		  }
		}).then( res => {
			if(!res.data.error){
				response = res.data.response
			} else {
				error = res.data.error
			}

			return response.length > 0 ? {response: response} : error;
		}).catch( error => {
			return error
		})
	},
	one: async function (id, idAdmin){
		
		let error = {"error":"Error al obtener usuarios"}

		const tablaNombre = 'users'

		// Obtener los usuarios
		const sql = `
			SELECT * FROM ${tablaNombre}
			WHERE idLextracking = ? AND idUser = ?
		`
		let response = []
		let stack 
		try {
			response = await conn.query(sql, [id, idAdmin]);
		} catch(e){
			stack = e
		}
		error.stack = stack
		return response.length > 0 ? {response: response[0]} : error;
	},
	byToken: async function (token){
		let error = {"error":"Error al obtener la configuración"}

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
		} catch(e){
			stack = e
		}
		error.stack = stack
		return response.length > 0 ? {response: response[0]} : error;
	},
	upsert: async function (usuario, idAdmin){

		let error = {"error":"Error al ingresar/editar usuario"}
		let sql = ``;
		let arr = []

		const tablaNombre = 'users'

		if(usuario.id && !usuario.sync){

			// Si viene clave nueva
			if(usuario.passwordCopy){
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
					dateEdited = NOW()
				WHERE id = ? 
			`
			arr = [usuario.name, usuario.email, usuario.type, usuario.password, parseInt(usuario.active), idAdmin, usuario.token, usuario.id]
		
		} else {

			// Hasheo con MD5
			// Si viene el sync del lextracking
			let password = usuario.password

			if(usuario.passwordCopy){
				password = md5(usuario.passwordCopy);
			}

			// Insertar usuario
			sql = `
				INSERT INTO ${tablaNombre}
					(name, idLextracking, idUser, email, type, password, token)
				VALUES
				 	(?, ?, ?, ?, ?, ?, ?)
			`
			arr = [usuario.name, usuario.id, idAdmin, usuario.email, usuario.type, password, usuario.token]
		}

		let response = []
		

		let stack 
		try {
			response = await conn.query(sql, arr);
		} catch(e){
			console.log("e: ", e)
			stack = e
		}
		error.stack = {stack: stack, tail: response}
		return (response.changedRows || response.insertId) ? {response: "Usuario ingresado correctamente"} : error;
	},
	login: async function (usuario, clave) {
		const sql = `
			SELECT id, name, email, type FROM ${tablaNombre}
			WHERE 
				(email = ?) AND password = MD5(?)
				AND active = 1
			;
		`
		let response = []
		
		try {
			response = await conn.query(sql, [usuario, clave]);

			if(response.length > 0){
				const email = response[0].email
				const id   	= response[0].id

				// Genero el token a partir de 3 claves
				response[0].token = utils.makeToken(email, id, key)
			}
		} catch(e){}

		return response.length > 0 ? {response: response[0]} : {error: 'Usuario y/o clave incorrecta.'};
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
		} catch(e){}

		return response.length > 0 ? {response: response} : {error: '¡Aún no tienes cursos! Puedes reservar ahora!'};
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
		} catch(e){}

		return response.length > 0 ? {response: response} : {error: '¡Aún no tienes materiales!'};
	},
	checkType: async function (token, id){
		
		let userCorrect = 'default';
		const tablaNombre = 'users'

		// Obtener los usuarios
		const sql = `
			SELECT * FROM ${tablaNombre}
		`
		let response = []
		
		try {
			response = await conn.query(sql);
		} catch(e){}

		if(response.length > 0){
			response.map( (usr) => {
				let fastToken = utils.makeToken(usr.email, usr.id, key);
				
				// Check token and userId
				if(token == fastToken && id == usr.id){
					userCorrect = usr.type;
					return;
				}
			})
		}
		return {response: userCorrect}
	}
}
module.exports = User;