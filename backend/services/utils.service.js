global.md5 		  = require('md5');
const Utils = {
	makeToken: function (a, b, salt) {
		try {
			return md5(a + b + salt).toUpperCase()
		} catch (e){
			return md5(Math.random()).toUpperCase()
		}
	},
	getIdCompanyBySlug: async function (company_slug, res = false) {
		try {
			const [{ companyId }] = await conn.query(`SELECT id AS companyId FROM companies WHERE slug = ?`, [company_slug]);
			return companyId
		} catch (error) {
			res ? res.send({ status: 404, message: "This company doesn't exists" }) : '';
		}
	}
}
module.exports = Utils;