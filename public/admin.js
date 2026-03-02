document.addEventListener('DOMContentLoaded', async () => {
    if (typeof AuthManager !== 'undefined') {
        const user = AuthManager.getUser();
        if (!user || user.email !== 'arielssilva@hotmail.com' || !user.isAdmin) {
            window.location.href = '/';
            return;
        }
    }

    const tablesConfig = document.getElementById('tablesConfig');
    const tiersConfig = document.getElementById('tiersConfig');
    const monsterListings = document.getElementById('monsterListings');
    const btnSaveConfig = document.getElementById('btnSaveConfig');
    const searchInput = document.getElementById('monsterSearch');
    const filterTier = document.getElementById('filterTier');
    const filterType = document.getElementById('filterType');
    const filterTable = document.getElementById('filterTable');
    const sortConfig = document.getElementById('sortConfig');
    const btnAddTable = document.getElementById('btnAddTable');
    const btnAddTier = document.getElementById('btnAddTier');
    const loadingBestiary = document.getElementById('loadingBestiary');

    let config = { tables: {}, customTiers: {}, monsterOverrides: {} };
    let monsters = [];

    // --- Helper: Populate Tables Filter ---
    const populateTableFilter = () => {
        const currentVal = filterTable.value;
        filterTable.innerHTML = '<option value="">Todas as Mesas</option>';
        Object.keys(config.tables).sort().forEach(tName => {
            const opt = document.createElement('option');
            opt.value = tName;
            opt.textContent = tName;
            if (tName === currentVal) opt.selected = true;
            filterTable.appendChild(opt);
        });
    };

    // --- Helper: Populate Tier Filter ---
    const populateTierFilter = () => {
        const currentVal = filterTier.value;
        filterTier.innerHTML = '<option value="">Todas as Raridades</option>';
        Object.entries(config.customTiers).forEach(([id, tData]) => {
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = `${tData.label} (${tData.nickname})`;
            if (id === currentVal) opt.selected = true;
            filterTier.appendChild(opt);
        });
    };

    // --- Helper: Clean up Monster Overrides ---
    const cleanUpOverride = (id) => {
        const o = config.monsterOverrides[id];
        if (!o) return;
        if (o.tables && o.tables.length === 0) {
            delete o.tables;
        }
    };

    // --- Render Tables Configuration ---
    const renderTables = () => {
        tablesConfig.innerHTML = '';
        Object.entries(config.tables).sort((a, b) => a[1].maxD100 - b[1].maxD100).forEach(([tableName, tData]) => {
            const div = document.createElement('div');
            div.className = 'table-item';
            div.innerHTML = `
                <div style="flex: 1;">
                    <input type="text" value="${tableName}" 
                        class="admin-input-inline" 
                        onchange="updateTableName('${tableName}', this.value)"
                        onkeydown="if(event.key==='Enter') this.blur(); if(event.key==='Escape') { this.value='${tableName}'; this.blur(); }"
                        title="Clique para renomear">
                    <div style="margin-top: 5px;">
                        <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Max d100:</span>
                        <input type="number" min="1" max="100" value="${tData.maxD100}" 
                            class="admin-input" style="width: 60px; height: 24px; padding: 2px 5px; font-size: 0.8rem;"
                            onchange="updateTableConfig('${tableName}', this.value)">
                    </div>
                </div>
                <button class="admin-btn admin-btn--danger" onclick="deleteTable('${tableName}')" style="font-size: 0.7rem; padding: 4px 8px;">X</button>
            `;
            tablesConfig.appendChild(div);
        });
        populateTableFilter();
    };

    // --- Render Tiers Configuration ---
    const renderTiers = () => {
        tiersConfig.innerHTML = '';
        Object.entries(config.customTiers).forEach(([tierId, tData]) => {
            const div = document.createElement('div');
            div.className = 'tier-item';
            div.innerHTML = `
                <div class="tier-inputs">
                    <div>
                        <span class="tier-label">ID:</span>
                        <input type="text" value="${tData.label}" 
                            class="admin-input-inline" style="width: auto; font-size: 0.9rem;"
                            onchange="updateTierLabel('${tierId}', this.value)">
                    </div>
                    <div>
                        <span class="tier-label">Nickname:</span>
                        <input type="text" value="${tData.nickname}" 
                            class="admin-input-inline" style="width: auto; font-size: 0.8rem; color: var(--text-secondary);"
                            onchange="updateTierNickname('${tierId}', this.value)">
                    </div>
                </div>
                <div class="tier-range-config" style="margin-left: 10px; display: flex; align-items: center; gap: 5px;">
                    <span class="tier-label" style="font-size: 0.7rem;">Max d20:</span>
                    <input type="number" min="1" max="20" value="${tData.maxD20 || 0}" 
                        class="admin-input" style="width: 50px; height: 24px; padding: 2px 5px; font-size: 0.8rem;"
                        onchange="updateTierMaxD20('${tierId}', this.value)">
                </div>
                <button class="admin-btn admin-btn--danger" onclick="deleteTier('${tierId}')" style="font-size: 0.7rem; padding: 4px 8px; margin-left: auto;">X</button>
            `;
            tiersConfig.appendChild(div);
        });
        populateTierFilter();
    };

    // --- Table Renaming Logic ---
    window.updateTableName = (oldName, newName) => {
        newName = newName.trim();
        if (!newName) { renderTables(); return; }
        if (newName === oldName) return;
        if (config.tables[newName]) { alert("Mesa duplicada!"); renderTables(); return; }

        config.tables[newName] = config.tables[oldName];
        delete config.tables[oldName];

        Object.values(config.monsterOverrides).forEach(o => {
            if (o.tables) o.tables = o.tables.map(t => t === oldName ? newName : t);
        });

        renderTables();
        renderMonsters();
    };

    // --- Tier Logic ---
    window.updateTierLabel = (id, val) => {
        if (config.customTiers[id]) {
            config.customTiers[id].label = val.trim() || config.customTiers[id].label;
            renderTiers();
            renderMonsters();
        }
    };

    window.updateTierNickname = (id, val) => {
        if (config.customTiers[id]) {
            config.customTiers[id].nickname = val.trim() || config.customTiers[id].nickname;
            renderTiers();
            renderMonsters();
        }
    };

    window.updateTierMaxD20 = (id, val) => {
        if (config.customTiers[id]) {
            config.customTiers[id].maxD20 = parseInt(val) || 0;
            renderTiers();
            renderMonsters();
        }
    };

    window.deleteTier = (id) => {
        if (Object.keys(config.customTiers).length <= 1) {
            alert("Deve haver pelo menos um Tier.");
            return;
        }
        if (!confirm(`Destruir Tier [${config.customTiers[id].label}]? Monstros vinculados voltarão ao padrão.`)) return;

        delete config.customTiers[id];
        // Clean up monster overrides for tier
        Object.values(config.monsterOverrides).forEach(o => {
            if (o.tier === id) delete o.tier;
        });

        renderTiers();
        renderMonsters();
    };

    // --- Render Monsters ---
    const renderMonsters = () => {
        monsterListings.innerHTML = '';
        const lowerFilter = searchInput.value.toLowerCase();
        const tierFilter = filterTier.value;
        const typeFilter = filterType.value;
        const tableFilterVal = filterTable.value;
        const sortBy = sortConfig.value;

        const frag = document.createDocumentFragment();
        const activeTableNames = Object.keys(config.tables);

        // Filter and Sort
        let filteredMonsters = monsters.filter(m => {
            const override = config.monsterOverrides[m.id] || {};

            // Search Text
            if (lowerFilter) {
                const searchStr = `${m.name} ${m.type}`.toLowerCase();
                if (!searchStr.includes(lowerFilter)) return false;
            }
            // Tier
            const tier = override.tier || m.tier;
            if (tierFilter && tier !== tierFilter) return false;
            // Type
            if (typeFilter && m.type !== typeFilter) return false;
            // Table
            if (tableFilterVal) {
                const monsterTables = override.tables || m.tables || [m.table];
                if (!monsterTables.includes(tableFilterVal)) return false;
            }

            return true;
        });

        // Sort
        filteredMonsters.sort((a, b) => {
            if (sortBy === 'crDes') {
                const crDiff = (b.crValue || 0) - (a.crValue || 0);
                if (crDiff !== 0) return crDiff;
                return a.name.localeCompare(b.name);
            }
            if (sortBy === 'crAsc') {
                const crDiff = (a.crValue || 0) - (b.crValue || 0);
                if (crDiff !== 0) return crDiff;
                return a.name.localeCompare(b.name);
            }
            if (sortBy === 'nameAsc') return a.name.localeCompare(b.name);
            if (sortBy === 'typeAsc') return a.type.localeCompare(b.type);
            return 0;
        });

        filteredMonsters.forEach(m => {
            const card = document.createElement('div');
            card.className = 'monster-card';

            const monsterImage = m.image || m.imageUrl || 'https://via.placeholder.com/48?text=?';
            const override = config.monsterOverrides[m.id] || {};
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

            const tierOptionsHtml = Object.entries(config.customTiers).map(([id, tData]) => {
                return `<option value="${id}" ${activeTierForMonster === id ? 'selected' : ''}>${tData.label} (${tData.nickname})</option>`;
            }).join('');

            card.innerHTML = `
                <div class="monster-header">
                    <img src="${monsterImage}" class="monster-avatar" alt="${m.name}" loading="lazy">
                    <div>
                        <h3 class="monster-title">${m.name}</h3>
                        <p class="monster-subtitle">${m.typeEmoji || ''} ${m.type} • CR ${m.cr ?? '?'}</p>
                    </div>
                </div>
                
                <div class="monster-options">
                    <label>Tier Global:</label>
                    <select class="admin-input" onchange="updateMonsterTier('${m.id}', this.value)">
                        ${tierOptionsHtml}
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

    // --- Global Handlers (onchange) ---
    window.updateTableConfig = (tableName, val) => {
        if (config.tables[tableName]) {
            config.tables[tableName].maxD100 = parseInt(val, 10);
            renderTables();
        }
    };

    window.toggleMonsterTable = (id, tableName, isChecked) => {
        if (!config.monsterOverrides[id]) config.monsterOverrides[id] = {};
        let currentTables = config.monsterOverrides[id].tables || [];

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

    window.deleteTable = (tableName) => {
        if (!confirm(`Destruir Mesa ${tableName}?`)) return;
        delete config.tables[tableName];
        Object.values(config.monsterOverrides).forEach(override => {
            if (override.tables) {
                override.tables = override.tables.filter(t => t !== tableName);
            }
        });
        renderTables();
        renderMonsters();
    };

    // --- Event Listeners ---
    let searchTimeout;
    const triggerRender = () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => renderMonsters(), 300);
    };

    searchInput.addEventListener('input', triggerRender);
    filterTier.addEventListener('change', () => renderMonsters());
    filterType.addEventListener('change', () => renderMonsters());
    filterTable.addEventListener('change', () => renderMonsters());
    sortConfig.addEventListener('change', () => renderMonsters());

    btnAddTable.addEventListener('click', (e) => {
        e.preventDefault();
        const tableName = prompt("Nome da nova Mesa:");
        if (!tableName) return;
        const normalized = tableName.trim();
        if (config.tables[normalized] || !normalized) return;
        config.tables[normalized] = { maxD100: 100 };
        renderTables();
        renderMonsters();
    });

    btnAddTier.addEventListener('click', (e) => {
        e.preventDefault();
        const tierId = prompt("ID abreviado do Tier (Ex: S, A, X):");
        if (!tierId) return;
        const id = tierId.trim().toUpperCase();
        if (config.customTiers[id] || !id) return;
        config.customTiers[id] = { label: `TIER ${id}`, nickname: "Novo Nível" };
        renderTiers();
        renderMonsters();
    });

    btnSaveConfig.addEventListener('click', async () => {
        const originalText = btnSaveConfig.innerHTML;
        btnSaveConfig.innerHTML = "⏳ Selando...";
        btnSaveConfig.style.opacity = '0.7';
        btnSaveConfig.disabled = true;

        try {
            const user = AuthManager.getUser(); // Safe because it's validated on load

            const res = await fetch('/api/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': user.email
                },
                body: JSON.stringify(config)
            });

            if (res.ok) {
                btnSaveConfig.innerHTML = "✅ Pactos Feitos!";
                btnSaveConfig.style.background = "#2ecc71";
                btnSaveConfig.style.color = "#000";
            } else {
                alert("Falha arcana. Verifique o servidor.");
                btnSaveConfig.innerHTML = "❌ Falha";
            }
        } catch (e) {
            console.error(e);
            alert("A conexão com o cofre foi perdida.");
            btnSaveConfig.innerHTML = "❌ Erro Connect";
        }

        setTimeout(() => {
            btnSaveConfig.innerHTML = originalText;
            btnSaveConfig.style.background = "";
            btnSaveConfig.style.color = "";
            btnSaveConfig.style.opacity = '1';
            btnSaveConfig.disabled = false;
        }, 2500);
    });

    await I18n.init();

    try {
        const res = await fetch('/api/config');
        if (res.ok) config = await res.json();
        if (!config.monsterOverrides) config.monsterOverrides = {};
        if (!config.customTiers) config.customTiers = {};
    } catch (e) {
        console.error("Error loading config", e);
    }

    try {
        monsters = await MonsterAPI.loadAll();
        loadingBestiary.style.display = 'none';
        monsterListings.style.display = 'grid';

        const types = [...new Set(monsters.map(m => m.type))].sort();
        types.forEach(type => {
            const opt = document.createElement('option');
            opt.value = type;
            opt.textContent = type;
            filterType.appendChild(opt);
        });

        renderTables();
        renderTiers();
        renderMonsters();
    } catch (e) {
        console.error("Error loading monsters", e);
        loadingBestiary.innerHTML = "❌ Erro ao despertar bestiário.";
    }
});
