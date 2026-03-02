document.addEventListener('DOMContentLoaded', async () => {
    const tablesContainer = document.getElementById('tablesConfig');
    const monsterListings = document.getElementById('monsterListings');
    const btnSave = document.getElementById('btnSaveConfig');
    const searchInput = document.getElementById('monsterSearch');
    const btnAddTable = document.getElementById('btnAddTable');
    const loadingBestiary = document.getElementById('loadingBestiary');

    let config = { tables: {}, monsterOverrides: {} };
    let monsters = [];

    // Init I18n
    await I18n.init();

    // Fetch Config
    try {
        const res = await fetch('/api/config');
        if (res.ok) config = await res.json();
        if (!config.monsterOverrides) config.monsterOverrides = {};
    } catch (e) {
        console.error("Error loading config", e);
    }

    // Fetch Monsters
    try {
        monsters = await MonsterAPI.loadAll();
        loadingBestiary.style.display = 'none';
        monsterListings.style.display = 'grid';
    } catch (e) {
        console.error("Error loading monsters", e);
        loadingBestiary.innerHTML = "❌ Erro ao despertar bestiário.";
    }

    // --- Create/Delete Tables ---
    btnAddTable.addEventListener('click', (e) => {
        e.preventDefault();
        const tableName = prompt("Nome da nova Mesa (Ex: Swamp, D, S):");
        if (!tableName) return;
        if (config.tables[tableName]) {
            alert("Mesa já existe!"); return;
        }
        config.tables[tableName] = { maxD100: 100 };
        renderTables();
        renderMonsters(searchInput.value);
    });

    window.deleteTable = (tableName) => {
        if (!confirm(`Destruir Mesa ${tableName}?`)) return;
        delete config.tables[tableName];
        // Clean up from overrides
        Object.values(config.monsterOverrides).forEach(override => {
            if (override.tables) {
                override.tables = override.tables.filter(t => t !== tableName);
            }
        });
        renderTables();
        renderMonsters(searchInput.value);
    };

    // --- Render Tables Configuration ---
    const renderTables = () => {
        tablesContainer.innerHTML = '';
        Object.entries(config.tables).sort((a, b) => a[1].maxD100 - b[1].maxD100).forEach(([tableName, tData]) => {
            const div = document.createElement('div');
            div.className = 'table-item';
            div.innerHTML = `
                <div>
                    <h4>${tableName}</h4>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">Max d100:</span>
                    <input type="number" min="1" max="100" value="${tData.maxD100}" 
                        class="admin-input" style="width: 70px; display: inline-block; padding: 0.2rem 0.5rem;"
                        onchange="updateTableConfig('${tableName}', this.value)">
                </div>
                <button class="admin-btn admin-btn--danger" onclick="deleteTable('${tableName}')" style="font-size: 0.8rem;">X</button>
            `;
            tablesContainer.appendChild(div);
        });
    };

    window.updateTableConfig = (tableName, val) => {
        if (config.tables[tableName]) {
            config.tables[tableName].maxD100 = parseInt(val, 10);
            renderTables(); // re-sort
        }
    };

    // --- Render Monsters ---
    const renderMonsters = (filter = '') => {
        monsterListings.innerHTML = '';
        const lowerFilter = filter.toLowerCase();
        const frag = document.createDocumentFragment();

        const activeTableNames = Object.keys(config.tables);

        monsters.forEach(m => {
            if (filter) {
                const searchStr = `${m.name} ${m.type}`.toLowerCase();
                if (!searchStr.includes(lowerFilter)) return;
            }

            const card = document.createElement('div');
            card.className = 'monster-card';

            // Standardize image url because API maps it differently than local dumps sometimes
            const monsterImage = m.image || m.imageUrl || 'https://via.placeholder.com/48?text=?';

            const override = config.monsterOverrides[m.id] || {};
            // current tables: override if exists, else what api.js defaulted
            const activeTablesForMonster = override.tables || m.tables || [m.table];
            const activeTierForMonster = override.tier || m.tier;

            const checkboxesHtml = activeTableNames.map(tName => {
                const isChecked = activeTablesForMonster.includes(tName);
                return `
                    <label class="chip-label">
                        <input type="checkbox" onchange="toggleMonsterTable('${m.id}', '${tName}', this.checked)" ${isChecked ? 'checked' : ''}>
                        ${tName}
                    </label>
                `;
            }).join('');

            card.innerHTML = `
                <div class="monster-header">
                    <img src="${monsterImage}" class="monster-avatar" alt="${m.name}">
                    <div>
                        <h3 class="monster-title">${m.name}</h3>
                        <p class="monster-subtitle">${m.typeEmoji} ${m.type} • CR ${m.cr ?? '?'}</p>
                    </div>
                </div>
                
                <div class="monster-options">
                    <label>Tier Global:</label>
                    <select class="admin-input" onchange="updateMonsterTier('${m.id}', this.value)">
                        <option value="C" ${activeTierForMonster === 'C' ? 'selected' : ''}>Tier C (Common)</option>
                        <option value="B" ${activeTierForMonster === 'B' ? 'selected' : ''}>Tier B (Uncommon)</option>
                        <option value="A" ${activeTierForMonster === 'A' ? 'selected' : ''}>Tier A (Rare)</option>
                        <option value="S" ${activeTierForMonster === 'S' ? 'selected' : ''}>Tier S (Legendary)</option>
                    </select>
                </div>

                <div class="monster-options">
                    <label>Habita as Mesas:</label>
                    <div class="table-chips">
                        ${checkboxesHtml}
                    </div>
                </div>
            `;
            frag.appendChild(card);
        });

        monsterListings.appendChild(frag);
    };

    window.toggleMonsterTable = (id, tableName, isChecked) => {
        if (!config.monsterOverrides[id]) config.monsterOverrides[id] = {};
        let currentTables = config.monsterOverrides[id].tables || [];

        // If they had no override before, we should start from their base tables
        if (!config.monsterOverrides[id].tables) {
            const baseM = monsters.find(m => m.id === id);
            currentTables = baseM.tables || [baseM.table];
        }

        if (isChecked) {
            if (!currentTables.includes(tableName)) currentTables.push(tableName);
        } else {
            currentTables = currentTables.filter(t => t !== tableName);
        }

        config.monsterOverrides[id].tables = currentTables;
        cleanUpOverride(id);
    };

    window.updateMonsterTier = (id, val) => {
        if (!config.monsterOverrides[id]) config.monsterOverrides[id] = {};
        config.monsterOverrides[id].tier = val;
        cleanUpOverride(id);
    };

    const cleanUpOverride = (id) => {
        const o = config.monsterOverrides[id];
        if (!o) return;
        // if everything matches default, we could delete it, but keeping it explicit is safer for now.
        if (o.tables && o.tables.length === 0) {
            delete o.tables; // don't allow empty, meaning it won't be summoned anywhere unless explicit
        }
    };

    // Debounce search
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            renderMonsters(e.target.value);
        }, 300);
    });

    btnSave.addEventListener('click', async () => {
        const originalText = btnSave.innerHTML;
        btnSave.innerHTML = "⏳ Selando...";
        btnSave.style.opacity = '0.7';
        btnSave.disabled = true;

        try {
            const res = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (res.ok) {
                btnSave.innerHTML = "✅ Pactos Feitos!";
                btnSave.style.background = "#2ecc71";
                btnSave.style.color = "#000";
            } else {
                alert("Falha arcana. Verifique o servidor.");
                btnSave.innerHTML = "❌ Falha";
            }
        } catch (e) {
            console.error(e);
            alert("A conexão com o cofre foi perdida.");
            btnSave.innerHTML = "❌ Erro Connect";
        }

        setTimeout(() => {
            btnSave.innerHTML = originalText;
            btnSave.style.background = "";
            btnSave.style.color = "";
            btnSave.style.opacity = '1';
            btnSave.disabled = false;
        }, 2500);
    });

    // Initial renders
    renderTables();
});
