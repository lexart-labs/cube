const utils 	  = require('./utils.service')
const Resource    = require('../services/resources.service')
const User 		  = require('../services/users.service')
const tablaNombre = 'courses';

let Course = {
	all: async function (idAdmin){
		
		let error = {"error":"Error al obtener cursos"}

		// Obtener los usuarios
		const sql = `
			SELECT id, name, active, json_data FROM ${tablaNombre}
			WHERE idUser = ?
		`
		let response = []
		
		try {
			response = await conn.query(sql, [idAdmin]);
		} catch(e){}

		if(response.length > 0){
			response.map( (item,i) => {
				try {
					let json_data = JSON.parse(item.json_data)
					json_data.id  = item.id
					json_data.total = this.calcTotal(json_data.indicadores)
					response[i] = json_data
				} catch (e){}
			})
		}

		return response.length > 0 ? {response: response} : error;
	},
	calcTotal: function (arr){
		let indicadores = arr
		let total = 0
		for (const key in indicadores){
			indicadores[key].map( item => {
				total += parseInt(item.total)
			})
		}
		console.log("total: ", total)
		return Math.round((total * 100)/MAX_EVALUACION)
	},
	one: async function (id){
		
		let error = {"error":"Error al obtener cursos"}

		// Obtener los usuarios
		const sql = `
			SELECT * FROM ${tablaNombre}
			WHERE id = ?
		`
		let response = []
		
		try {
			response = await conn.query(sql, [id]);
		} catch(e){}

		let json_data = JSON.parse(response[0].json_data)
		json_data.id  = response[0].id // agrego la ID del curso en el body del json_data 

		// Add clases to course
		if(response[0].json_clases == null){
			json_data.clases = []
		} else {
			let json_clases = JSON.parse(response[0].json_clases)
			json_data.clases = json_clases
		}

		// Add pagos to course
		if(response[0].json_pagos == null){
			json_data.json_pagos = []
		} else {
			let json_pagos = JSON.parse(response[0].json_pagos)
			json_data.pagos = json_pagos
		}

		// Add evaluaciones to course
		if(response[0].json_evaluaciones == null){
			json_data.json_evaluaciones = []
		} else {
			let json_evaluaciones = JSON.parse(response[0].json_evaluaciones)
			json_data.evaluaciones = json_evaluaciones
		}

		return response.length > 0 ? {response: json_data} : {response: error};
	},
	upsert: async function (course, idAdmin){

		let error = {"error":"Error al ingresar/editar curso"}
		let sql = ``;
		let arr = []
		let word = "actualizado"

		// Solo se va actualizar
		// Los cursos se crean manualmente en la base de datos
		// TO-DO crear el insert
		if(course.id){
			
			// Update course
			sql = `
				UPDATE courses
				SET name = ?, idUser = ?, active = ?, json_data = ?, json_clases = ?, json_pagos = ?, json_evaluaciones = ?
				WHERE id = ${course.id}
			`
		} else {
			sql = `
				INSERT INTO courses
				(name,idUser,active,json_data,json_clases,json_pagos,json_evaluaciones)
				VALUES
				(?,?,?,?,?,?,?)
			`
			word = "creado"
		}

		let response = []
		let stackTrace = {}
		try {
			// Wait update
			// Split clases
			const json_clases = JSON.stringify(course.clases)
			const json_pagos  = JSON.stringify(course.pagos)
			const json_evaluaciones  = JSON.stringify(course.evaluaciones)
			delete course.clases
			delete course.pagos
			delete course.evaluaciones
			response = await conn.query(sql, [course.name, idAdmin, course.active, JSON.stringify(course), json_clases, json_pagos, json_evaluaciones])
		} catch(e){
			stackTrace = e;
		}
		error.stack = {trace: stackTrace, res: response}

		return (response.changedRows || response.insertId) ? {response: `Curso ${word} correctamente`} : error;
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
			SELECT courses.id, courses.name, courses.json_data  FROM courses
			WHERE courses.json_data REGEXP '"idLextracking": ?\\}'
		`
		let response = []
		
		try {
			response = await conn.query(sql, [parseInt(id)]);
			console.log("response: ", response, id)
		} catch(e){
			console.log("e: ", e)
		}

		if(response.length > 0){
			response.map( (item,i) => {
				try {
					let json_data = JSON.parse(item.json_data)
					json_data.id  = item.id
					json_data.total = this.calcTotal(json_data.indicadores)
					response[i] = json_data
				} catch (e){}
			})
		}

		let error = {error: '¡Aún no tienes cursos! Puedes reservar ahora!'}

		return response.length > 0 ? {response: response} : error;
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
module.exports = Course;