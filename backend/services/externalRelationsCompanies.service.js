require('dotenv').config()
const axios = require('axios')
const companieService = require('./companies.service')
const Utils = require('./utils.service')

const TABLE_NAME = 'companies_external_relations'
const API_LEXTRACKING = process.env.API_LEXTRACKING

const relationsExternals = {
    getAll: async (companyId) => {

        const query = `SELECT * FROM ${TABLE_NAME} WHERE idCompany1 = ? OR idCompany2 = ?`

        let relations = await Utils.generalQuery(query, [companyId, companyId, companyId], 'read')
        const companiesHandler = await relationsExternals.companiesHandler(relations.response)

        relations.response = companiesHandler

        return relations
    },

    companiesHandler: (relations) => {

        if (relations.length === 0) {
            return relations;
        }

        return new Promise(resolve => {
            const countRelation = relations.length;

            relations.map((relation, index) => {
                index += 1

                const companiesId = [relation.idCompany1, relation.idCompany2];
                const getCompanies = new Promise(resolve => {

                    relation.companies = []

                    companiesId.forEach(async (id) => {
                        await companieService.getById(id).then((companie) => {
                            relation.companies.push(companie.response[0])
                            if (relation.companies.length === 2) resolve()
                        })
                    })
                })

                getCompanies.then(() => {
                    if (countRelation === index) resolve(relations)
                })
            })
        })
    },

    getById: async (relationId) => {
        const query = `SELECT * FROM ${TABLE_NAME} WHERE id = ?`

        let relations = await Utils.generalQuery(query, [relationId], 'read')
        const companiesHandler = await relationsExternals.companiesHandler(relations.response)

        relations.response = companiesHandler

        return relations
    },

    newRelation: async (idCompany1, idCompany2) => {
        if (idCompany1 == idCompany2) return ["Companies must be different"]

        const openToExternalRelations = async (idCompany1, idCompany2) => {
            const companie_1 = await companieService.getById(idCompany1)
            const companie_2 = await companieService.getById(idCompany2)

            if (companie_1.response.length === 0 || companie_2.response.length === 0) return ["Companies invalid"]

            const openToExternalRelations1 = companie_1.response[0].openToExternalRelations
            const openToExternalRelations2 = companie_2.response[0].openToExternalRelations

            return openToExternalRelations1 === 1 && openToExternalRelations2 === 1
        }

        if (await openToExternalRelations(idCompany1, idCompany2) !== true) {
            return ["One of the companies is not open for external relations"]
        }

        const checkRelations = await relationsExternals.checkRelation(idCompany1, idCompany2)

        if (checkRelations.response.length > 0) {

            if(checkRelations.response[0].company1_accepted === 2 && checkRelations.response[0].company2_accepted === 2) {
                return ["There is already an external relationship between these two companies"]
            }

            if(checkRelations.response[0].company1_accepted === 0 && checkRelations.response[0].company2_accepted === 0) {
                relationsExternals.changeStatusRelation(idCompany1, idCompany2, 'accept')
            }

            return ["Pending relationship"]
        }

        const query = `INSERT INTO ${TABLE_NAME} (idCompany1, idCompany2, company1_accepted, company2_accepted) VALUES (?, ?, ?, ?)`

        const newRelation = Utils.generalQuery(query, [idCompany1, idCompany2, 2, 1], 'write')

        return newRelation
    },

    checkRelation: async (idCompany1, idCompany2) => {
        const query = `SELECT * FROM ${TABLE_NAME} WHERE idCompany1 = ? AND idCompany2 = ? OR idCompany2 = ? AND idCompany1 = ? `
        const checkRelation = await Utils.generalQuery(query, [idCompany1, idCompany2, idCompany1, idCompany2], 'read')

        return checkRelation
    },

    checkCompanyIdAcceptedColumn: async (relation, id) => {

        const currentCompany = { query: relation.idCompany1 == id ? "company1_accepted = ? " : "company2_accepted = ? ", value: 2 }
        const company = !(relation.idCompany1 == id) ? "company1_accepted" : "company2_accepted"

        const companyAccept = relation[company]
        const companyAcceptQuery = companyAccept == 0 ? { query: company + " = ? ", value: 1 } : companyAccept == 1 ? { query: company + " = ? ", value: companyAccept } : { query: company + " = ? ", value: 2 }

        return { currentCompany, companyAcceptQuery }
    },

    changeStatusRelation: async (idCompany1, idCompany2, status) => {

        const checkRelations = await relationsExternals.checkRelation(idCompany1, idCompany2)

        const operation = {
            accept: async (checkRelations) => {
                const column = await relationsExternals.checkCompanyIdAcceptedColumn(checkRelations.response[0], idCompany1)

                const query = `UPDATE ${TABLE_NAME} SET ${column.currentCompany.query}, ${column.companyAcceptQuery.query} WHERE id = ?`
                const accept = Utils.generalQuery(query, [column.currentCompany.value, column.companyAcceptQuery.value, checkRelations.response[0].id], 'write')

                return accept
            },
            decline: async (checkRelations) => {
                const idRelation = checkRelations.response[0].id

                const query = `UPDATE ${TABLE_NAME} SET company1_accepted = ?, company2_accepted = ? WHERE id = ?`
                const decline = Utils.generalQuery(query, [0, 0, idRelation], 'write')

                return decline
            }
        }

        return operation[status](checkRelations)
    },
}

module.exports = relationsExternals;
