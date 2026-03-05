const { readJSON } = require('../helpers/json-store');
const ExpansionRepository = require('./ExpansionRepository');

class MonsterRepository {
    /**
     * Finds all monsters (cards) for a specific expansion.
     * @param {string} expansionId 
     * @returns {Promise<Array>}
     */
    static async findAllByExpansion(expansionId) {
        const expansion = await ExpansionRepository.findById(expansionId);
        if (!expansion) throw new Error(`Expansion ${expansionId} not found`);

        const data = await readJSON(expansion.file);
        return data?.cards || [];
    }

    /**
     * Gets the full configuration payload (cards, config, summonExperience) for an expansion.
     * @param {string} expansionId 
     */
    static async getExpansionPayload(expansionId) {
        const expansion = await ExpansionRepository.findById(expansionId);
        if (!expansion) throw new Error(`Expansion ${expansionId} not found`);
        return await readJSON(expansion.file) || {};
    }
}

module.exports = MonsterRepository;
