global.md5 = require('md5');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const sha1 = require('locutus/php/strings/sha1');
const axios = require('axios');

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
	},
	sendEmail: async (payload) => {
		const { to_email, message, topic } = payload;
		const endpoint = 'https://mail-ssl.lexartlabs.uy/mail/smtp/custom/new';
		const headers = { Authorization: process.env.LX_MAIL_AUTH };
		const body = {
			site_title: "Cube",
			topic,
			to_email: to_email,
			headers: {
				from_email: 'sendmail01@lexart-mail-api2.com',
				bcc_emails: 'cube@lexartlabs.com',
			},
			body: {
				slogan: '#Cube. Go further',
				big_logo: '',
				little_logo: 'https://drive.google.com/uc?id=1jeUuhjDbV7eJtgjgXZLZ5Ni3rsaxuQmt',
				html_body: message,
				footer_one: '',
				footer_two: '',
				image_head: 'no',
				image_head_little: 'no',
				image_footer: 'si',
				footer_color: "#000000;color:#ff0000db !important;font-size: 10px"
			}
		};
		const { data } = await axios.post(endpoint, body, { headers });
		return data;
	},
}
module.exports = Utils;