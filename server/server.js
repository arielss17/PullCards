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
            for (const [id, tier] of Object.entries(current.customTiers)) {
                if (tier.maxD20 === undefined && defaults[id] !== undefined) {
                    tier.maxD20 = defaults[id];
                    modified = true;
                }
            }
        } // End of customTiers else block

        // Ensure criticalRules exists
        if (!current.criticalRules) {
            current.criticalRules = {
                baseRewardTier: "S",
                baseRewardCount: 2,
                innerCriticalTier: "Z",
                innerCriticalCount: 1
            };
            modified = true;
        }

        if (modified) await writeJSON('admin_config.json', current);
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
            criticalRules: {
                baseRewardTier: "S",
                baseRewardCount: 2,
                innerCriticalTier: "Z",
                innerCriticalCount: 1
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

// --- Locale Management API ---
const LOCALES_DIR = path.join(__dirname, '../public/locales');

// Flatten nested object to dot-notation keys
const flattenKeys = (obj, prefix = '') => {
    const result = {};
    for (const [key, val] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (val && typeof val === 'object' && !Array.isArray(val)) {
            Object.assign(result, flattenKeys(val, fullKey));
        } else {
            result[fullKey] = val;
        }
    }
    return result;
};

// Unflatten dot-notation keys back to nested object
const unflattenKeys = (flat) => {
    const result = {};
    for (const [key, val] of Object.entries(flat)) {
        const parts = key.split('.');
        let curr = result;
        for (let i = 0; i < parts.length - 1; i++) {
            if (!curr[parts[i]]) curr[parts[i]] = {};
            curr = curr[parts[i]];
        }
        curr[parts[parts.length - 1]] = val;
    }
    return result;
};

// GET /api/locales — list available locales
app.get('/api/locales', async (req, res) => {
    try {
        const files = await fs.readdir(LOCALES_DIR);
        const locales = files
            .filter(f => f.endsWith('.json') && !f.includes('/'))
            .map(f => f.replace('.json', ''));
        res.json({ locales, defaultLocale: 'pt-BR' });
    } catch (error) {
        console.error('Error listing locales:', error);
        res.status(500).json({ error: 'Failed to list locales' });
    }
});

// GET /api/locales/:lang — read a locale file
app.get('/api/locales/:lang', async (req, res) => {
    try {
        const filePath = path.join(LOCALES_DIR, `${req.params.lang}.json`);
        const content = await fs.readFile(filePath, 'utf-8');
        res.json(JSON.parse(content));
    } catch (error) {
        console.error(`Error reading locale ${req.params.lang}:`, error);
        res.status(404).json({ error: 'Locale not found' });
    }
});

// GET /api/locales/:lang/missing — compare vs pt-BR, return missing keys
app.get('/api/locales/:lang/missing', async (req, res) => {
    try {
        const refPath = path.join(LOCALES_DIR, 'pt-BR.json');
        const targetPath = path.join(LOCALES_DIR, `${req.params.lang}.json`);

        const refContent = JSON.parse(await fs.readFile(refPath, 'utf-8'));
        let targetContent = {};
        try {
            targetContent = JSON.parse(await fs.readFile(targetPath, 'utf-8'));
        } catch { /* file may not exist yet */ }

        const refFlat = flattenKeys(refContent);
        const targetFlat = flattenKeys(targetContent);

        const missing = {};
        const existing = {};
        for (const [key, val] of Object.entries(refFlat)) {
            if (!(key in targetFlat) || targetFlat[key] === '') {
                missing[key] = { reference: val, current: targetFlat[key] || '' };
            } else {
                existing[key] = { reference: val, current: targetFlat[key] };
            }
        }

        res.json({
            lang: req.params.lang,
            totalKeys: Object.keys(refFlat).length,
            missingCount: Object.keys(missing).length,
            translatedCount: Object.keys(existing).length,
            missing,
            existing
        });
    } catch (error) {
        console.error(`Error comparing locale ${req.params.lang}:`, error);
        res.status(500).json({ error: 'Failed to compare locales' });
    }
});

// PUT /api/locales/:lang — save locale updates (admin only)
app.put('/api/locales/:lang', requireAdmin, async (req, res) => {
    try {
        const lang = req.params.lang;
        if (lang === 'pt-BR') {
            return res.status(400).json({ error: 'Não é possível editar o idioma padrão (pt-BR) por aqui.' });
        }

        const filePath = path.join(LOCALES_DIR, `${lang}.json`);
        const updates = req.body.translations; // flat key-value pairs

        // Read existing or start empty
        let existing = {};
        try {
            existing = JSON.parse(await fs.readFile(filePath, 'utf-8'));
        } catch { /* new file */ }

        // Merge updates into existing (unflatten both)
        const existingFlat = flattenKeys(existing);
        Object.assign(existingFlat, updates);
        const merged = unflattenKeys(existingFlat);

        await fs.writeFile(filePath, JSON.stringify(merged, null, 4), 'utf-8');
        res.json({ success: true, message: `Locale ${lang} updated`, keysUpdated: Object.keys(updates).length });
    } catch (error) {
        console.error(`Error saving locale ${req.params.lang}:`, error);
        res.status(500).json({ error: 'Failed to save locale' });
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
