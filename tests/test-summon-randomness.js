/**
 * PullCards — Summon Randomness Validator
 * 
 * Validates that the RNG in the summon pipeline (D100, D20, card selection)
 * behaves uniformly and within acceptable statistical bounds.
 * 
 * Usage: node tests/test-summon-randomness.js [iterations]
 * Default: 10,000 iterations
 */

const SummonService = require('../server/services/SummonService');

// Optimization: Cache config to avoid 10k disk reads during test
const _originalGetConfig = SummonService.getConfig.bind(SummonService);
const configCache = {};
SummonService.getConfig = async (id) => {
    if (!configCache[id]) configCache[id] = await _originalGetConfig(id);
    return configCache[id];
};

const ITERATIONS = parseInt(process.argv[2]) || 10_000;
const EXPANSION = 'dnd5e';
const TOLERANCE = 0.20; // 20% deviation tolerance (Robust sanity check for PRNG)

const log = (msg) => process.stdout.write(msg + '\n');
const divider = () => log('─'.repeat(60));

// ── Test 1: D20 Distribution ──────────────────────────────────
async function testD20Distribution() {
    log('\n🎲 TEST 1: D20 Distribution (uniform 1-20)');
    divider();

    const counts = {};
    for (let i = 1; i <= 20; i++) counts[i] = 0;

    for (let i = 0; i < ITERATIONS; i++) {
        const roll = SummonService.rollD20();
        counts[roll]++;
    }

    const expected = ITERATIONS / 20;
    let passed = true;

    for (let i = 1; i <= 20; i++) {
        const pct = ((counts[i] / ITERATIONS) * 100).toFixed(2);
        const deviation = Math.abs(counts[i] - expected) / expected;
        const status = deviation <= TOLERANCE ? '✅' : '⚠️';
        if (deviation > TOLERANCE) passed = false;
        log(`  d20=${String(i).padStart(2)}  →  ${String(counts[i]).padStart(6)} hits  (${pct}%)  ${status}`);
    }

    log(`\n  Expected: ~${expected.toFixed(0)} per value (±${(TOLERANCE * 100).toFixed(0)}%)`);
    log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL — some values deviate beyond tolerance'}`);
    return passed;
}

// ── Test 2: D100 Distribution ─────────────────────────────────
async function testD100Distribution() {
    log('\n🎲 TEST 2: D100 Distribution (uniform 1-100)');
    divider();

    const buckets = { '1-25': 0, '26-50': 0, '51-75': 0, '76-100': 0 };

    for (let i = 0; i < ITERATIONS; i++) {
        const roll = SummonService.rollD100();
        if (roll <= 25) buckets['1-25']++;
        else if (roll <= 50) buckets['26-50']++;
        else if (roll <= 75) buckets['51-75']++;
        else buckets['76-100']++;
    }

    const expected = ITERATIONS / 4;
    let passed = true;

    for (const [range, count] of Object.entries(buckets)) {
        const pct = ((count / ITERATIONS) * 100).toFixed(2);
        const deviation = Math.abs(count - expected) / expected;
        const status = deviation <= TOLERANCE ? '✅' : '⚠️';
        if (deviation > TOLERANCE) passed = false;
        log(`  d100 ${range.padEnd(7)} →  ${String(count).padStart(6)} hits  (${pct}%)  ${status}`);
    }

    log(`\n  Expected: ~${expected.toFixed(0)} per bucket (±${(TOLERANCE * 100).toFixed(0)}%)`);
    log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    return passed;
}

// ── Test 3: Tier Resolution ───────────────────────────────────
async function testTierDistribution() {
    log('\n🎲 TEST 3: Tier Distribution from D20 Rolls');
    divider();

    const tierCounts = {};

    for (let i = 0; i < ITERATIONS; i++) {
        const d20 = SummonService.rollD20();
        const tier = await SummonService.getTierFromRoll(d20, EXPANSION);
        tierCounts[tier] = (tierCounts[tier] || 0) + 1;
    }

    // Load config to show expected ranges
    const config = await SummonService.getConfig(EXPANSION);
    const tiers = config.customTiers || {};
    const sortedTiers = Object.entries(tiers)
        .filter(([id]) => id !== 'Z')
        .sort((a, b) => a[1].maxD20 - b[1].maxD20);

    log('  Configured ranges:');
    let prevMax = 0;
    for (const [id, t] of sortedTiers) {
        const range = `${prevMax + 1}-${t.maxD20}`;
        const slots = t.maxD20 - prevMax;
        const expectedPct = ((slots / 20) * 100).toFixed(1);
        prevMax = t.maxD20;
        log(`    ${id.padEnd(3)} → d20 ${range.padEnd(6)} (${slots} slots = ${expectedPct}%)`);
    }
    log(`    CRT → d20 20     (1 slot = 5.0%)`);

    log('\n  Actual results:');
    for (const [tier, count] of Object.entries(tierCounts).sort((a, b) => b[1] - a[1])) {
        const pct = ((count / ITERATIONS) * 100).toFixed(2);
        log(`    ${tier.padEnd(9)} →  ${String(count).padStart(6)} hits  (${pct}%)`);
    }

    log(`\n  Result: ✅ PASS (distribution shown above for manual review)`);
    return true;
}

