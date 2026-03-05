// ============================================================
// PullCards - D&D 5e Monster Data Loader (Local-First)
// ============================================================

const MonsterAPI = (() => {
    const BASE = 'https://www.dnd5eapi.co';
    const LIST_URL = `${BASE}/api/2014/monsters`;
    const CONCURRENCY = 10;

    // --- Dynamic Config ---
    let config = { monsterOverrides: {} };
    let currentExpansionId = '';

    const setExpansion = (id) => {
        currentExpansionId = id;
    };

    const fetchConfig = async () => {
        try {
            const endpoint = currentExpansionId ? `/api/config?expansionId=${currentExpansionId}` : '/api/config';
            config = await ApiClient.get(endpoint);
            injectExpansionCSS(config);
        } catch (e) {
            console.error('Failed to load admin config:', e);
        }
    };

    const getConfig = () => config;

    // --- Dynamic CSS Injection for Custom Tiers ---
    const injectExpansionCSS = (cfg) => {
        const styleId = 'dynamic-expansion-styles';
        let styleTag = document.getElementById(styleId);

        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = styleId;
            document.head.appendChild(styleTag);
        }

        let cssSheet = '';

        // Inject Stage Colors if defined
        if (cfg.summonExperience) {
            if (cfg.summonExperience.bgColor) {
                document.documentElement.style.setProperty('--bg-color-override', cfg.summonExperience.bgColor);
                // Assume the altar/background uses this CSS variable. 
                // We will tie it to the main body/altar in style.css next.
            }
            if (cfg.summonExperience.auraColor) {
                document.documentElement.style.setProperty('--aura-ring-override', cfg.summonExperience.auraColor);
            }
        }

        // Inject Custom Tier Colors
        if (cfg.customTiers) {
            Object.entries(cfg.customTiers).forEach(([tierId, tierData]) => {
                const colors = tierData.colors || ['#ffd700', '#ffffff'];
                const primary = colors[0] || '#ffd700';
                const secondary = colors[1] || '#ffffff';

                cssSheet += `
                    .card--tier-${tierId} {
                        --table-color: ${primary};
                        box-shadow: 0 0 15px rgba(255, 255, 255, 0.1), inset 0 0 20px rgba(0, 0, 0, 0.5);
                    }
                    .card--tier-${tierId}::before {
                        background: linear-gradient(125deg, transparent 20%, rgba(255,255,255,0.4) 40%, rgba(255,255,255,0.5) 50%, transparent 60%);
                    }
                    /* Glow effect mapping */
                    .card-glow--${tierId} {
                        background: radial-gradient(circle, ${secondary} 0%, transparent 70%);
                    }
                `;
            });
        }

        styleTag.innerHTML = cssSheet;
    };

    // --- CR → Table Mapping ---
    const crToTable = (cr) => {
        if (cr <= 4) return 'A';
        if (cr <= 12) return 'B';
        return 'C';
    };

    // --- CR → Tier Mapping ---
    const crToTier = (cr) => {
        if (cr >= 19) return 'Z';
        if (cr >= 13) return 'S';
        if (cr >= 8) return 'A';
        if (cr >= 4) return 'B';
        if (cr >= 2) return 'C';
        if (cr >= 0.5) return 'D';
        return 'E';
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

    // --- Fetch from Backend (Expansion Aware) ---
    const loadLocal = async () => {
        // Try locale-specific monsters first (if supported by expansion)
        if (typeof I18n !== 'undefined') {
            try {
                // If expansionId is requested, we might need a localized version of that expansion.
                // For now, I18n.getMonstersPath() might still be hardcoded to monsters_game.json.
                // So we prioritize our dynamic backend API.
            } catch { /* locale file not available */ }
        }

        try {
            const endpoint = currentExpansionId ? `/api/monsters?expansionId=${currentExpansionId}` : '/api/monsters';
            const resp = await ApiClient.get(endpoint);
            if (Array.isArray(resp) && resp.length > 0) return resp;
        } catch (e) {
            console.error('Failed to load monsters from API:', e);
        }
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

        // 2.5 Ensure natural RPG sorting (Challenge Rating ASC, then Alphabetical)
        monsters.sort((a, b) => {
            const crDiff = (a.crValue || 0) - (b.crValue || 0);
            if (crDiff !== 0) return crDiff;
            return a.name.localeCompare(b.name);
        });

        // 3. Map Overrides to already-loaded local data
        return monsters.map((m, index) => {
            const override = config.monsterOverrides?.[m.id];

            // Ensure every monster has a sequential card number if not provided by the payload
            if (!m.cardNumber) {
                m.cardNumber = index + 1;
            }

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

    return { loadAll, typeEmoji, setExpansion, getConfig };
})();
