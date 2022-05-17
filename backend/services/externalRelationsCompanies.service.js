require('dotenv').config()
const axios = require('axios')
const companieService = require('./companies.service')
const Utils = require('./utils.service')

const TABLE_NAME = 'companies_external_relations'
const API_LEXTRACKING = process.env.API_LEXTRACKING

const relationsExternals = {
    getAll: async (companyId) => {
        const query = `SELECT ${TABLE_NAME}.* FROM ${TABLE_NAME} WHERE idCompany1 = ? OR idCompany2 = ? AND active = 1`

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

                    companiesId.map(async (id) => {
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
        const query = `SELECT * FROM ${TABLE_NAME} WHERE id = ? AND active = 1`

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

        if (checkRelations.response.length > 0 && checkRelations.response[0].active == 1) {
            return ["There is already an external relationship between these two companies"]
        }

        const query = checkRelations.response[0].active == 0 ? `UPDATE ${TABLE_NAME} SET active = ? WHERE id = ?` : `INSERT INTO ${TABLE_NAME} (idCompany1, idCompany2) VALUES (?, ?)`

        const newRelation = Utils.generalQuery(query, checkRelations.response[0].active == 0 ? [1, checkRelations.response[0].id] : [idCompany1, idCompany2], 'write')

        return newRelation;
    },

    checkRelation: async (idCompany1, idCompany2) => {
        const query = `SELECT * FROM ${TABLE_NAME} WHERE idCompany1 = ? AND idCompany2 = ?`

        const checkRelation = await Utils.generalQuery(query, [idCompany1, idCompany2], 'read')

        return checkRelation
    },

    deActiveRelation: async (relationId) => {

        const checkRelationActive = async (relationId) => {
            const relation = await relationsExternals.getById(relationId)

            return relation.reponse > 0
        }

        if (!checkRelationActive(relationId)) return ["This relationship has either been deleted or does not exist"]

        const query = `UPDATE ${TABLE_NAME} SET active = ? WHERE id = ?`
        
        const newRelation = await Utils.generalQuery(query, [0, relationId], 'write')

        return newRelation;
    }

}

module.exports = relationsExternals;
