const Utils = require("./utils.service")
const TABLE_NAME = 'careers_type';
const PAGE_SIZE = 10;

const CareersType = {
    getByIdCompany: async (company_slug, res, current_page = 1) => {
        try {
            const companyId = await Utils.getIdCompanyBySlug(company_slug);
            
            if (!companyId) {
                return { status: 400, message: 'Company not found' };
            }

            const sql = `
                SELECT * FROM ${TABLE_NAME}
                WHERE idCompany = ?
                LIMIT ? OFFSET ?
            `;

            const totalPages = await CareersType.countPages(companyId);
            
            // Add safety check for totalPages.response
            if (!totalPages || !totalPages.response || !totalPages.response[0]) {
                return { status: 400, message: 'Error getting pagination info' };
            }
            
            const pagesInfo = { currentPage: parseInt(current_page), ...totalPages.response[0] }

            const offset = PAGE_SIZE * Number(current_page - 1);
            const arr = [companyId, PAGE_SIZE, offset];
            const careersType = await Utils.generalQuery(sql, arr, 'read')

            return { ...careersType, pagesInfo }
        } catch (error) {
            console.error('Error in getByIdCompany:', error);
            return { status: 500, message: 'Internal server error' };
        }
    },
    createNewCareerType: async (careerName, company_slug) => {
        const companyId = await Utils.getIdCompanyBySlug(company_slug);

        if (!companyId) {
            return { status: 400, message: 'Company not found' };
        }

        const sql = `
            INSERT INTO ${TABLE_NAME}
                (careerName, idCompany)
            VALUES
                (?, ?)
        `;

        const arr = [careerName, companyId];

        return await Utils.generalQuery(sql, arr, 'write');
    },
    updateOneCareerType: async (careerName, careerId, company_slug) => {
        const companyId = await Utils.getIdCompanyBySlug(company_slug);

        if (!companyId) {
            return { status: 400, message: 'Company not found' };
        }

        const sql = `
            UPDATE ${TABLE_NAME}
            SET careerName = ?
            WHERE id = ? AND idCompany = ?
        `;

        const arr = [careerName, careerId, companyId];

        return await Utils.generalQuery(sql, arr, 'write');
    },
    deleteOneCareerType: async (careerId, company_slug) => {
        const companyId = await Utils.getIdCompanyBySlug(company_slug);

        if (!companyId) {
            return { status: 400, message: 'Company not found' };
        }

        const sql = `
            DELETE FROM ${TABLE_NAME}
            WHERE id = ? AND idCompany = ?
        `;

        const arr = [careerId, companyId]

        return Utils.generalQuery(sql, arr, 'write');
    },
    countPages: async (companyId) => {
        const sql = `
            SELECT COUNT(*) AS total FROM ${TABLE_NAME}
            WHERE idCompany = ?
        `;

        const arr = [companyId];

        return Utils.generalQuery(sql, arr, 'count', PAGE_SIZE);
    },
}

module.exports = CareersType;
