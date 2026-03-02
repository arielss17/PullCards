#!/usr/bin/env node
// ============================================================
// PullCards - Monster Data Sync Script
// Downloads all D&D 5e monsters (JSON + images) to data/
// Usage: node sync_monsters.js [--force]
// ============================================================

const fs = require('fs');
const path = require('path');

const BASE = 'https://www.dnd5eapi.co';
const LIST_URL = `${BASE}/api/2014/monsters`;
const DATA_DIR = path.join(__dirname, 'data');
const IMAGES_DIR = path.join(DATA_DIR, 'images');
const RAW_FILE = path.join(DATA_DIR, 'monsters_raw.json');
const CONCURRENCY = 10;

const forceMode = process.argv.includes('--force');

// --- Batch processor with concurrency ---
async function processBatch(items, fn, concurrency = CONCURRENCY) {
    const results = [];
    for (let i = 0; i < items.length; i += concurrency) {
        const batch = items.slice(i, i + concurrency);
        const batchResults = await Promise.all(batch.map(fn));
        results.push(...batchResults);
    }
    return results;
}

// --- Download image ---
async function downloadImage(index) {
    const url = `${BASE}/api/images/monsters/${index}.png`;
    const dest = path.join(IMAGES_DIR, `${index}.png`);

    if (!forceMode && fs.existsSync(dest)) return true;

    try {
        const res = await fetch(url);
        if (!res.ok) return false;
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(dest, buffer);
        return true;
    } catch {
        return false;
    }
}

// --- Main ---
async function main() {
    console.log('🐉 PullCards Monster Sync');
    console.log('========================\n');

    // Check if already synced
    if (!forceMode && fs.existsSync(RAW_FILE)) {
        const data = JSON.parse(fs.readFileSync(RAW_FILE, 'utf8'));
        console.log(`✅ Local data already exists: ${data.length} monsters in data/monsters_raw.json`);
        console.log('   Use --force to re-download everything.');
        return;
    }

    // Create directories
    fs.mkdirSync(IMAGES_DIR, { recursive: true });

    // Step 1: Fetch monster list
    console.log('📜 Fetching monster list...');
    const listRes = await fetch(LIST_URL, { headers: { Accept: 'application/json' } });
    const listData = await listRes.json();
    const monsterList = listData.results || [];
    console.log(`   Found ${monsterList.length} monsters.\n`);

    // Step 2: Fetch all monster details
    console.log('📖 Fetching monster details...');
    let detailsDone = 0;
    const details = await processBatch(monsterList, async (m) => {
        try {
            const res = await fetch(`${BASE}${m.url}`, { headers: { Accept: 'application/json' } });
            if (!res.ok) return null;
            const data = await res.json();
            detailsDone++;
            if (detailsDone % 20 === 0 || detailsDone === monsterList.length) {
                process.stdout.write(`   ${detailsDone}/${monsterList.length} details fetched\r`);
            }
            return data;
        } catch { return null; }
    });
    const validDetails = details.filter(Boolean);
    console.log(`\n   ✅ ${validDetails.length} monster details fetched.\n`);

    // Step 3: Download images
    console.log('🖼️  Downloading monster images...');
    const monstersWithImages = validDetails.filter((m) => m.image);
    let imgDone = 0;
    const imageResults = await processBatch(monstersWithImages, async (m) => {
        const success = await downloadImage(m.index);
        imgDone++;
        if (imgDone % 10 === 0 || imgDone === monstersWithImages.length) {
            process.stdout.write(`   ${imgDone}/${monstersWithImages.length} images downloaded\r`);
        }
        return { index: m.index, success };
    });
    const successfulImages = new Set(imageResults.filter((r) => r.success).map((r) => r.index));
    console.log(`\n   ✅ ${successfulImages.size} images saved to data/images/\n`);

    // Step 4: Save raw API data
    console.log('💾 Saving monsters_raw.json...');
    fs.writeFileSync(RAW_FILE, JSON.stringify(validDetails, null, 2), 'utf8');
    console.log(`   ✅ ${validDetails.length} raw monster records saved.\n`);

    console.log('🎉 Sync complete! Now run: node build_game_db.js');
}

main().catch((err) => {
    console.error('❌ Sync failed:', err.message);
    process.exit(1);
});
