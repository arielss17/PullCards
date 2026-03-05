document.addEventListener('DOMContentLoaded', async () => {
    // Auth Guard (redirects to login if not authenticated)
    if (!AuthManager.requireAuth()) return;

    // Admin Guard (redirects to home if not admin)
    const user = AuthManager.getUser();
    if (!user || user.email !== 'arielssilva@hotmail.com' || !user.isAdmin) {
        window.location.href = '/';
        return;
    }

    // --- Tab Navigation ---
    const navItems = document.querySelectorAll('.admin-nav__item[data-tab]');
    const tabContents = document.querySelectorAll('.admin-tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.dataset.tab;

            navItems.forEach(n => n.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));

            item.classList.add('active');
            document.getElementById(`tab-${tabId}`)?.classList.add('active');
        });
    });

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
    const configExpansionSelect = document.getElementById('configExpansionSelect');
    const studioIntroText = document.getElementById('studioIntroText');
    const summonBtnD100 = document.getElementById('summonBtnD100');
    const summonSubD100 = document.getElementById('summonSubD100');
    const summonBtnD20 = document.getElementById('summonBtnD20');
    const summonSubD20 = document.getElementById('summonSubD20');
    const studioLangSelect = document.getElementById('studioLangSelect');

    // Studio Elements
    const studioExpansionSelect = document.getElementById('studioExpansionSelect');
    const studioBgColor = document.getElementById('studioBgColor');
    const studioBgColorHex = document.getElementById('studioBgColorHex');
    const studioAuraColor = document.getElementById('studioAuraColor');
    const studioAuraColorHex = document.getElementById('studioAuraColorHex');
    const studioTiersConfig = document.getElementById('studioTiersConfig');
    const btnStudioAddTier = document.getElementById('btnStudioAddTier');

    // Critical Rules inputs
    const critBaseTier = document.getElementById('critBaseTier');
    const critBaseCount = document.getElementById('critBaseCount');
    const critInnerTier = document.getElementById('critInnerTier');
    const critInnerCount = document.getElementById('critInnerCount');

    let config = { tables: {}, customTiers: {}, monsterOverrides: {}, summonExperience: {} };
    let currentExpansionId = null;
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
        renderCriticalRules();
    };

    // --- Render Studio Tiers Configuration ---
    const renderStudioTiers = () => {
        studioTiersConfig.innerHTML = '';
        Object.entries(config.customTiers).forEach(([tierId, tData]) => {
            const div = document.createElement('div');
            div.className = 'table-item';
            div.style.flexDirection = 'column';
            div.style.alignItems = 'flex-start';
            div.style.gap = '15px';

            // Extract colors safely
            const colors = tData.colors || ['#ffd700', '#ffffff'];
            const color1 = colors[0] || '#ffd700';
            const color2 = colors[1] || '#ffffff';

            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                    <div style="font-family: var(--font-display); color: var(--gold); font-size: 1.1rem;">
                        ${tData.label} <span style="font-size: 0.7rem; color: var(--text-muted);">(${tierId})</span>
                    </div>
                </div>
                <div style="display: flex; gap: 20px; flex-wrap: wrap; width: 100%;">
                    <div>
                        <span style="display: block; font-size: 0.7rem; color: var(--text-muted); margin-bottom: 4px;">Chance Base (%)</span>
                        <input type="number" min="0" max="100" step="0.1" value="${tData.rateTarget || 0}" 
                            class="admin-input" style="width: 80px;"
                            onchange="updateTierRateTarget('${tierId}', this.value)">
                    </div>
                    <div>
                        <span style="display: block; font-size: 0.7rem; color: var(--text-muted); margin-bottom: 4px;">Cor Primária (Card/Aura)</span>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <input type="color" value="${color1}" 
                                style="background: none; border: none; cursor: pointer; width: 30px; height: 30px; padding: 0;"
                                onchange="updateTierColor('${tierId}', 0, this.value)">
                        </div>
                    </div>
                    <div>
                        <span style="display: block; font-size: 0.7rem; color: var(--text-muted); margin-bottom: 4px;">Cor Secundária (Raio/Brilho)</span>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <input type="color" value="${color2}" 
                                style="background: none; border: none; cursor: pointer; width: 30px; height: 30px; padding: 0;"
                                onchange="updateTierColor('${tierId}', 1, this.value)">
                        </div>
                    </div>
                </div>
            `;
            studioTiersConfig.appendChild(div);
        });
    };

    window.updateTierRateTarget = (id, val) => { config.customTiers[id].rateTarget = parseFloat(val) || 0; };
    window.updateTierColor = (id, index, val) => {
        if (!config.customTiers[id].colors) config.customTiers[id].colors = ['#ffffff', '#ffffff'];
        config.customTiers[id].colors[index] = val;
    };

    btnStudioAddTier.addEventListener('click', () => {
        const char = prompt("Letra Identificadora da Raridade (Ex: C, B, A, S):");
        if (!char) return;
        const id = char.toUpperCase();
        if (config.customTiers[id]) { alert("Esta raridade já existe."); return; }

        config.customTiers[id] = {
            label: "Nova Raridade",
            nickname: "Incomum",
            maxD20: 5,
            rateTarget: 5.0,
            colors: ['#ffffff', '#aaaaaa']
        };
        renderTiers();
        renderStudioTiers();
    });

    // --- Render Critical Rules Configuration ---
    const renderCriticalRules = () => {
        if (!config.criticalRules) return;

        critBaseTier.innerHTML = '';
        critInnerTier.innerHTML = '';

        Object.entries(config.customTiers).forEach(([id, tData]) => {
            const opt1 = document.createElement('option');
            opt1.value = id; opt1.textContent = `${tData.label} (${tData.nickname})`;
            if (id === config.criticalRules.baseRewardTier) opt1.selected = true;
            critBaseTier.appendChild(opt1);

            const opt2 = document.createElement('option');
            opt2.value = id; opt2.textContent = `${tData.label} (${tData.nickname})`;
            if (id === config.criticalRules.innerCriticalTier) opt2.selected = true;
            critInnerTier.appendChild(opt2);
        });

        // Set Values
        critBaseCount.value = config.criticalRules.baseRewardCount || 2;
        critInnerCount.value = config.criticalRules.innerCriticalCount || 1;
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

    // --- Critical Rules Input Changes ---
    critBaseTier.addEventListener('change', (e) => config.criticalRules.baseRewardTier = e.target.value);
    critBaseCount.addEventListener('change', (e) => config.criticalRules.baseRewardCount = Math.max(1, parseInt(e.target.value) || 1));
    critInnerTier.addEventListener('change', (e) => config.criticalRules.innerCriticalTier = e.target.value);
    critInnerCount.addEventListener('change', (e) => config.criticalRules.innerCriticalCount = Math.max(1, parseInt(e.target.value) || 1));

    btnSaveConfig.addEventListener('click', async () => {
        const originalText = btnSaveConfig.innerHTML;
        btnSaveConfig.innerHTML = "⏳ Selando...";
        btnSaveConfig.style.opacity = '0.7';
        btnSaveConfig.disabled = true;

        try {
            const user = AuthManager.getUser(); // Safe because it's validated on load

            // Merging both Tabs (Config and Studio) to save at once
            if (!config.summonExperience) config.summonExperience = {};
            config.summonExperience.bgColor = studioBgColor.value;
            config.summonExperience.auraColor = studioAuraColor.value;

            const endpoint = currentExpansionId ? `/api/config?expansionId=${currentExpansionId}` : '/api/config';
            await ApiClient.post(endpoint, config);

            btnSaveConfig.innerHTML = "✅ Pactos Feitos!";
            btnSaveConfig.style.background = "#2ecc71";
            btnSaveConfig.style.color = "#000";
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

    const loadAdminConfig = async (expansionId = '') => {
        try {
            const endpoint = expansionId ? `/api/config?expansionId=${expansionId}` : '/api/config';
            config = await ApiClient.get(endpoint);

            if (!config.monsterOverrides) config.monsterOverrides = {};
            if (!config.customTiers) config.customTiers = {};
            if (!config.summonExperience) config.summonExperience = {};
            if (!config.criticalRules) {
                config.criticalRules = {
                    baseRewardTier: "S",
                    baseRewardCount: 2,
                    innerCriticalTier: "Z",
                    innerCriticalCount: 1
                };
            }

            // Backward compatibility logic (string to obj)
            const mapLocales = (val) => {
                if (typeof val === 'string') return { "pt-BR": val };
                if (!val) return {};
                return val;
            };

            config.summonExperience.introText = mapLocales(config.summonExperience.introText);
            config.summonExperience.btnD100 = mapLocales(config.summonExperience.btnD100);
            config.summonExperience.subD100 = mapLocales(config.summonExperience.subD100);
            config.summonExperience.btnD20 = mapLocales(config.summonExperience.btnD20);
            config.summonExperience.subD20 = mapLocales(config.summonExperience.subD20);

            renderStudioTexts();

            // Map colors to both the picker and text input
            const bgC = config.summonExperience.bgColor || '#050508';
            studioBgColor.value = bgC;
            studioBgColorHex.value = bgC;

            const auraC = config.summonExperience.auraColor || '#1a1a2e';
            studioAuraColor.value = auraC;
            studioAuraColorHex.value = auraC;

            currentExpansionId = expansionId;
            configExpansionSelect.value = expansionId;
            studioExpansionSelect.value = expansionId;
        } catch (e) {
            console.error("Error loading config for expansion", e);
        }

        try {
            loadingBestiary.style.display = 'block';
            monsterListings.style.display = 'none';

            MonsterAPI.setExpansion(expansionId);
            monsters = await MonsterAPI.loadAll();

            loadingBestiary.style.display = 'none';
            monsterListings.style.display = 'grid';

            filterType.innerHTML = '<option value="">Todos Tipos</option>';
            const types = [...new Set(monsters.map(m => m.type))].sort();
            types.forEach(type => {
                const opt = document.createElement('option');
                opt.value = type;
                opt.textContent = type;
                filterType.appendChild(opt);
            });

            renderTables();
            renderTiers();
            renderStudioTiers();
            renderMonsters();
        } catch (e) {
            console.error("Error loading monsters", e);
            loadingBestiary.innerHTML = "❌ Erro ao despertar bestiário.";
        }
    };

    const handleColorSync = (picker, input) => {
        picker.addEventListener('input', (e) => input.value = e.target.value);
        input.addEventListener('change', (e) => {
            if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                picker.value = e.target.value;
            } else {
                e.target.value = picker.value; // Revert if invalid
            }
        });
    };

    handleColorSync(studioBgColor, studioBgColorHex);
    handleColorSync(studioAuraColor, studioAuraColorHex);

    configExpansionSelect.addEventListener('change', (e) => loadAdminConfig(e.target.value));
    studioExpansionSelect.addEventListener('change', (e) => loadAdminConfig(e.target.value));

    // --- Studio i18n Sync ---
    const renderStudioTexts = () => {
        const lang = studioLangSelect.value || 'pt-BR';
        if (!config.summonExperience) return;

        studioIntroText.value = config.summonExperience.introText?.[lang] || '';
        summonBtnD100.value = config.summonExperience.btnD100[lang] || '';
        summonSubD100.value = config.summonExperience.subD100[lang] || '';
        summonBtnD20.value = config.summonExperience.btnD20[lang] || '';
        summonSubD20.value = config.summonExperience.subD20[lang] || '';
    };

    const bindStudioTextInput = (inputEl, stateKey) => {
        inputEl.addEventListener('input', (e) => {
            const lang = studioLangSelect.value || 'pt-BR';
            if (!config.summonExperience[stateKey]) config.summonExperience[stateKey] = {};
            config.summonExperience[stateKey][lang] = e.target.value;
        });
    };

    bindStudioTextInput(studioIntroText, 'introText');
    bindStudioTextInput(summonBtnD100, 'btnD100');
    bindStudioTextInput(summonSubD100, 'subD100');
    bindStudioTextInput(summonBtnD20, 'btnD20');
    bindStudioTextInput(summonSubD20, 'subD20');

    studioLangSelect.addEventListener('change', renderStudioTexts);

    // ============================================================
    // i18n Editor
    // ============================================================
    const i18nLangSelect = document.getElementById('i18nLangSelect');
    const i18nStats = document.getElementById('i18nStats');
    const i18nLoading = document.getElementById('i18nLoading');
    const i18nEditor = document.getElementById('i18nEditor');
    const btnSaveI18n = document.getElementById('btnSaveI18n');
    const i18nFilterBar = document.getElementById('i18nFilterBar');

    let i18nData = null;
    let i18nFilter = 'missing';
    let i18nPendingChanges = {};

    // Load available locales
    const loadLocales = async () => {
        try {
            const data = await ApiClient.get('/api/locales');
            i18nLangSelect.innerHTML = '<option value="">Selecione um idioma...</option>';
            studioLangSelect.innerHTML = '';

            data.locales.forEach(l => {
                const isPt = l === 'pt-BR';
                const label = isPt ? 'Português (BR)' : (l === 'en' ? 'English (EN)' : l);

                // Studio
                const optStudio = document.createElement('option');
                optStudio.value = l;
                optStudio.textContent = label;
                studioLangSelect.appendChild(optStudio);

                // Standard i18n Translator Tab
                if (!isPt) {
                    const opt = document.createElement('option');
                    opt.value = l;
                    opt.textContent = l;
                    i18nLangSelect.appendChild(opt);
                }
            });
            studioLangSelect.value = 'pt-BR';
        } catch (err) {
            console.error('Error loading locales:', err);
        }
    };

    // Load missing keys for selected locale
    const loadMissing = async (lang) => {
        if (!lang) {
            i18nEditor.style.display = 'none';
            i18nStats.textContent = '';
            return;
        }

        i18nLoading.style.display = 'block';
        i18nEditor.style.display = 'none';
        i18nPendingChanges = {};
        btnSaveI18n.disabled = true;

        try {
            i18nData = await ApiClient.get(`/api/locales/${lang}/missing`);

            const pct = Math.round((i18nData.translatedCount / i18nData.totalKeys) * 100);
            i18nStats.innerHTML = `<span style="color:${i18nData.missingCount > 0 ? 'var(--danger)' : 'var(--success)'}">` +
                `${i18nData.translatedCount}/${i18nData.totalKeys} traduzidas (${pct}%) — ` +
                `${i18nData.missingCount} faltante(s)</span>`;

            renderI18nEditor();
        } catch (err) {
            console.error('Error loading missing keys:', err);
            i18nStats.textContent = '❌ Erro ao carregar';
        } finally {
            i18nLoading.style.display = 'none';
        }
    };

    // Render the editor rows
    const renderI18nEditor = () => {
        if (!i18nData) return;

        const entries = i18nFilter === 'missing'
            ? Object.entries(i18nData.missing)
            : [...Object.entries(i18nData.missing), ...Object.entries(i18nData.existing)];

        if (entries.length === 0) {
            i18nEditor.innerHTML = '<p style="text-align:center; color:var(--success); padding:2rem; font-family:var(--font-medieval);">✅ Todas as strings estão traduzidas!</p>';
            i18nEditor.style.display = 'block';
            return;
        }

        let html = '<div style="display:flex; flex-direction:column; gap:6px; max-height:500px; overflow-y:auto; padding-right:8px;">';

        for (const [key, info] of entries) {
            const isMissing = key in i18nData.missing;
            const borderColor = isMissing ? 'rgba(231,76,60,0.3)' : 'rgba(201,162,39,0.1)';
            const bgColor = isMissing ? 'rgba(231,76,60,0.05)' : 'transparent';
            const badge = isMissing ? '<span style="color:var(--danger); font-size:0.65rem; font-weight:700;">⚠️ FALTA</span>' : '';

            html += `
            <div style="display:grid; grid-template-columns:200px 1fr 1fr; gap:8px; align-items:center; padding:8px 10px; border:1px solid ${borderColor}; border-radius:6px; background:${bgColor};">
                <div style="font-size:0.7rem; font-family:var(--font-display); color:var(--text-secondary); word-break:break-all;">
                    <code>${key}</code> ${badge}
                </div>
                <div style="font-size:0.75rem; color:var(--text-muted); padding:6px 8px; background:rgba(0,0,0,0.2); border-radius:4px; white-space:pre-wrap; max-height:60px; overflow-y:auto;" title="Referência (PT-BR)">
                    ${escapeHtml(info.reference)}
                </div>
                <input type="text" class="admin-input i18n-input" data-key="${key}" 
                    value="${escapeHtml(info.current || '')}" 
                    placeholder="Traduza aqui..."
                    style="font-size:0.8rem; padding:6px 8px; ${isMissing ? 'border-color:rgba(231,76,60,0.4);' : ''}">
            </div>`;
        }

        html += '</div>';
        i18nEditor.innerHTML = html;
        i18nEditor.style.display = 'block';

        // Track changes
        i18nEditor.querySelectorAll('.i18n-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const key = e.target.dataset.key;
                const original = (i18nData.existing[key]?.current || i18nData.missing[key]?.current || '');
                if (e.target.value !== original) {
                    i18nPendingChanges[key] = e.target.value;
                } else {
                    delete i18nPendingChanges[key];
                }
                btnSaveI18n.disabled = Object.keys(i18nPendingChanges).length === 0;
            });
        });
    };

    const escapeHtml = (str) => {
        if (typeof str !== 'string') return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    };

    // Save translations
    btnSaveI18n.addEventListener('click', async () => {
        const lang = i18nLangSelect.value;
        if (!lang || Object.keys(i18nPendingChanges).length === 0) return;

        btnSaveI18n.disabled = true;
        btnSaveI18n.textContent = '⏳ Selando...';

        try {
            const data = await ApiClient.put(`/api/locales/${lang}`, { translations: i18nPendingChanges });
            btnSaveI18n.textContent = `✅ ${data.keysUpdated} chaves seladas!`;
            setTimeout(() => {
                btnSaveI18n.textContent = 'SELAR TRADUÇÕES';
                loadMissing(lang); // Refresh
            }, 1500);
        } catch (err) {
            console.error('Error saving i18n:', err);
            alert(err.message || 'Erro de conexão');
            btnSaveI18n.textContent = 'SELAR TRADUÇÕES';
            btnSaveI18n.disabled = false;
        }
    });

    // Filter tabs
    i18nFilterBar.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-i18n-filter]');
        if (!btn) return;
        i18nFilterBar.querySelectorAll('.i18n-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        i18nFilter = btn.dataset.i18nFilter;
        renderI18nEditor();
    });

    // Language selector change
    i18nLangSelect.addEventListener('change', (e) => loadMissing(e.target.value));

    // --- EXPANSIONS LOGIC ---
    const loadExpansions = async () => {
        try {
            // Populate config & studio tabs dropdown
            configExpansionSelect.innerHTML = '';
            studioExpansionSelect.innerHTML = '';
            let featuredId = '';

            const list = document.getElementById('expansionsList');
            const data = await ApiClient.get('/api/expansions');

            if (list) list.innerHTML = '';

            data.forEach(exp => {
                if (exp.featured) featuredId = exp.id;

                // Add to Dropdown
                const opt1 = document.createElement('option');
                opt1.value = exp.id;
                opt1.textContent = exp.name + (exp.featured ? ' (Ativa)' : '');
                configExpansionSelect.appendChild(opt1);

                const opt2 = document.createElement('option');
                opt2.value = exp.id;
                opt2.textContent = exp.name + (exp.featured ? ' (Ativa)' : '');
                studioExpansionSelect.appendChild(opt2);

                // Add to List
                if (list) {
                    const card = document.createElement('div');
                    card.style.cssText = `display:flex; justify-content:space-between; align-items:center; padding:15px; background:rgba(255,255,255,0.03); border:1px solid rgba(201,162,39,0.2); border-radius:8px;`;
                    card.innerHTML = `
                        <div>
                            <div style="font-family:var(--font-display); font-size:1.1rem; color:var(--gold); margin-bottom:5px;">
                                ${exp.name} ${exp.featured ? '<span style="font-size:0.7rem; background:var(--gold); color:#000; padding:2px 6px; border-radius:4px; margin-left:10px;">FEATURED</span>' : ''}
                            </div>
                            <div style="font-size:0.8rem; color:var(--text-secondary);">
                                ID: <code>${exp.id}</code> | Arquivo: <code>${exp.file}</code> | Bônus: ${exp.bonusSummonsQty || 0} ${exp.loginDeadline ? `(Expira: ${new Date(exp.loginDeadline).toLocaleString('pt-BR')})` : ''}
                            </div>
                        </div>
                        <div style="display:flex; gap:10px;">
                            <button class="admin-btn btn-edit-exp" data-id="${exp.id}">Editar</button>
                            <button class="admin-btn btn-del-exp" data-id="${exp.id}" style="color:var(--danger); border-color:var(--danger);">Deletar</button>
                        </div>
                    `;
                    list.appendChild(card);
                }
            });

            if (list) {
                document.querySelectorAll('.btn-edit-exp').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const exp = data.find(e => e.id === btn.dataset.id);
                        openExpansionModal(exp);
                    });
                });

                document.querySelectorAll('.btn-del-exp').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        if (confirm('Tem certeza que deseja deletar este módulo? Isso pode corromper saves existentes se não for migrado corretamente.')) {
                            await ApiClient.delete('/api/expansions/' + btn.dataset.id);
                            loadExpansions();
                        }
                    });
                });
            }

            // After loading expansions list, load the initial Config payload for the dropdown selected match
            if (configExpansionSelect.value) {
                loadAdminConfig(configExpansionSelect.value);
            } else if (featuredId) {
                configExpansionSelect.value = featuredId;
                loadAdminConfig(featuredId);
            } else {
                loadAdminConfig();
            }

        } catch (error) {
            console.error(error);
        }
    };

    let expModal = null;
    const openExpansionModal = (exp = null) => {
        if (!expModal) {
            expModal = document.createElement('div');
            expModal.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; align-items:center; justify-content:center;';
            expModal.innerHTML = `
                <div class="admin-card" style="width:400px; max-width:90%;">
                    <h3 id="expModalTitle" class="admin-title">Nova Expansão</h3>
                    <input id="expId" class="admin-input" placeholder="ID (ex: dnd5e)" style="margin-top:10px;">
                    <input id="expName" class="admin-input" placeholder="Nome (ex: D&D 5e)" style="margin-top:10px;">
                    <input id="expFile" class="admin-input" placeholder="Arquivo (ex: monsters_dnd5e.json)" style="margin-top:10px;">
                    <label style="display:block; margin-top:10px; color:var(--text-secondary); font-size:0.8rem;">
                        <input type="checkbox" id="expFeatured"> Tornar Expansão Ativa (Featured)
                    </label>
                    <label style="display:block; margin-top:15px; color:var(--text-secondary); font-size:0.8rem;">Cartas Bônus no Login Inicial:</label>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:5px;">
                        <input id="expBonus" type="number" class="admin-input" placeholder="Bônus Inicial (ex: 5)">
                        <input id="expDeadline" type="datetime-local" class="admin-input">
                    </div>
                    
                    <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                        <button class="admin-btn" id="btnCancelExp">Cancelar</button>
                        <button class="admin-btn admin-btn--primary" id="btnSaveExp">Salvar Registro</button>
                    </div>
                </div>
            `;
            document.body.appendChild(expModal);

            document.getElementById('btnCancelExp').addEventListener('click', () => {
                expModal.style.display = 'none';
            });

            document.getElementById('btnSaveExp').addEventListener('click', async () => {
                const id = document.getElementById('expId').value;
                const name = document.getElementById('expName').value;
                const file = document.getElementById('expFile').value;
                const featured = document.getElementById('expFeatured').checked;
                const bonusSummonsQty = parseInt(document.getElementById('expBonus').value) || 0;

                let loginDeadline = document.getElementById('expDeadline').value;
                if (loginDeadline) {
                    loginDeadline = new Date(loginDeadline).toISOString();
                } else {
                    loginDeadline = null;
                }

                try {
                    await ApiClient.post('/api/expansions', { id, name, file, featured, bonusSummonsQty, loginDeadline });
                    expModal.style.display = 'none';
                    loadExpansions();
                } catch (e) {
                    alert(e.message);
                }
            });
        }

        document.getElementById('expModalTitle').textContent = exp ? "Editar Expansão" : "Nova Expansão";
        document.getElementById('expId').value = exp ? exp.id : "";
        document.getElementById('expId').disabled = !!exp; // Block ID changes for safety
        document.getElementById('expName').value = exp ? exp.name : "";
        document.getElementById('expFile').value = exp ? exp.file : "";
        document.getElementById('expFeatured').checked = exp ? exp.featured : false;
        document.getElementById('expBonus').value = exp ? (exp.bonusSummonsQty || 0) : "";

        let localDeadline = "";
        if (exp && exp.loginDeadline) {
            // Need to convert ISO string to YYYY-MM-DDThh:mm for datetime-local
            const d = new Date(exp.loginDeadline);
            // shift timezone offset
            const offset = d.getTimezoneOffset() * 60000;
            localDeadline = (new Date(d - offset)).toISOString().slice(0, 16);
        }
        document.getElementById('expDeadline').value = localDeadline;

        expModal.style.display = 'flex';
    };

    document.getElementById('btnNewExpansion')?.addEventListener('click', () => openExpansionModal(null));

    // Initialize
    loadLocales();
    loadExpansions();
});
