const utils = require('./utils.service');

const tablaNombre = 'evaluations';
const PAGE_SIZE = 10;

let Course = {
	all: async function (idAdmin, page, query){

		let error = {"error":"Error al obtener cursos"};
		const filterQuery = `AND name LIKE '%${query}%'`

		// Obtener los usuarios
		const sql = `
			SELECT id, name, active, json_data, priority FROM ${tablaNombre}
			WHERE idUser = ? ${ query ? filterQuery : '' }
			LIMIT ${PAGE_SIZE} OFFSET ${PAGE_SIZE * page}
		`
		let response = []

		try {
			response = await conn.query(sql, [idAdmin]);
		} catch(e){}

		if(response.length > 0){
			response.map( (item,i) => {
				try {
					let json_data = item.json_data
					json_data.id  = item.id
					json_data.total = this.calcTotal(json_data.indicadores)
					response[i] = json_data;
					// after do the parse, the json method turns 0 in 1 at active field
					response[i].active = item.active;
				} catch (e){}
			})
		}

		return response.length > 0 ? { response } : error;
	},
	calcTotal: function (arr){
		let indicadores = arr
		let total = 0
		for (const key in indicadores){
			indicadores[key].map( item => {
				total += parseInt(item.total)
			})
		}
		// console.log("total: ", total)
		return Math.round((total * 100)/MAX_EVALUACION)
	},
	countResults: async function (idAdmin, query) {
		const filterQuery = `AND name LIKE '%${query}%'`;
		const sql = `
			SELECT COUNT(*) AS total FROM ${tablaNombre} AS e
			WHERE e.idUser = ? ${query ? filterQuery : ''}
		`;
		const error = { "error": "Error getting total evaluations page" };
		let response = 0;

		try {
			const result = await conn.query(sql, [idAdmin]);
			const totalOfPages = result[0].total / PAGE_SIZE
			response = Number.isInteger(totalOfPages) ? totalOfPages : Math.ceil(totalOfPages);
		} catch (e) {
			console.log(e.message);
		}

		return response > 0 ? { response } : error;
	},
	one: async function (id){
		try {
		const sql = `
			SELECT * FROM ${tablaNombre}
			WHERE id = ?
		`
		const result = await conn.query(sql, [id]);

		// Optional chaining for ensure the result is not null or undefined
		const rawEvaluation = result?.[0]

		// Ensure the rawEvaluation has the json_data property
		if (!rawEvaluation || !rawEvaluation?.json_data) {
			throw new Error('No se pudo obtener el curso con la ID proporcionada')
		}

		const evaluation = {
			...rawEvaluation.json_data,
			id: rawEvaluation?.id,
			clases: rawEvaluation?.json_clases || [],
			pagos: rawEvaluation?.json_pagos || [],
			evaluaciones: rawEvaluation?.json_evaluaciones || [],
			priority: rawEvaluation?.priority || 'na'
		}

			return {response: evaluation}
		} catch(e) {
			const errorMessage = e.message || 'Error al obtener el curso'
			const error = {error: errorMessage, trace: e}
			return error
		}
		},
		insert: async function (course, idAdmin){
			let sql = `
			INSERT INTO evaluations
			(name,idUser,idLextracking,active,json_data)
			VALUES
			(?,?,?,?,?)
		`
		try {
			const response = await conn.query(sql, [course.name, idAdmin, course.user.id, course.active, JSON.stringify(course)])

			return response.insertId ? {response: `Curso creado correctamente`} : error;

		} catch(e){
			const  error = {
				"error":"Error al ingresar curso",
				"stack": e
			}
			return error;
		}
	},
	copy: async function (id, idAdmin){
		try {
			const evaluation = await this.one(id)

			if (!evaluation?.response) {
					const errorMessage = evaluation?.error || 'No se pudo obtener el curso'
					throw new Error(errorMessage)
			}

			const course = evaluation.response
			const newName = `Copy  ${course.name}`
			const copyEval =  await this.insert({...course,  name: newName}, idAdmin)

			return copyEval
		} catch (e){
			const errorMessage = e.message || 'Error al copiar el curso'
			const error = {error: errorMessage, stack: e}
			return error
		}
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
				UPDATE evaluations
				SET name = ?, idUser = ?, idLextracking = ?, active = ?, json_data = ?, json_clases = ?, json_pagos = ?, json_evaluaciones = ?, priority = ?
				WHERE id = ${course.id}
			`
		} else {
			sql = `
				INSERT INTO evaluations
				(name,idUser,idLextracking,active,json_data,json_clases,json_pagos,json_evaluaciones,priority)
				VALUES
				(?,?,?,?,?,?,?,?,?)
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
			const priority = course.priority || 'na'
			delete course.clases
			delete course.pagos
			delete course.evaluaciones
			response = await conn.query(sql, [course.name, idAdmin, course.user.id, course.active, JSON.stringify(course), json_clases, json_pagos, json_evaluaciones, priority])
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
	courses: async function (id, year) {
		const sql = `
			SELECT
				users.name AS 'lead',
				evaluations.id,
				evaluations.name,
				evaluations.json_data,
				evaluations.idLextracking
			FROM evaluations
			INNER JOIN users ON users.id = evaluations.idUser
			WHERE evaluations.idLextracking = ? AND evaluations.json_data LIKE '%"fecha": "?%' AND evaluations.active = 1
			GROUP BY evaluations.id
			ORDER BY evaluations.id ASC
		`

		let response = []

		try {
			response = await conn.query(sql, [parseInt(id), parseInt(year)]);
		} catch(e){
			console.log("e: ", e)
		}

		if(response.length > 0){
			response.map( (item,i) => {
				try {
					let json_data = item.json_data
					json_data.id  = item.id
					json_data.lead = item.lead
					json_data.total = this.calcTotal(json_data.indicadores)
					response[i] = json_data
				} catch (e){
					console.log("e: ", e)
				}
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
	},
	getYears: async function (idAdmin) {
		// evaluations.json_data LIKE '%"fecha": "?%'
		const sql = `
			SELECT json_data
			FROM evaluations WHERE idLextracking = ? AND active = 1
		`;

		let response = [];

		try {
			const res = await conn.query(sql, [parseInt(idAdmin)]);
			response = res.map(ele => Number(ele.json_data.fecha.slice(0,4)))
		} catch (error) {
			console.log(error.message);
		}

		const years = response.length > 0
		? response.filter((year, idx) => response.indexOf(year) === idx).sort()
		: { err: 'No fue possible encuentrar evaluaciones'};

		return years
	},
	byUser: async function (id, year) {
		const sql = `
			SELECT
				evaluations.json_data AS 'indicadores'
			FROM evaluations
			WHERE evaluations.idLextracking = ?
			AND evaluations.json_data LIKE '%"fecha": "?%'
			AND evaluations.active = 1
		`;
		let response = [];

		try {
			response = await conn.query(sql, [id, year]);
			if(response.length) {
				response = response.map((el) => el.indicadores);
			}
		} catch (e) {
			console.log(e.message);
		}

		return response.length ? { response } : { error: 'Not found'};
	},
}
module.exports = Course;
