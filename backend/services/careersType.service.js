const Utils = require("./utils.service")
const TABLE_NAME = 'careers_type';
const PAGE_SIZE = 10;

const CareersType = {
    getByIdCompany: async (company_slug, current_page = 1, res) => {
        const companyId = await Utils.getIdCompanyBySlug(company_slug, res);

        const sql = `
            SELECT * FROM ${TABLE_NAME} 
            WHERE idCompany = ?
            LIMIT ? OFFSET ?
        `;

        const totalPages = await CareersType.countPages(companyId);
        const pagesInfo = { currentPage: parseInt(current_page), ...totalPages.response[0] }
        
        const offset = PAGE_SIZE * Number(current_page - 1);
        const arr = [companyId, PAGE_SIZE, offset];
        const careersType = await Utils.generalQuery(sql, arr, 'read')

        return { ...careersType, pagesInfo }
    },
    createNewCareerType: async (careerName, company_slug, res) => {
        const companyId = await Utils.getIdCompanyBySlug(company_slug, res);

        const sql = `
            INSERT INTO ${TABLE_NAME}
                (careerName, idCompany)
            VALUES
                (?, ?)
        `;

        const arr = [careerName, companyId];

        return await Utils.generalQuery(sql, arr, 'write', res);
    },
    updateOneCareerType: async (careerName, careerId, company_slug, res) => {
        const companyId = await Utils.getIdCompanyBySlug(company_slug, res);

        const sql = `
            UPDATE ${TABLE_NAME}
            SET careerName = ?
            WHERE id = ? AND idCompany = ?
        `;

        const arr = [careerName, careerId, companyId];

        return await Utils.generalQuery(sql, arr, 'write', res);
    },
    deleteOneCareerType: async (careerId, company_slug, res) => {
        const companyId = await Utils.getIdCompanyBySlug(company_slug, res);
        
        const sql = `
            DELETE FROM ${TABLE_NAME} 
            WHERE id = ? AND idCompany = ?
        `;

        const arr = [careerId, companyId]

        return Utils.generalQuery(sql, arr, 'write', res);
    },
    countPages: async (companyId, res) => {
        const sql = `
			SELECT COUNT(*) AS total FROM ${TABLE_NAME}
			WHERE idCompany = ?
		`;

        const arr = [companyId];

        return Utils.generalQuery(sql, arr, 'count', res);
    },
}

module.exports = CareersType;
