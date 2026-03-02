// ============================================================
// PullCards - D&D 5e Monster Data Loader (Local-First)
// ============================================================

const MonsterAPI = (() => {
    const BASE = 'https://www.dnd5eapi.co';
    const LIST_URL = `${BASE}/api/2014/monsters`;
    const LOCAL_DATA = '/data/monsters_game.json';
    const CONCURRENCY = 10;

    // --- Dynamic Config ---
    let config = { monsterOverrides: {} };

    const fetchConfig = async () => {
        try {
            const resp = await fetch('/api/config');
            if (resp.ok) {
                config = await resp.json();
                if (typeof SummonEngine !== 'undefined') {
                    SummonEngine.setConfig(config);
                }
            }
        } catch (e) {
            console.error('Failed to load admin config:', e);
        }
    };

    // --- CR → Table Mapping ---
    const crToTable = (cr) => {
        if (cr <= 4) return 'A';
        if (cr <= 12) return 'B';
        return 'C';
    };

    // --- CR → Tier Mapping ---
    const crToTier = (cr) => {
        if (cr <= 2) return 'C';
        if (cr <= 6) return 'B';
        if (cr <= 14) return 'A';
        return 'S';
    };

    // --- Stat Scaling ---
    const scaleAttack = (str, dex) => Math.max(1, Math.min(10, Math.round(Math.max(str, dex) / 3)));
    const scaleDefense = (ac) => Math.max(1, Math.min(10, Math.round((ac - 5) / 2)));

    // --- Type → Emoji ---
    const typeEmoji = (type) => {
        const map = {
            aberration: '👁️', beast: '🐾', celestial: '✨', construct: '⚙️',
            dragon: '🐉', elemental: '🌊', fey: '🧚', fiend: '😈',
            giant: '🗿', humanoid: '🧑', monstrosity: '🦎', ooze: '🫧',
            plant: '🌿', undead: '💀', swarm: '🐝',
        };
        return map[type?.toLowerCase()] || '❓';
    };

    // --- Transform API monster to card format (for API fallback) ---
    const toCard = (m) => {
        const ac = m.armor_class?.[0]?.value ?? 10;
        const cr = m.challenge_rating ?? 0;
        const imgPath = m.image ? `${BASE}${m.image}` : `https://robohash.org/${m.index}?set=set2`;

        // Apply Config Overrides
        const override = config.monsterOverrides?.[m.index];
        const tables = override?.tables && override.tables.length > 0 ? override.tables : [crToTable(cr)];
        const tier = override?.tier || crToTier(cr);

        return {
            id: m.index,
            name: m.name,
            tables: tables,
            tier: tier,
            imageUrl: imgPath,
            stats: {
                attack: scaleAttack(m.strength ?? 10, m.dexterity ?? 10),
                defense: scaleDefense(ac),
            },
            type: m.type || 'unknown',
            typeEmoji: typeEmoji(m.type),
            size: m.size || '?',
            hp: m.hit_points ?? 0,
            cr,
            ac,
        };
    };

    // --- Batch fetch with concurrency limit (API fallback) ---
    const fetchBatch = async (urls, onProgress) => {
        const results = [];
        let done = 0;

        for (let i = 0; i < urls.length; i += CONCURRENCY) {
            const batch = urls.slice(i, i + CONCURRENCY);
            const batchResults = await Promise.all(
                batch.map(async (url) => {
                    try {
                        const r = await fetch(url, { headers: { Accept: 'application/json' } });
                        if (!r.ok) return null;
                        return await r.json();
                    } catch {
                        return null;
                    }
                })
            );
            results.push(...batchResults);
            done += batch.length;
            if (onProgress) onProgress(done, urls.length);
        }

        return results.filter(Boolean);
    };

    // --- Try loading from locale-specific or local data/ directory ---
    const loadLocal = async () => {
        // Try locale-specific monsters first
        if (typeof I18n !== 'undefined') {
            try {
                const localePath = I18n.getMonstersPath();
                const resp = await fetch(localePath);
                if (resp.ok) {
                    const data = await resp.json();
                    if (Array.isArray(data) && data.length > 100) {
                        console.log(`🌐 Loaded ${data.length} monsters from ${localePath}`);
                        return data;
                    }
                }
            } catch { /* locale file not available */ }
        }

        // Fallback to default data file
        try {
            const resp = await fetch(LOCAL_DATA);
            if (!resp.ok) return null;
            const data = await resp.json();
            if (Array.isArray(data) && data.length > 100) return data;
        } catch { /* local file not available */ }
        return null;
    };

    // --- Fetch from live API (fallback) ---
    const loadFromAPI = async (onProgress) => {
        if (onProgress) onProgress(0, 1);
        const listResp = await fetch(LIST_URL, { headers: { Accept: 'application/json' } });
        const listData = await listResp.json();
        const monsterList = listData.results || [];

        const urls = monsterList.map((m) => `${BASE}${m.url}`);
        const details = await fetchBatch(urls, onProgress);

        return details.map(toCard);
    };

    // --- Main Loader (local-first, API fallback) ---
    const loadAll = async (onProgress) => {
        // 0. Fetch Config first
        await fetchConfig();

        // 1. Try local data first
        let monsters = await loadLocal();
        if (monsters) {
            if (onProgress) onProgress(monsters.length, monsters.length);
            console.log(`📂 Loaded ${monsters.length} monsters from local data/`);
        } else {
            // 2. Fallback to live API
            console.log('🌐 Local data not found, fetching from D&D 5e API...');
            monsters = await loadFromAPI(onProgress);
        }

        // 3. Map Overrides to already-loaded local data
        return monsters.map(m => {
            const override = config.monsterOverrides?.[m.id];
            if (override) {
                // Ensure legacy `table` property is converted to `tables` array if needed
                const overrideTables = override.tables || (override.table ? [override.table] : null);
                return {
                    ...m,
                    tables: overrideTables && overrideTables.length > 0 ? overrideTables : (m.tables || [m.table]),
                    tier: override.tier || m.tier
                };
            }
            // Ensure local base monsters without overrides have a tables array instead of a single string
            if (m.table && !m.tables) {
                m.tables = [m.table];
            }
            return m;
        });
    };

    return { loadAll, typeEmoji };
})();
