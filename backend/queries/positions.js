const TABLE_POSITIONS = 'careers'

const Queries = {
    editRoadmap: `
        UPDATE ${TABLE_POSITIONS} SET 
            roadmap = ?
        WHERE id = ?
    `
}

module.exports = Queries