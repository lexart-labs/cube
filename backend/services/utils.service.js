global.md5 		  = require('md5');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const sha1 = require('locutus/php/strings/sha1');

const Utils = {
	makeToken: function (usr) {
		const jwtConfig = {
      expiresIn: '7d',
      algorithm: 'HS256',
    };
		const secret = process.env.SECRET;
		const token = jwt.sign({ data: usr }, secret, jwtConfig);
		return token;
	},
	makeLexToken: (password, email) => sha1(`${md5(password)}${email}y0ur.k3y`).toUpperCase(),
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