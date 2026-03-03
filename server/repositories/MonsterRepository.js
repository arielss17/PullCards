const { readJSON } = require('../helpers/json-store');
const MONSTERS_FILE = 'monsters_game.json'; // Next wave will use expansions

class MonsterRepository {
    static async findAll() {
        return (await readJSON(MONSTERS_FILE)) || [];
    }
}

module.exports = MonsterRepository;
