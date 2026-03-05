const { readJSON, writeJSON } = require('../helpers/json-store');
const EXPANSIONS_FILE = 'expansions.json';

class ExpansionRepository {
    static async findAll() {
        return (await readJSON(EXPANSIONS_FILE)) || [];
    }

    static async findById(id) {
        const expansions = await this.findAll();
        return expansions.find(e => e.id === id);
    }

    static async getFeatured() {
        const expansions = await this.findAll();
        return expansions.find(e => e.featured) || expansions[0];
    }

    static async saveAll(expansions) {
        await writeJSON(EXPANSIONS_FILE, expansions);
    }

    static async save(expansion) {
        const expansions = await this.findAll();
        const index = expansions.findIndex(e => e.id === expansion.id);
        if (index !== -1) {
            expansions[index] = expansion;
        } else {
            expansions.push(expansion);
        }
        await this.saveAll(expansions);
    }

    static async delete(id) {
        let expansions = await this.findAll();
        expansions = expansions.filter(e => e.id !== id);
        await this.saveAll(expansions);
    }
}

module.exports = ExpansionRepository;
