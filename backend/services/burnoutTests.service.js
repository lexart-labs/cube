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
			response.hasCurrentMonthTest = result[0] && result[0].hasCurrentMonthTest > 0;
		} catch (e) {
			console.error(e);
		}

		return response;
	},
	all: async function (idAdmin, page){

		let error = {"error":"Error al obtener burnout tests"};

		const sql = `
			SELECT id, score, value, dateCreated, MONTH(dateCreated) as month, YEAR(dateCreated) as year FROM ${tablaNombre}
			WHERE idUser = ? ORDER BY dateCreated DESC
			LIMIT ${PAGE_SIZE} OFFSET ${PAGE_SIZE * page}
		`
		let response = []
		let hasError = false;
		const valueTired = [1,2,3,6,8,13,14,16,20];
		const valueDepersonalization = [5,10,11,15,22];
		const valueRealization = [4,7,9,12,17,18,19,21];

		try {
			response = await conn.query(sql, [idAdmin]);
			if(response && response.length) {
				response = response.map((item) => {
					item.scoreTired = valueTired.reduce((acc, el) => acc + item.value[el - 1] || 0, 0);
					item.scoreDepersonalization = valueDepersonalization.reduce((acc, el) => acc + item.value[el - 1] || 0, 0);
					item.scoreRealization = valueRealization.reduce((acc, el) => acc + item.value[el - 1] || 0, 0);
					return item;
				});
			}
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
			let result = await conn.query(sql, [idAdmin]);
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
		let sql = ``
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
