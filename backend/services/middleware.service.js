require('dotenv').config();
const axios  = require('axios');
const jwt = require('jsonwebtoken');
const User = require('./users.service');


const Mdl = {
	middleware: async function (req, res, next) {
		const { token } = req.headers;
		const secret = process.env.SECRET;
		const error = { error: "Token inválido" };
		const errorOutput = () => {
			error.yourToken = req.headers.token;

			res.set(['Content-Type', 'application/json']);
			res.send(error);
		};
		const FIXED_COMPANY = 1
		if (!token) {
			res.set(['Content-Type', 'application/json']);
			return res.send(error);
		}
		try {
			const { data: { email, idCompany } } = jwt.verify(token, secret);
			const user = await User.getByEmail(email, idCompany ? idCompany : FIXED_COMPANY); // TO-DO: now company is 1 but need to fix the login encrypt token
			console.log("email, idCompany: ", email, idCompany)
			if (!user) return errorOutput();
			req.user = user;
			next();
		} catch ({ message }) {
			console.log('error -->', message);
			return errorOutput();
		}
	},
	middlewareCourse: async function (req, res, next){

		let error = {"error":"El curso no corresponde a este usuario"}
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
