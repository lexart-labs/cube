const utils = require('./utils.service');

const tablaNombre = 'burnout_tests';
const PAGE_SIZE = 10;

let BurnoutTest = {
	hasCurrentMonthTest: async function (idAdmin) {
		const sql = `
			SELECT COUNT(*) AS hasCurrentMonthTest FROM ${tablaNombre} AS e
			WHERE e.idUser = ? AND MONTH(e.dateCreated) = MONTH(NOW()) AND YEAR(e.dateCreated) = YEAR(NOW())
		`;
		let response = { hasCurrentMonthTest: false };

		try {
			const result = await conn.query(sql, [idAdmin]);
			response.hasCurrentMonthTest = result[0].hasCurrentMonthTest > 0;
		} catch (e) {
			console.error(e);
		}
		
		return response;
	},
	all: async function (idAdmin, page){
		
		let error = {"error":"Error al obtener burnout tests"};

		const sql = `
			SELECT id, score, dateCreated, MONTH(dateCreated) as month, YEAR(dateCreated) as year FROM ${tablaNombre}
			WHERE idUser = ? ORDER BY dateCreated DESC
			LIMIT ${PAGE_SIZE} OFFSET ${PAGE_SIZE * page}
		`
		let response = []
		let hasError = false;
		
		try {
			response = await conn.query(sql, [idAdmin]);
		} catch(e){
			console.error(e);
			hasError = true;
		}

		return !hasError ? { response } : error;
	},
	countResults: async function (idAdmin, query) {
		const sql = `
			SELECT COUNT(*) AS total FROM ${tablaNombre} AS e
			WHERE e.idUser = ?
		`;
		const error = { "error": "Error getting total evaluations page" };
		let response = 0;
		let hasError = false;
		try {
			const result = await conn.query(sql, [idAdmin]);
			const totalOfPages = result[0].total / PAGE_SIZE
			response = Number.isInteger(totalOfPages) ? totalOfPages : Math.ceil(totalOfPages);
		} catch (e) {
			console.error(e);
			hasError = true;
		}
		
		return !hasError ? { response } : error;
	},
	one: async function (id){
		
		let error = {"error":"Error al obtener burnout test"}

		const sql = `
			SELECT *, MONTH(dateCreated) as month, YEAR(dateCreated) as year FROM ${tablaNombre}
			WHERE id = ?
		`
		let response = []
		
		try {
			response = await conn.query(sql, [id]);
		} catch(e){}

		return response.length > 0 ? {response: response[0]} : {response: error};
	},
	upsert: async function (item, idAdmin){
        const score = item.value.reduce((acc, el) => acc + el, 0);
		let error = {"error":"Error al ingresar/editar test burnout"}
		let sql = ``;
		let arr = []
		let word = "actualizado"

		if(item.id){
			sql = `
				UPDATE ${tablaNombre}
				SET idUser = ?, value = ?, score = ?, dateEdited = NOW() WHERE id = ?
			`
		} else {
			// Check there is no current quarter test and if there is throw an error
			const { hasCurrentMonthTest } = await BurnoutTest.hasCurrentMonthTest(idAdmin);
			if(hasCurrentMonthTest) {
				return error;
			}

			sql = `
				INSERT INTO ${tablaNombre}
				(idUser,value,score)
				VALUES
				(?,?,?)
			`
			word = "creado"
		}

		let response = []
		let stackTrace = {}
		try {
			let sqlArr = [idAdmin, JSON.stringify(item.value), score];
			if(item.id) {
				sqlArr.push(item.id);
			}
			response = await conn.query(sql, sqlArr)
		} catch(e){
			stackTrace = e;
		}
		error.stack = {trace: stackTrace, res: response}

		return (response.changedRows || response.insertId) ? {response: `Burnout Test ${word} correctamente`} : error;
	}
}
module.exports = BurnoutTest;