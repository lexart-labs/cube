global.md5 		  = require('md5');
const Utils = {
	makeToken: function (a, b, salt) {
		try {
			return md5(a + b + salt).toUpperCase()
		} catch (e){
			return md5(Math.random()).toUpperCase()
		}
	}
}
module.exports = Utils;