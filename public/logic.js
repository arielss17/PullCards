// ============================================================
// PullCards - Summoning Logic Engine (Two-Step Ritual)
// ============================================================

const SummonEngine = (() => {
  // --- Dice Rolls ---
  const rollD100 = () => Math.floor(Math.random() * 100) + 1;
  const rollD20 = () => Math.floor(Math.random() * 20) + 1;

  // --- Dynamic Configuration ---
  let config = {
    tables: {
      A: { maxD100: 50 },
      B: { maxD100: 80 },
      C: { maxD100: 100 }
    }
  };

  const setConfig = (newConfig) => {
    if (newConfig) {
      config = newConfig;
    }
  };

  const getConfig = () => config;

  // --- Table Resolution (d100) ---
  const getTableFromRoll = (d100) => {
    if (!config || !config.tables) return "C";
    const sortedTables = Object.entries(config.tables).sort((a, b) => a[1].maxD100 - b[1].maxD100);
    for (const [tableName, tableConfig] of sortedTables) {
      if (d100 <= tableConfig.maxD100) return tableName;
    }
    // Fallback if somehow d100 > all ranges
    return sortedTables[sortedTables.length - 1]?.[0] || "C";
  };

  // --- Tier Resolution (d20) ---
  const getTierFromRoll = (d20) => {
    // Safety Fallback: Original hardcoded ranges if config is broken
    const fallback = (roll) => {
      if (roll === 1) return "E";
      if (roll <= 5) return "D";
      if (roll <= 11) return "C";
      if (roll <= 15) return "B";
      if (roll <= 18) return "A";
      if (roll === 19) return "S";
      return "CRITICAL";
    };

    if (!config || !config.customTiers) return fallback(d20);

    // Dynamic resolution based on maxD20
    const tiersArray = Object.entries(config.customTiers)
      .filter(([id]) => id !== "Z")
      .sort((a, b) => a[1].maxD20 - b[1].maxD20);

    // CRITICAL Check: Only if d20 is exactly 20 (or higher than all defined ranges)
    const maxConfigured = tiersArray.length > 0 ? tiersArray[tiersArray.length - 1][1].maxD20 : 19;

    if (d20 > maxConfigured || d20 === 20) return "CRITICAL";

    for (const [tierId, tierConfig] of tiersArray) {
      if (tierConfig.maxD20 !== undefined && d20 <= tierConfig.maxD20) {
        return tierId;
      }
    }

    // If we reach here, a tier in the middle was missing maxD20
    console.warn(`SummonEngine: Missing maxD20 config for a tier. Falling back for roll ${d20}`);
    return fallback(d20);
  };

  // --- Critical Hit Handler ---
  const handleCritical = () => {
    // Rolagem com Vantagem: Rola 2 vezes e pega o maior.
    const innerRoll = Math.max(rollD20(), rollD20());

    // Config-driven rewards
    const rules = config.criticalRules || {
      baseRewardTier: "S",
      baseRewardCount: 2,
      innerCriticalTier: "Z",
      innerCriticalCount: 1
    };

    if (innerRoll === 20) {
      return { type: rules.innerCriticalTier, count: rules.innerCriticalCount, innerRoll };
    }
    return { type: rules.baseRewardTier, count: rules.baseRewardCount, innerRoll };
  };

  // --- Card Lookup with Fallback ---
  const findCards = (database, table, tier, count = 1) => {
    let pool = database.filter(c => (c.tables && c.tables.includes(table)) && c.tier === tier);
    if (pool.length === 0) pool = database.filter(c => c.tables && c.tables.includes(table));
    if (pool.length === 0) pool = database.filter(c => c.tier === tier);
    if (pool.length === 0) pool = [...database];

    const results = [];
    for (let i = 0; i < count; i++) {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      results.push({ ...pick });
    }
    return results;
  };

  // ============================================================
  // STEP-BY-STEP SUMMONING API (Two-Step Ritual)
  // ============================================================

  // Step 1: Roll for Table
  const rollTableStep = () => {
    const d100 = rollD100();
    const table = getTableFromRoll(d100);
    return { d100, table };
  };

  // Step 2: Roll for Tier + resolve cards
  const rollTierStep = (table, database) => {
    const d20 = rollD20();
    const tierResult = getTierFromRoll(d20);

    let cards = [];
    let isCritical = false;
    let criticalData = null;
    let finalTier = tierResult;

    if (tierResult === "CRITICAL") {
      isCritical = true;
      criticalData = handleCritical();
      finalTier = criticalData.type;
      cards = findCards(database, table, criticalData.type, criticalData.count);
    } else {
      cards = findCards(database, table, tierResult);
    }

    return { d20, tier: finalTier, isCritical, criticalData, cards };
  };

  // --- Legacy: Full Summon (one-shot) ---
  const summon = (database) => {
    const { d100, table } = rollTableStep();
    const tierResult = rollTierStep(table, database);
    return { d100, table, ...tierResult };
  };

  // --- Game State (Time-Based) ---
  const createGameState = () => ({
    collection: [],
    history: [],
    energy: {
      available: 0,
      max: 6,
      nextSummonAt: null
    }
  });

  const canSummon = (state) => state.energy.available > 0;

  // Real deduction happens in backend, this only updates local UI state
  const deductEnergy = (state) => {
    if (!canSummon(state)) return false;
    state.energy.available -= 1;
    return true;
  };

  const performSummon = (state, database) => {
    if (!canSummon(state)) {
      return { success: false, reason: "Sem energia" };
    }
    deductEnergy(state);
    const result = summon(database);
    state.collection.push(...result.cards);
    state.history.push(result);
    return { success: true, result };
  };


  // --- Probability Test (Dev Only) ---
  const testDistribution = (database, iterations = 10000) => {
    const counts = {};
    Object.keys(config.customTiers || { C: 1, B: 1, A: 1, S: 1 }).forEach(tid => counts[tid] = 0);
    counts.criticals = 0;

    for (let i = 0; i < iterations; i++) {
      const r = summon(database);
      if (r.isCritical) counts.criticals++;
      r.cards.forEach(() => {
        if (counts[r.tier] !== undefined) counts[r.tier]++;
      });
    }

    const tableData = {};
    Object.entries(config.customTiers || {}).forEach(([tid, tData]) => {
      tableData[tData.nickname || tid] = `${((counts[tid] / iterations) * 100).toFixed(1)}%`;
    });
    tableData["Criticals"] = `${((counts.criticals / iterations) * 100).toFixed(1)}%`;
    console.table(tableData);
  };

  return {
    rollD100, rollD20,
    getTableFromRoll, getTierFromRoll,
    handleCritical, findCards,
    rollTableStep, rollTierStep,
    summon, createGameState, canSummon, deductEnergy, performSummon,
    testDistribution, setConfig, getConfig
  };
})();
