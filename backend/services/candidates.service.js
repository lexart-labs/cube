const utils = require('./utils.service');

const tablaNombre = 'candidates';
const PAGE_SIZE = 10;

let Candidate = {
	all: async function (idAdmin, page, search = ''){
		let error = {"error":"Error al obtener candidates"};

		let searchClause = '';
		if (search) {
			searchClause = `AND (c.fullName LIKE '%${search}%' OR c.email LIKE '%${search}%' OR c.position LIKE '%${search}%')`;
		}

		const sql = `
			SELECT id, fullName, email, country, phone, englishLevel, spanishLevel, portugueseLevel,
			source, position, github, linkedin, cv, is_benching AS isBenching, principal_stack AS principalStack, dateCreated
			FROM ${tablaNombre} AS c
			WHERE 1=1 ${searchClause}
			ORDER BY dateCreated DESC
			LIMIT ${PAGE_SIZE} OFFSET ${PAGE_SIZE * page}
		`
		let response = []
		let hasError = false;

		try {
			response = await conn.query(sql);
		} catch(e){
			console.error(e);
			hasError = true;
		}

		return !hasError ? { response } : error;
	},
	countResults: async function (search = '') {
		let searchClause = '';
		if (search) {
			searchClause = `AND (c.fullName LIKE '%${search}%' OR c.email LIKE '%${search}%' OR c.position LIKE '%${search}%')`;
		}

		const sql = `
			SELECT COUNT(*) AS total FROM ${tablaNombre} AS c
			WHERE 1=1 ${searchClause}
		`;
		const error = { "error": "Error getting total candidates page" };
		let response = 0;
		let hasError = false;
		try {
			let result = await conn.query(sql);
			if(!result.length) result = [{total: 0}];
			const totalOfPages = result[0].total / PAGE_SIZE
			response = Number.isInteger(totalOfPages) ? totalOfPages : Math.ceil(totalOfPages);
		} catch (e) {
			console.error(e);
			hasError = true;
		}

		return !hasError ? { response } : error;
	},
	one: async function (id){
		let error = {"error":"Error al obtener candidate"}

		const sql = `
			SELECT *, is_benching AS isBenching, principal_stack AS principalStack FROM ${tablaNombre}
			WHERE id = ?
		`
		let response = []

		try {
			response = await conn.query(sql, [id]);
		} catch(e){
			console.error(e);
		}

		return response.length > 0 ? {response: response[0]} : {response: error};
	},
	upsert: async function (item){
		let error = {"error":"Error al ingresar/editar candidate"}
		let sql = ``;
		let word = "actualizado";

		if(item.id){
			sql = `
				UPDATE ${tablaNombre}
				SET fullName = ?, email = ?, country = ?, phone = ?,
				    englishLevel = ?, spanishLevel = ?, portugueseLevel = ?,
				    source = ?, position = ?, github = ?, linkedin = ?, cv = ?,
				    is_benching = ?, principal_stack = ?, dateUpdated = NOW()
				WHERE id = ?
			`
		} else {
			sql = `
				INSERT INTO ${tablaNombre}
				(fullName, email, country, phone, englishLevel, spanishLevel, portugueseLevel,
				 source, position, github, linkedin, cv, is_benching, principal_stack)
				VALUES
				(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`
			word = "creado"
		}

		let response = []
		let stackTrace = {}
		try {
			let sqlArr = [
				item.fullName,
				item.email,
				item.country || null,
				item.phone || null,
				item.englishLevel || 'None',
				item.spanishLevel || 'None',
				item.portugueseLevel || 'None',
				item.source || null,
				item.position || null,
				item.github || null,
				item.linkedin || null,
				item.cv || null,
				item.isBenching === true ? 1 : 0,
				item.principalStack || null
			];

			if(item.id) {
				sqlArr.push(item.id);
			}

			response = await conn.query(sql, sqlArr)
		} catch(e){
			stackTrace = e;
			console.error(e);
		}
		error.stack = {trace: stackTrace, res: response}

		return (response.changedRows || response.insertId) ? {response: `Candidate ${word} correctamente`} : error;
	},
	delete: async function (id) {
		let error = {"error":"Error al eliminar candidate"}
		const sql = `DELETE FROM ${tablaNombre} WHERE id = ?`;
		let response = [];

		try {
			response = await conn.query(sql, [id]);
		} catch(e){
			console.error(e);
			return error;
		}

		return response.affectedRows > 0 ? {response: "Candidate eliminado correctamente"} : error;
	}
}

module.exports = Candidate;
