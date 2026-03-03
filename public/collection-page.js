// ============================================================
// PullCards - Collection Showcase Page Logic
// Shows all creatures: owned (colored + qty) vs unowned (grayscale)
// ============================================================

(async () => {
    // --- i18n ---
    const lang = await I18n.init();
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.value = lang;
        langSelect.addEventListener('change', async (e) => {
            await I18n.setLang(e.target.value);
            // Optional: redesenhar a página se necessário, 
            // mas o applyToDOM do I18n já cuida dos [data-i18n]
        });
    }

    // --- Auth Guard ---
    if (!AuthManager.requireAuth()) return;

    const grid = document.getElementById('colGrid');
    const loading = document.getElementById('colLoading');
    const emptyState = document.getElementById('colEmpty');
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    const filterBar = document.getElementById('filterBar');
    const userInfo = document.getElementById('userInfo');

    // --- Auth Check ---
    const user = AuthManager.getUser();
    let adminLink = '';
    if (user && user.isAdmin && user.email === 'arielssilva@hotmail.com') {
        adminLink = `<a href="/admin.html" style="color:var(--text-secondary); text-decoration:none; font-size:0.8rem; margin-right: 8px;">⚙️ Admin</a>`;
    }
    userInfo.innerHTML = `${adminLink}<a href="/profile.html" style="color:var(--text-secondary); text-decoration:none; font-size:0.8rem;">🧙 ${user.name}</a> <a href="#" onclick="AuthManager.logout(); return false;" style="color:var(--text-muted); font-size:0.7rem; margin-left:6px; text-decoration:underline;">sair</a>`;

    // --- Load Data ---
    let allMonsters = [];
    let userCollection = { cards: {} };
    let gameConfig = {};

    try {
        await I18n.init();
        allMonsters = await MonsterAPI.loadAll();

        try {
            gameConfig = await ApiClient.get('/api/config');
        } catch (e) {
            console.warn('Could not load config', e);
        }

        if (user) {
            userCollection = await ApiClient.get(`/api/collection/${user.id}`);
        }
    } catch (e) {
        console.error('Failed to load data:', e);
    }

    // --- Stats ---
    const ownedIds = new Set(Object.keys(userCollection.cards || {}));
    const totalCreatures = allMonsters.length;
    const totalOwned = ownedIds.size;
    const pct = totalCreatures > 0 ? Math.round((totalOwned / totalCreatures) * 100) : 0;

    progressText.innerHTML = `<strong>${totalOwned}</strong> / ${totalCreatures} — ${I18n.t('collection.progress', { owned: totalOwned, total: totalCreatures, percent: pct })}`;
    progressFill.style.width = `${pct}%`;

    // --- Render Tier Filter Buttons ---
    const renderTierFilters = () => {
        const config = gameConfig;
        if (!config || !config.customTiers) return;

        // Keep 'Todas', 'Possuídas', 'Faltando'
        const baseFilters = `
            <button class="col-filter-btn active" data-filter="all">Todas</button>
            <button class="col-filter-btn" data-filter="owned">Possuídas</button>
            <button class="col-filter-btn" data-filter="missing">Faltando</button>
        `;

        const tierFilters = Object.entries(config.customTiers).map(([id, tData]) => {
            return `<button class="col-filter-btn" data-filter="${id}">${tData.nickname || tData.label}</button>`;
        }).join('');

        filterBar.innerHTML = baseFilters + tierFilters;
    };

    // --- Render Grid ---
    const renderCards = (filter = 'all') => {
        grid.innerHTML = '';
        const config = gameConfig;
        const customTiers = config?.customTiers || {};

        const filtered = allMonsters.filter(m => {
            const owned = ownedIds.has(m.id);
            if (filter === 'owned') return owned;
            if (filter === 'missing') return !owned;

            // If it's a specific Tier ID
            if (customTiers[filter]) return m.tier === filter;

            return true;
        });
        if (filtered.length === 0) {
            grid.innerHTML = '<div class="col-empty" style="grid-column: 1/-1;"><span class="col-empty__icon">🔍</span><p class="col-empty__text">Nenhuma criatura encontrada com este filtro.</p></div>';
            return;
        }

        // Sort: numerical order (cardNumber) or fallback to name
        filtered.sort((a, b) => {
            const numA = parseInt(a.cardNumber) || 9999;
            const numB = parseInt(b.cardNumber) || 9999;
            if (numA !== numB) return numA - numB;
            return a.name.localeCompare(b.name);
        });

        for (const monster of filtered) {
            const owned = ownedIds.has(monster.id);
            const cardData = userCollection.cards[monster.id];
            const qty = cardData?.quantity || 0;
            const tier = cardData?.tier || monster.tier || 'C';
            const tData = customTiers[tier] || { label: tier, nickname: tier };
            const imgSrc = monster.image || monster.imageUrl || `https://robohash.org/${monster.id}?set=set2`;
            // Format card number as 3 digits (e.g. 001)
            const cardNumStr = monster.cardNumber ? String(monster.cardNumber).padStart(3, '0') : '???';

            const wrapper = document.createElement('div');
            wrapper.className = 'col-card-wrapper';

            if (owned) {
                // Determine CSS classes for glow/effects based on tier
                let isFoil = tier === 'S' || tier === 'Z';
                let specialClass = config.specialEffects?.[tier] || '';

                // Parse specific stats
                const crLabel = monster.cr ?? '?';
                const hp = monster.hp ?? '?';
                const ac = monster.armorClass ?? monster.ac ?? '?';
                const typeName = monster.type || '???';

                const s = monster.stats || {};
                const statCells = ['str', 'dex', 'con', 'int', 'wis', 'cha'].map(k => {
                    const st = s[k] || { score: 10, modifier: '+0' };
                    return `<div class="stat-cell">
                    <span class="stat-label">${k.toUpperCase()}</span>
                    <span class="stat-value">${st.score}</span>
                    <span class="stat-mod">${st.modifier}</span>
                  </div>`;
                }).join('');

                // Full Size TCG Card (Same structure as ritual)
                // We add "flipped" by default so it shows the front face.
                wrapper.innerHTML = `
                    <div class="card card--tier-${tier} ${isFoil ? 'card--foil' : ''} ${specialClass} flipped">
                      <div class="card__face card__back">
                        <div class="card__back-pattern">
                          <span class="card__back-symbol">🂠</span>
                        </div>
                      </div>
                      <div class="card__face card__front">
                        <div class="char-card-inner">
                          <div class="combat-card-header">
                            <div class="card-hp-badge">${hp}</div>
                            <div class="card-name-block">
                              <span class="card-name">${monster.name}</span>
                              <span class="card-subtitle">${typeName}</span>
                            </div>
                            <div class="cr-badge"><span class="cr-value">${crLabel}</span></div>
                          </div>
                          <div class="char-image-wrapper">
                            <img src="${imgSrc}" class="char-image-fallback" alt="${monster.name}" loading="lazy">
                            <div class="ca-badge">
                              <span class="ca-label">CA</span>
                              <span class="ca-value">${ac}</span>
                            </div>
                          </div>
                          <div class="rune-border"></div>
                          <div class="stats-row">${statCells}</div>
                        </div>
                      </div>
                    </div>
                    <div class="qty-badge">x${qty}</div>
                `;

                // Add click listener for modal
                wrapper.addEventListener('click', () => openModal(monster, cardData, wrapper.innerHTML, cardNumStr));
            } else {
                // Missing Card Frame
                wrapper.innerHTML = `
                    <div class="card-missing">
                        <span class="card-missing__number">${cardNumStr}</span>
                    </div>
                `;
            }

            grid.appendChild(wrapper);
        }
    };

    // --- Modal Logic ---
    const overlay = document.getElementById('cardOverlay');
    const closeBtn = document.getElementById('overlayClose');
    const mContainer = document.getElementById('modalCardContainer');
    const mTitle = document.getElementById('modalTitle');
    const mSub = document.getElementById('modalSubtitle');
    const mFooter = document.getElementById('modalFooter');

    const openModal = (monster, cardData, htmlContent, cardNumStr) => {
        // Strip out the quantity badge from the HTML for the modal view
        const cleanHtml = htmlContent.replace(/<div class="qty-badge".*?<\/div>/, '');
        mContainer.innerHTML = cleanHtml;

        mTitle.textContent = monster.name;
        mSub.textContent = `#${cardNumStr} • CR ${monster.cr ?? '?'} • ${monster.type || 'Desconhecido'}`;

        // Format Date
        let dateStr = 'Data desconhecida';
        if (cardData && cardData.firstObtained) {
            dateStr = new Date(cardData.firstObtained).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });
        }
        mFooter.textContent = `Invocado pela primeira vez em: ${dateStr}`;

        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    };

    const closeModal = () => {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => mContainer.innerHTML = '', 300); // Clear after animation
    };

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    renderTierFilters();
    renderCards();

    // --- Hide Loading, Show Grid ---
    loading.style.display = 'none';

    if (!user) {
        emptyState.style.display = 'block';
    } else {
        grid.style.display = 'grid';
    }

    // --- Filters ---
    filterBar.addEventListener('click', (e) => {
        const btn = e.target.closest('.col-filter-btn');
        if (!btn) return;

        filterBar.querySelectorAll('.col-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        renderCards(btn.dataset.filter);
    });
})();
