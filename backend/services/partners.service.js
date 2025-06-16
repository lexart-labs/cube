const utils = require('./utils.service');

const tablaNombre = 'partners';
const priceRulesTable = 'partner_price_rules';
const PAGE_SIZE = 10;

let Partner = {
	all: async function (page, search = ''){
		let error = {"error":"Error al obtener partners"};

		let searchClause = '';
		if (search) {
			searchClause = `AND (p.name LIKE '%${search}%' OR p.email LIKE '%${search}%')`;
		}

		const sql = `
			SELECT p.id, p.name, p.email, p.membership_level as membershipLevel, p.dateCreated
			FROM ${tablaNombre} AS p
			WHERE 1=1 ${searchClause}
			ORDER BY p.dateCreated DESC
			LIMIT ${PAGE_SIZE} OFFSET ${PAGE_SIZE * page}
		`;
		
		let response = [];
		let hasError = false;

		try {
			const partners = await conn.query(sql);
			
			// Make sure partners is an array before iterating
			if (Array.isArray(partners)) {
				// Get price rules for each partner
				for (const partner of partners) {
					const priceRulesSql = `
						SELECT id, position, price
						FROM ${priceRulesTable}
						WHERE partner_id = ?
					`;
					
					const priceRules = await conn.query(priceRulesSql, [partner.id]);
					partner.priceRules = priceRules || [];
					
					// Get skills for each partner
					const skillsSql = `
						SELECT id, skill
						FROM partner_skills
						WHERE partner_id = ?
					`;
					
					const skills = await conn.query(skillsSql, [partner.id]);
					partner.skills = skills.map(item => item.skill);
				}
				
				response = partners;
			} else {
				// If partners is not an array, set it as empty array
				response = [];
			}
		} catch(e){
			console.error(e);
			hasError = true;
		}

		return !hasError ? { response } : error;
	},
	countResults: async function (search = '') {
		let searchClause = '';
		if (search) {
			searchClause = `AND (p.name LIKE '%${search}%' OR p.email LIKE '%${search}%')`;
		}

		const sql = `
			SELECT COUNT(*) AS total FROM ${tablaNombre} AS p
			WHERE 1=1 ${searchClause}
		`;
		const error = { "error": "Error getting total partners page" };
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
		let error = {"error":"Error al obtener partner"};

		const sql = `
			SELECT id, name, email, membership_level as membershipLevel, dateCreated, dateUpdated
			FROM ${tablaNombre}
			WHERE id = ?
		`;
		
		let response = [];

		try {
			const partners = await conn.query(sql, [id]);
			
			if (partners.length > 0) {
				const partner = partners[0];
				
				// Get price rules for the partner
				const priceRulesSql = `
					SELECT id, position, price
					FROM ${priceRulesTable}
					WHERE partner_id = ?
				`;
				
				const priceRules = await conn.query(priceRulesSql, [partner.id]);
				partner.priceRules = priceRules;
				
				// Get skills for the partner
				const skillsSql = `
					SELECT id, skill
					FROM partner_skills
					WHERE partner_id = ?
				`;
				
				const skills = await conn.query(skillsSql, [partner.id]);
				partner.skills = skills.map(item => item.skill);
				
				response = partner;
			}
		} catch(e){
			console.error(e);
			return { response: error };
		}

		return response ? { response } : { response: error };
	},
	upsert: async function (item){
		let error = {"error":"Error al ingresar/editar partner"};
		let word = "actualizado";
		
		try {
			// Handle partner data
			if(item.id){
				const updateSql = `
					UPDATE ${tablaNombre}
					SET name = ?, email = ?, membership_level = ?, dateUpdated = NOW()
					WHERE id = ?
				`;
				
				await conn.query(updateSql, [
					item.name,
					item.email,
					item.membershipLevel || 'Basic',
					item.id
				]);
				
				// Delete existing price rules to replace them
				await conn.query(`DELETE FROM ${priceRulesTable} WHERE partner_id = ?`, [item.id]);
				
				// Delete existing skills to replace them
				await conn.query(`DELETE FROM partner_skills WHERE partner_id = ?`, [item.id]);
			} else {
				const insertSql = `
					INSERT INTO ${tablaNombre}
					(name, email, membership_level)
					VALUES (?, ?, ?)
				`;
				
				const result = await conn.query(insertSql, [
					item.name,
					item.email,
					item.membershipLevel || 'Basic'
				]);
				
				item.id = result.insertId;
				word = "creado";
			}
			
			// Insert price rules
			if (item.priceRules && item.priceRules.length > 0) {
				const priceRulesSql = `
					INSERT INTO ${priceRulesTable}
					(partner_id, position, price)
					VALUES (?, ?, ?)
				`;
				
				for (const rule of item.priceRules) {
					await conn.query(priceRulesSql, [
						item.id,
						rule.position,
						rule.price
					]);
				}
			}
			
			// Insert skills
			if (item.skills && item.skills.length > 0) {
				const skillsSql = `
					INSERT INTO partner_skills
					(partner_id, skill)
					VALUES (?, ?)
				`;
				
				for (const skill of item.skills) {
					if (skill && skill.trim()) {
						await conn.query(skillsSql, [
							item.id,
							skill.trim()
						]);
					}
				}
			}
			
			return { response: `Partner ${word} correctamente` };
		} catch(e){
			console.error(e);
			error.stack = e;
			return error;
		}
	},
	delete: async function (id) {
		let error = {"error":"Error al eliminar partner"};
		const sql = `DELETE FROM ${tablaNombre} WHERE id = ?`;
		let response = [];

		try {
			// The price rules will be deleted automatically due to the foreign key constraint with CASCADE
			response = await conn.query(sql, [id]);
		} catch(e){
			console.error(e);
			return error;
		}

		return response.affectedRows > 0 ? {response: "Partner eliminado correctamente"} : error;
	}
};

module.exports = Partner;