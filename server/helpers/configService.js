const fs = require('fs').promises;
const path = require('path');
const { readJSON, writeJSON, dataDir } = require('./json-store');

const CONFIG_PATH = path.join(dataDir, 'admin_config.json');

const initConfig = async () => {
    try {
        await fs.access(CONFIG_PATH);
        // Ensure customTiers exists even if file exists
        const current = await readJSON('admin_config.json');
        let modified = false;

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

module.exports = { initConfig };
