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
    const loadingBestiary = document.getElementById('loadingBestiary');

    // Critical Rules inputs
    const critBaseTier = document.getElementById('critBaseTier');
    const critBaseCount = document.getElementById('critBaseCount');
    const critInnerTier = document.getElementById('critInnerTier');
    const critInnerCount = document.getElementById('critInnerCount');

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
        renderCriticalRules();
    };

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

            await ApiClient.post('/api/config', config);
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

    try {
        config = await ApiClient.get('/api/config');
        if (!config.monsterOverrides) config.monsterOverrides = {};
        if (!config.customTiers) config.customTiers = {};
        if (!config.criticalRules) {
            config.criticalRules = {
                baseRewardTier: "S",
                baseRewardCount: 2,
                innerCriticalTier: "Z",
                innerCriticalCount: 1
            };
        }
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
            data.locales
                .filter(l => l !== 'pt-BR')
                .forEach(l => {
                    const opt = document.createElement('option');
                    opt.value = l;
                    opt.textContent = l;
                    i18nLangSelect.appendChild(opt);
                });
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

    // Initialize
    loadLocales();
});