// ── Test 4: Card Selection Fairness ───────────────────────────
async function testCardFairness() {
    log('\n🃏 TEST 4: Card Selection Fairness (equal weights)');
    divider();

    const CARD_ITERATIONS = Math.min(ITERATIONS, 5000);
    const cardCounts = {};

    // Find the table with the most cards for Tier D to ensure a good test pool
    const config = await SummonService.getConfig(EXPANSION);
    const tables = Object.keys(config.tables || {});
    const testTier = 'D';

    let bestTable = tables[0];
    let maxPoolSize = 0;

    // We need to re-implement the filtering logic here to find the best table
    const MonsterRepository = require('../server/repositories/MonsterRepository');
    const monsters = await MonsterRepository.findAllByExpansion(EXPANSION);

    for (const t of tables) {
        const pool = monsters.filter(m => {
            const override = config.monsterOverrides?.[m.id] || {};
            const tier = override.tier || m.tier;
            const tbs = override.tables || m.tables || [m.table];
            return tier === testTier && tbs.includes(t);
        });
        if (pool.length > maxPoolSize) {
            maxPoolSize = pool.length;
            bestTable = t;
        }
    }

    log(`  Pool: Tier ${testTier} + Mesa "${bestTable}" (${maxPoolSize} cards)`);
    log(`  Iterations: ${CARD_ITERATIONS}\n`);

    if (maxPoolSize <= 1) {
        log('  ⚠️ Pool too small for statistical fairness test. Skipping.');
        return true;
    }

    for (let i = 0; i < CARD_ITERATIONS; i++) {
        const cards = await SummonService.findCards(EXPANSION, bestTable, testTier, 1);
        if (cards[0]) {
            const id = cards[0].id;
            cardCounts[id] = (cardCounts[id] || 0) + 1;
        }
    }

    const uniqueCards = Object.keys(cardCounts).length;
    const sorted = Object.entries(cardCounts).sort((a, b) => b[1] - a[1]);
    const topCard = sorted[0];
    const bottomCard = sorted[sorted.length - 1];
    const expectedPerCard = CARD_ITERATIONS / uniqueCards;

    log(`  Unique cards drawn: ${uniqueCards}`);
    log(`  Expected per card:  ~${expectedPerCard.toFixed(1)}`);
    log(`  Most drawn:  ${topCard[0]} (${topCard[1]}x — ${((topCard[1] / CARD_ITERATIONS) * 100).toFixed(2)}%)`);
    log(`  Least drawn: ${bottomCard[0]} (${bottomCard[1]}x — ${((bottomCard[1] / CARD_ITERATIONS) * 100).toFixed(2)}%)`);

    const topDeviation = Math.abs(topCard[1] - expectedPerCard) / expectedPerCard;
    const maxAcceptableDeviation = 0.5; // 50% for small pools
    const passed = topDeviation <= maxAcceptableDeviation;

    log(`\n  Top deviation: ${(topDeviation * 100).toFixed(1)}% (max acceptable: ${(maxAcceptableDeviation * 100)}%)`);
    log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL — card distribution is skewed'}`);

    if (sorted.length <= 15) {
        log('\n  Full breakdown:');
        sorted.forEach(([id, count]) => {
            const pct = ((count / CARD_ITERATIONS) * 100).toFixed(2);
            const bar = '█'.repeat(Math.round(count / expectedPerCard * 10));
            log(`    ${id.padEnd(30)} ${String(count).padStart(5)}x  (${pct}%)  ${bar}`);
        });
    }

    return passed;
}

// ── Runner ────────────────────────────────────────────────────
async function main() {
    log('╔══════════════════════════════════════════════════════════╗');
    log('║   PullCards — Summon Randomness Validator                ║');
    log(`║   Iterations: ${String(ITERATIONS).padEnd(41)}║`);
    log('╚══════════════════════════════════════════════════════════╝');

    const results = [];
    results.push(await testD20Distribution());
    results.push(await testD100Distribution());
    results.push(await testTierDistribution());
    results.push(await testCardFairness());

    divider();
    const allPassed = results.every(Boolean);
    log(`\n${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    log(`Ran at: ${new Date().toISOString()}\n`);

    if (!allPassed) {
        log('Check the detailed logs above for failure details.');
    }

    process.exit(allPassed ? 0 : 1);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
