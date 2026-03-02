const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));
// Serve static data files (images, monsters JSON)
app.use('/data', express.static(path.join(__dirname, '../data')));

// --- API Endpoints ---

const CONFIG_PATH = path.join(__dirname, '../data/admin_config.json');

// Initialize default config if it doesn't exist
const initConfig = async () => {
    try {
        await fs.access(CONFIG_PATH);
    } catch {
        const defaultConfig = {
            tables: {
                A: { maxD100: 50 },
                B: { maxD100: 80 },
                C: { maxD100: 100 }
            },
            customTiers: {}, // legacy
            monsterOverrides: {} // record of monsterId -> { tables: ['A'], tier: 'C' }
        };
        await fs.writeFile(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
    }
};

// GET config
app.get('/api/config', async (req, res) => {
    try {
        const data = await fs.readFile(CONFIG_PATH, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading config:', error);
        res.status(500).json({ error: 'Failed to read config' });
    }
});

// POST save config
app.post('/api/config', async (req, res) => {
    try {
        const newConfig = req.body;
        // Basic validation
        if (!newConfig.tables || !newConfig.customTiers) {
            return res.status(400).json({ error: 'Invalid config payload' });
        }
        await fs.writeFile(CONFIG_PATH, JSON.stringify(newConfig, null, 2));
        res.json({ success: true, message: 'Configuration saved successfully' });
    } catch (error) {
        console.error('Error saving config:', error);
        res.status(500).json({ error: 'Failed to save config' });
    }
});



// Start server
initConfig().then(() => {
    app.listen(PORT, () => {
        console.log(`==========================================`);
        console.log(`🔮 PullCards Server running on port ${PORT}`);
        console.log(`👉 http://localhost:${PORT}`);
        console.log(`==========================================`);
    });
});
