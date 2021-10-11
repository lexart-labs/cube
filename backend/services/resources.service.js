const utils 	  = require('./utils.service')
const tablaNombre = 'resources';

let Resource = {
	getResourcesByCourse: async function (idCourse) {
		const sql = `
			SELECT json_data, json_clases, json_pagos, json_evaluaciones FROM courses
			WHERE id = ?
		`
		let response = []
		
		try {
			response = await conn.query(sql, [idCourse]);
		} catch(e){}

		let resources = []
		if(response.length > 0){
			// Descompacto el json_data
			let json = JSON.parse(response[0].json_data)
			
			// Add clases to course
			if(response[0].json_clases == null){
				json.clases = []
			} else {
				let json_clases = JSON.parse(response[0].json_clases)
				json.clases = json_clases
			}

			// Add pagos to course
			if(response[0].json_pagos == null){
				json.pagos = []
			} else {
				let json_pagos = JSON.parse(response[0].json_pagos)
				json.pagos = json_pagos
			}

			// Add evaluaciones to course
			if(response[0].json_evaluaciones == null){
				json.evaluaciones = []
			} else {
				let json_evaluaciones = JSON.parse(response[0].json_evaluaciones)
				json.evaluaciones = json_evaluaciones
			}


			resources = {resources: json.resources, clases: json.clases, pagos: json.pagos, evaluaciones: json.evaluaciones}
		}
		return (
			resources.pagos.length > 0 || 
			resources.resources.length > 0 || 
			resources.clases.length > 0 ||
			resources.evaluaciones.length > 0
		) ? {response: resources} : {error: '¡Aún no tienes materiales!', stack: response};
	}
}
module.exports = Resource;