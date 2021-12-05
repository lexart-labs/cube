require('dotenv').config();

const mysql      = require('mysql');
const connection = mysql.createConnection({
  host     : process.env.HOST,
  user     : process.env.DB_USER,
  password : process.env.PASSWORD,
  port	   : process.env.DB_PORT,
  database : process.env.DATABASE
});
 
connection.connect();
global.key  = process.env.KEY;
global.port = process.env.API_PORT;
global.MIDDLEWARE_LEXTRACKING = process.env.MIDDLEWARE_LEXTRACKING;
global.API_LEXTRACKING = process.env.API_LEXTRACKING;
global.MAX_EVALUACION  = 135

const Conn = {
	query: function (sql, arr) {
		return new Promise( (resolve, reject) => {
			connection.query(sql, arr, function (error, results, fields) {	
			  if (error){
			  	resolve(error)
			  } else {
			  	resolve(results);
			  }
			});
		})
	}
}

module.exports = Conn;