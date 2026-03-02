#!/usr/bin/env node
// ============================================================
// PullCards - Monster Translation Script (run once)
// Translates data/monsters_game.json → locales/pt-BR/monsters.json
// Usage: node translate_monsters.js
// ============================================================

const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, 'data', 'monsters_game.json');
const OUTPUT = path.join(__dirname, 'locales', 'pt-BR', 'monsters.json');

// --- Type translation ---
const typeMap = {
    'Aberration': 'Aberração',
    'Beast': 'Besta',
    'Celestial': 'Celestial',
    'Construct': 'Constructo',
    'Dragon': 'Dragão',
    'Elemental': 'Elemental',
    'Fey': 'Fada',
    'Fiend': 'Corruptor',
    'Giant': 'Gigante',
    'Humanoid': 'Humanoide',
    'Monstrosity': 'Monstruosidade',
    'Ooze': 'Limo',
    'Plant': 'Planta',
    'Undead': 'Morto-vivo',
    'Swarm': 'Enxame',
};

// --- Subtype translation ---
const subtypeMap = {
    'any race': 'qualquer raça',
    'any': 'qualquer',
    'devil': 'diabo',
    'demon': 'demônio',
    'shapechanger': 'metamorfo',
    'titan': 'titã',
    'gnoll': 'gnoll',
    'gnome': 'gnomo',
    'goblinoid': 'goblinoide',
    'kobold': 'kobold',
    'lizardfolk': 'povo-lagarto',
    'merfolk': 'sereia',
    'orc': 'orc',
    'sahuagin': 'sahuagin',
    'dwarf': 'anão',
    'elf': 'elfo',
    'human': 'humano',
    'grimlock': 'grimlock',
    'mongrelfolk': 'povo-mestiço',
};

// --- Size translation ---
const sizeMap = {
    'Tiny': 'Diminuto',
    'Small': 'Pequeno',
    'Medium': 'Médio',
    'Large': 'Grande',
    'Huge': 'Enorme',
    'Gargantuan': 'Colossal',
};

// --- Translate type field (handles subtypes) ---
function translateType(type) {
    // Match pattern: "Type (subtype)"
    const match = type.match(/^(\w+)\s*\((.+)\)$/);
    if (match) {
        const mainType = typeMap[match[1]] || match[1];
        const sub = match[2].toLowerCase().trim();
        const translatedSub = subtypeMap[sub] || sub;
        return `${mainType} (${translatedSub})`;
    }
    return typeMap[type] || type;
}

// --- Main ---
function main() {
    console.log('🌐 PullCards Monster Translator');
    console.log('================================\n');

    if (!fs.existsSync(INPUT)) {
        console.error('❌ data/monsters_game.json not found. Run: node build_game_db.js');
        process.exit(1);
    }

    const monsters = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
    console.log(`📖 Translating ${monsters.length} monsters to PT-BR...\n`);

    const translated = monsters.map(m => ({
        ...m,
        type: translateType(m.type),
        size: sizeMap[m.size] || m.size,
    }));

    // Ensure output directory
    fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
    fs.writeFileSync(OUTPUT, JSON.stringify(translated, null, 2), 'utf8');

    console.log(`💾 Saved ${translated.length} monsters to locales/pt-BR/monsters.json`);

    // Count translations
    const types = new Set(translated.map(m => m.type));
    const sizes = new Set(translated.map(m => m.size));
    console.log(`\n📊 Unique types: ${[...types].join(', ')}`);
    console.log(`📊 Unique sizes: ${[...sizes].join(', ')}`);
    console.log('\n🎉 Translation complete!');
}

main();
