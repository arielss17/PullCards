const { readJSON, writeJSON } = require('../helpers/json-store');
const USERS_FILE = 'users.json';

class UserRepository {
    static async findAll() {
        return (await readJSON(USERS_FILE)) || [];
    }

    static async findByEmail(email) {
        const users = await this.findAll();
        return users.find(u => u.email.toLowerCase() === email.toLowerCase());
    }

    static async findById(id) {
        const users = await this.findAll();
        return users.find(u => u.id === id);
    }

    static async saveAll(users) {
        await writeJSON(USERS_FILE, users);
    }

    static async save(user) {
        const users = await this.findAll();
        const index = users.findIndex(u => u.id === user.id);
        if (index !== -1) {
            users[index] = user;
        } else {
            users.push(user);
        }
        await this.saveAll(users);
    }
}

module.exports = UserRepository;
