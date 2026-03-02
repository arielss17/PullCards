const fs = require('fs').promises;
const path = require('path');

const dataDir = path.join(__dirname, '../../data');

const readJSON = async (filename) => {
    const filePath = path.join(dataDir, filename);
    try {
        const raw = await fs.readFile(filePath, 'utf8');
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

const writeJSON = async (filename, data) => {
    const filePath = path.join(dataDir, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
};

module.exports = { readJSON, writeJSON, dataDir };
