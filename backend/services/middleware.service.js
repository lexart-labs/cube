const utils  = require('./utils.service')
const axios  = require('axios')

const Mdl = {
	middleware: async function (req, res, next){
		
		let error = {"error":"Token inválido"}
		let userCorrect = false;


		let errorOutput = () => {
			error.yourToken = req.headers.token;

			res.set(['Content-Type', 'application/json']);
			res.send(error);
		}

		axios.get(MIDDLEWARE_LEXTRACKING + req.headers['user-id'], 
		{
		  "headers": {
			"token": req.headers.token
		  }
		}).then( res => {
			if(!res.data.error){
				// Viene en un array
				let user = res.data.response[0]
				if(user.idUser == req.headers['user-id']){
					next();
				} else {
					errorOutput()
				}
			} else {
				errorOutput()
			}
		}).catch( error => {
			errorOutput()
		})
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