const MonsterRepository = require('../repositories/MonsterRepository');

class SummonService {
    static async getConfig(expansionId) {
        // Now it fetches from the decentralized Expansion Payload directly
        const payload = await MonsterRepository.getExpansionPayload(expansionId);
        return payload.config || {};
    }

    static rollD100() {
        return Math.floor(Math.random() * 100) + 1;
    }

    static rollD20() {
        return Math.floor(Math.random() * 20) + 1;
    }

    static async getTableFromRoll(d100, expansionId) {
        const config = await this.getConfig(expansionId);
        if (!config || !config.tables) return "C";

        const sortedTables = Object.entries(config.tables).sort((a, b) => a[1].maxD100 - b[1].maxD100);
        for (const [tableName, tableConfig] of sortedTables) {
            if (d100 <= tableConfig.maxD100) return tableName;
        }
        return sortedTables[sortedTables.length - 1]?.[0] || "C";
    }

    static async getTierFromRoll(d20, expansionId) {
        const fallback = (roll) => {
            if (roll === 1) return "E";
            if (roll <= 5) return "D";
            if (roll <= 11) return "C";
            if (roll <= 15) return "B";
            if (roll <= 18) return "A";
            if (roll === 19) return "S";
            return "CRITICAL";
        };

        const config = await this.getConfig(expansionId);
        if (!config || !config.customTiers) return fallback(d20);

        const tiersArray = Object.entries(config.customTiers)
            .filter(([id]) => id !== "Z")
            .sort((a, b) => a[1].maxD20 - b[1].maxD20);

        const maxConfigured = tiersArray.length > 0 ? tiersArray[tiersArray.length - 1][1].maxD20 : 19;

        if (d20 > maxConfigured || d20 === 20) return "CRITICAL";

        for (const [tierId, tierConfig] of tiersArray) {
            if (tierConfig.maxD20 !== undefined && d20 <= tierConfig.maxD20) {
                return tierId;
            }
        }

        return fallback(d20);
    }

    static async handleCritical(expansionId) {
        const innerRoll = Math.max(this.rollD20(), this.rollD20());
        const config = await this.getConfig(expansionId);
        const rules = config.criticalRules || {
            baseRewardTier: "S",
            baseRewardCount: 2,
            innerCriticalTier: "Z",
            innerCriticalCount: 1
        };

        let pickedTier = rules.baseRewardTier;
        let pickedCount = rules.baseRewardCount;

        if (innerRoll === 20) {
            pickedTier = rules.innerCriticalTier;
            pickedCount = rules.innerCriticalCount;
        }

        return { type: pickedTier, count: pickedCount, innerRoll };
    }

    static async findCards(expansionId, table, tier, count = 1) {
        const config = await this.getConfig(expansionId);
        const monsters = await MonsterRepository.findAllByExpansion(expansionId);

        // Apply config overrides in memory (equivalent to frontend logic)
        const database = monsters.map(m => {
            const override = config.monsterOverrides && config.monsterOverrides[m.id] ? config.monsterOverrides[m.id] : {};
            return {
                ...m,
                tier: override.tier || m.tier,
                tables: override.tables || m.tables || [m.table],
                dropWeight: override.dropWeight !== undefined ? override.dropWeight : m.dropWeight
            };
        });

        let pool = database.filter(c => (c.tables && c.tables.includes(table)) && c.tier === tier);
        if (pool.length === 0) pool = database.filter(c => c.tables && c.tables.includes(table));
        if (pool.length === 0) pool = database.filter(c => c.tier === tier);
        if (pool.length === 0) pool = [...database];

        let totalWeight = 0;
        const weightedPool = pool.map(c => {
            const weight = typeof c.dropWeight === 'number' ? c.dropWeight : 100;
            totalWeight += weight;
            return { card: c, weight, accumulatedWeight: totalWeight };
        });

        const results = [];
        for (let i = 0; i < count; i++) {
            if (totalWeight <= 0) {
                const pick = pool[Math.floor(Math.random() * pool.length)];
                results.push({ ...pick });
                continue;
            }

            const rand = Math.random() * totalWeight;
            const pickData = weightedPool.find(item => rand <= item.accumulatedWeight);
            const pick = pickData ? pickData.card : pool[0];
            results.push({ ...pick });
        }
        return results;
    }

    static async performSummon(expansionId) {
        // Step 1: Roll for Table
        const d100 = this.rollD100();
        const table = await this.getTableFromRoll(d100, expansionId);

        // Step 2: Roll for Tier + resolve cards
        const d20 = this.rollD20();
        const tierResult = await this.getTierFromRoll(d20, expansionId);

        let cards = [];
        let isCritical = false;
        let criticalData = null;
        let finalTier = tierResult;

        if (tierResult === "CRITICAL") {
            isCritical = true;
            criticalData = await this.handleCritical(expansionId);
            finalTier = criticalData.type;
            cards = await this.findCards(expansionId, table, criticalData.type, criticalData.count);
        } else {
            cards = await this.findCards(expansionId, table, tierResult);
        }

        return {
            d100,
            table,
            d20,
            tier: finalTier,
            isCritical,
            criticalData,
            cards,
            sourceMap: expansionId
        };
    }
}

module.exports = SummonService;
