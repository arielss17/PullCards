const { readJSON, writeJSON } = require('../helpers/json-store');
const COLLECTIONS_FILE = 'collections.json';

class CollectionRepository {
    static async findAll() {
        return (await readJSON(COLLECTIONS_FILE)) || {};
    }

    static async findByUserId(userId) {
        const collections = await this.findAll();
        return collections[userId] || { cards: {} };
    }

    static async saveForUser(userId, collectionData) {
        const collections = await this.findAll();
        collections[userId] = collectionData;
        await writeJSON(COLLECTIONS_FILE, collections);
    }
}

module.exports = CollectionRepository;
