global.md5 		  = require('md5');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const Utils = {
	makeToken: function (usr) {
		const jwtConfig = {
      expiresIn: '1d',
      algorithm: 'HS256',
    };
		const secret = process.env.SECRET;
		const token = jwt.sign({ data: usr }, secret, jwtConfig);
		return token;
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