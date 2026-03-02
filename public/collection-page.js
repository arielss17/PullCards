// ============================================================
// PullCards - Collection Showcase Page Logic
// Shows all creatures: owned (colored + qty) vs unowned (grayscale)
// ============================================================

(async () => {
    const grid = document.getElementById('colGrid');
    const loading = document.getElementById('colLoading');
    const emptyState = document.getElementById('colEmpty');
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    const filterBar = document.getElementById('filterBar');
    const userInfo = document.getElementById('userInfo');

    // --- Auth Check ---
    const user = AuthManager.getUser();
    if (user) {
        let adminLink = '';
        if (user.isAdmin) {
            adminLink = `<a href="/admin.html" style="color:var(--text-secondary); text-decoration:none; font-size:0.8rem; margin-right: 8px;">⚙️ Admin</a>`;
        }
        userInfo.innerHTML = `${adminLink}🧙 ${user.name} <a href="#" onclick="AuthManager.logout(); return false;" style="color:var(--text-muted); font-size:0.7rem; margin-left:6px; text-decoration:underline;">sair</a>`;
    } else {
        userInfo.innerHTML = '<a href="/auth.html" style="color: var(--gold); text-decoration: none;">Entrar</a>';
    }

    // --- Load Data ---
    let allMonsters = [];
    let userCollection = { cards: {} };

    try {
        await I18n.init();
        allMonsters = await MonsterAPI.loadAll();

        if (user) {
            const res = await fetch(`/api/collection/${user.id}`);
            if (res.ok) {
                userCollection = await res.json();
            }
        }
    } catch (e) {
        console.error('Failed to load data:', e);
    }

    // --- Stats ---
    const ownedIds = new Set(Object.keys(userCollection.cards || {}));
    const totalCreatures = allMonsters.length;
    const totalOwned = ownedIds.size;
    const pct = totalCreatures > 0 ? Math.round((totalOwned / totalCreatures) * 100) : 0;

    progressText.innerHTML = `<strong>${totalOwned}</strong> / ${totalCreatures} criaturas descobertas (${pct}%)`;
    progressFill.style.width = `${pct}%`;

    // --- Render Tier Filter Buttons ---
    const renderTierFilters = () => {
        const config = SummonEngine.getConfig();
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
        const config = SummonEngine.getConfig();
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

        // Sort: owned first (by qty desc), then unowned (alphabetical)
        filtered.sort((a, b) => {
            const aOwned = ownedIds.has(a.id) ? 1 : 0;
            const bOwned = ownedIds.has(b.id) ? 1 : 0;
            if (aOwned !== bOwned) return bOwned - aOwned;
            if (aOwned && bOwned) {
                const aQty = userCollection.cards[a.id]?.quantity || 0;
                const bQty = userCollection.cards[b.id]?.quantity || 0;
                return bQty - aQty;
            }
            return a.name.localeCompare(b.name);
        });

        for (const monster of filtered) {
            const owned = ownedIds.has(monster.id);
            const cardData = userCollection.cards[monster.id];
            const qty = cardData?.quantity || 0;
            const tier = cardData?.tier || monster.tier || 'C';
            const tData = customTiers[tier] || { label: tier, nickname: tier };
            const imgSrc = monster.image || monster.imageUrl || `https://robohash.org/${monster.id}?set=set2`;

            const card = document.createElement('div');
            card.className = `creature-card creature-card--tier-${tier}${owned ? '' : ' creature-card--unowned'}`;
            card.title = `${monster.name} — CR:${monster.cr ?? '?'} | ${tData.nickname}${owned ? ` | x${qty}` : ' | Não obtida'}`;

            card.innerHTML = `
                <img class="creature-card__img" src="${imgSrc}" alt="${monster.name}" loading="lazy">
                <div class="creature-card__info">
                    <div class="creature-card__name">${monster.name}</div>
                    <div class="creature-card__meta">CR ${monster.cr ?? '?'} · ${monster.type || '???'}</div>
                </div>
                ${owned ? `<span class="creature-card__qty">x${qty}</span>` : ''}
            `;

            grid.appendChild(card);
        }
    };

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
