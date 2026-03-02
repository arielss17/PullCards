const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const authRoutes = require('./routes/auth');
const collectionRoutes = require('./routes/collection');
const { readJSON, writeJSON, dataDir } = require('./helpers/json-store');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));
// Serve static data files (images, monsters JSON)
app.use('/data', express.static(path.join(__dirname, '../data')));

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/collection', collectionRoutes);

// --- Legacy Config Endpoints ---
const CONFIG_PATH = path.join(dataDir, 'admin_config.json');

const initConfig = async () => {
    try {
        await fs.access(CONFIG_PATH);
        // Ensure customTiers exists even if file exists
        const current = await readJSON('admin_config.json');

        // Ensure customTiers exists
        if (!current.customTiers || Object.keys(current.customTiers).length === 0) {
            current.customTiers = {
                "Z": { "label": "TIER Z", "nickname": "Divino", "maxD20": 20 },
                "S": { "label": "TIER S", "nickname": "Lendário", "maxD20": 19 },
                "A": { "label": "TIER A", "nickname": "Raro", "maxD20": 18 },
                "B": { "label": "TIER B", "nickname": "Incomum", "maxD20": 16 },
                "C": { "label": "TIER C", "nickname": "Comum", "maxD20": 14 },
                "D": { "label": "TIER D", "nickname": "Inferior", "maxD20": 10 },
                "E": { "label": "TIER E", "nickname": "Insignificante", "maxD20": 5 }
            };
            await writeJSON('admin_config.json', current);
        } else {
            // Ensure specific fields (like maxD20) exist in each existing tier
            const defaults = {
                "Z": 20, "S": 19, "A": 18, "B": 16, "C": 14, "D": 10, "E": 5
            };
            let modified = false;
            for (const [id, tier] of Object.entries(current.customTiers)) {
                if (tier.maxD20 === undefined && defaults[id] !== undefined) {
                    tier.maxD20 = defaults[id];
                    modified = true;
                }
            }
            if (modified) await writeJSON('admin_config.json', current);
        }
    } catch {
        const defaultConfig = {
            tables: {
                A: { maxD100: 50 },
                B: { maxD100: 80 },
                C: { maxD100: 100 }
            },
            customTiers: {
                "Z": { "label": "TIER Z", "nickname": "Divino", "maxD20": 20 },
                "S": { "label": "TIER S", "nickname": "Lendário", "maxD20": 19 },
                "A": { "label": "TIER A", "nickname": "Raro", "maxD20": 18 },
                "B": { "label": "TIER B", "nickname": "Incomum", "maxD20": 16 },
                "C": { "label": "TIER C", "nickname": "Comum", "maxD20": 14 },
                "D": { "label": "TIER D", "nickname": "Inferior", "maxD20": 10 },
                "E": { "label": "TIER E", "nickname": "Insignificante", "maxD20": 5 }
            },
            monsterOverrides: {}
        };
        await writeJSON('admin_config.json', defaultConfig);
    }
};

// --- Middleware de Segurança ---
const requireAdmin = (req, res, next) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail || userEmail.toLowerCase() !== 'arielssilva@hotmail.com') {
        return res.status(403).json({ error: 'Acesso negado. Apenas o Arquimago (Admin) pode alterar o véu da realidade.' });
    }
    next();
};

app.get('/api/config', async (req, res) => {
    try {
        const data = await readJSON('admin_config.json');
        res.json(data);
    } catch (error) {
        console.error('Error reading config:', error);
        res.status(500).json({ error: 'Failed to read config' });
    }
});

app.post('/api/config', requireAdmin, async (req, res) => {
    try {
        const newConfig = req.body;
        if (!newConfig.tables || !newConfig.customTiers) {
            return res.status(400).json({ error: 'Invalid config payload' });
        }
        await writeJSON('admin_config.json', newConfig);
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
