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
    if (newConfig && newConfig.tables) {
      config = newConfig;
    }
  };

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
    if (d20 <= 11) return "C";
    if (d20 <= 15) return "B";
    if (d20 <= 19) return "A";
    return "CRITICAL";
  };

  // --- Critical Hit Handler ---
  const handleCritical = () => {
    const innerRoll = rollD20();
    if (innerRoll === 20) {
      return { type: "S", count: 1, innerRoll };
    }
    return { type: "A", count: 2, innerRoll };
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

  // --- Game State ---
  const createGameState = (startingCoins = 100, summonCost = 10) => ({
    coins: startingCoins,
    summonCost,
    collection: [],
    history: [],
  });

  const canSummon = (state) => state.coins >= state.summonCost;

  const deductCoins = (state) => {
    if (!canSummon(state)) return false;
    state.coins -= state.summonCost;
    return true;
  };

  const performSummon = (state, database) => {
    if (!canSummon(state)) {
      return { success: false, reason: "Not enough coins" };
    }
    state.coins -= state.summonCost;
    const result = summon(database);
    state.collection.push(...result.cards);
    state.history.push(result);
    return { success: true, result };
  };

  // --- Probability Test (Dev Only) ---
  const testDistribution = (database, iterations = 10000) => {
    const counts = { C: 0, B: 0, A: 0, S: 0, criticals: 0 };
    for (let i = 0; i < iterations; i++) {
      const r = summon(database);
      if (r.isCritical) counts.criticals++;
      r.cards.forEach(() => counts[r.tier]++);
    }
    console.table({
      "Tier C": `${((counts.C / iterations) * 100).toFixed(1)}%`,
      "Tier B": `${((counts.B / iterations) * 100).toFixed(1)}%`,
      "Tier A": `${((counts.A / iterations) * 100).toFixed(1)}%`,
      "Tier S": `${((counts.S / iterations) * 100).toFixed(1)}%`,
      "Criticals": `${((counts.criticals / iterations) * 100).toFixed(1)}%`,
    });
  };

  return {
    rollD100, rollD20,
    getTableFromRoll, getTierFromRoll,
    handleCritical, findCards,
    rollTableStep, rollTierStep,
    summon, createGameState, canSummon, deductCoins, performSummon,
    testDistribution, setConfig
  };
})();
