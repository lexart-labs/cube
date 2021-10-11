const utils = require('./utils.service')

const Mdl = {
	middleware: async function (req, res, next){
		
		let error = {"error":"Token inválido"}

		const tablaNombre = 'users'

		// Obtener los usuarios
		const sql = `
			SELECT * FROM ${tablaNombre}
		`
		let response = []
		
		try {
			response = await conn.query(sql);
		} catch(e){}

		let userCorrect = false;

		if(response.length > 0){
			response.map( (usr) => {
				let fastToken = utils.makeToken(usr.email, usr.id, key);
				
				// Check token and userId
				if(req.headers.token == fastToken && req.headers['user-id'] == usr.id){
					userCorrect = true;
					return;
				}
			})
		}

		// Si el usuario es correcto
		// Entrego la informacion
		if(userCorrect){
			next();
		} else {
			error.yourToken = req.headers.token;

			res.set(['Content-Type', 'application/json']);
			res.send(error);
		}
	},
	middlewareCourse: async function (req, res, next){
		
		let error = {"error":"El curso no corresponde a este usuario"}

		const tablaNombre = 'user_course'
		const userId 	  = req.headers['user-id'];
		const courseId 	  = req.params.id;

		// Obtener los usuarios
		const sql = `
			SELECT courses.id, courses.name  FROM courses
			WHERE courses.json_data REGEXP '"idUser": ?' AND courses.id = ?
		`
		let response = []
		
		try {
			response = await conn.query(sql, [parseInt(userId), courseId]);
		} catch(e){}

		let userCorrect = false;

		if(response.length > 0){
			userCorrect = true;
		}

		// Si el usuario es correcto
		// Entrego la informacion
		if(userCorrect){
			next();
		} else {

			res.set(['Content-Type', 'application/json']);
			res.send(error);
		}
	}
}
module.exports = Mdl;