#!/usr/bin/env node
// ============================================================
// PullCards - Game Database Builder
// Converts raw API data → MonstersBD format for the game
// Usage: node build_game_db.js
// ============================================================

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const RAW_FILE = path.join(DATA_DIR, 'monsters_raw.json');
const GAME_FILE = path.join(DATA_DIR, 'monsters_game.json');
const IMAGES_DIR = path.join(DATA_DIR, 'images');

// --- CR → Table/Tier (for PullCards summoning system) ---
const crToTable = (cr) => { if (cr <= 4) return 'A'; if (cr <= 12) return 'B'; return 'C'; };
const crToTier = (cr) => { if (cr <= 2) return 'C'; if (cr <= 6) return 'B'; if (cr <= 14) return 'A'; return 'S'; };

// --- Ability modifier ---
const calcModifier = (score) => Math.floor((score - 10) / 2);
const formatMod = (mod) => mod >= 0 ? `+${mod}` : `${mod}`;

// --- CR as fraction string ---
const crToString = (cr) => {
    if (cr === 0.125) return '1/8';
    if (cr === 0.25) return '1/4';
    if (cr === 0.5) return '1/2';
    return String(cr);
};

// --- Type emoji ---
const typeEmojiMap = {
    aberration: '👁️', beast: '🐾', celestial: '✨', construct: '⚙️',
    dragon: '🐉', elemental: '🌊', fey: '🧚', fiend: '😈',
    giant: '🗿', humanoid: '🧑', monstrosity: '🦎', ooze: '🫧',
    plant: '🌿', undead: '💀', swarm: '🐝',
};

// --- Damage type translation (EN → PT-BR) ---
const damageTypePT = {
    acid: 'ácido', bludgeoning: 'impacto', cold: 'frio', fire: 'fogo',
    force: 'força', lightning: 'relâmpago', necrotic: 'necrótico',
    piercing: 'perfurante', poison: 'veneno', psychic: 'psíquico',
    radiant: 'radiante', slashing: 'cortante', thunder: 'trovão',
};

// --- Build buffs from immunities/resistances ---
function buildBuffs(m) {
    const buffs = [];
    if (m.damage_immunities?.length) {
        m.damage_immunities.forEach((d) => buffs.push(`Imunidade a Dano: ${damageTypePT[d] || d}`));
    }
    if (m.damage_resistances?.length) {
        m.damage_resistances.forEach((d) => buffs.push(`Resistência a Dano: ${damageTypePT[d] || d}`));
    }
    if (m.damage_vulnerabilities?.length) {
        m.damage_vulnerabilities.forEach((d) => buffs.push(`Vulnerabilidade a Dano: ${damageTypePT[d] || d}`));
    }
    if (m.condition_immunities?.length) {
        m.condition_immunities.forEach((c) => buffs.push(`Imunidade a Condição: ${c.name || c}`));
    }
    return buffs;
}

// --- Build passives from special_abilities ---
function buildPassives(m) {
    if (!m.special_abilities?.length) return [];
    return m.special_abilities.map((a) => ({
        name: a.name,
        description: a.desc,
    }));
}

// --- Build actions ---
function buildActions(m) {
    if (!m.actions?.length) return [];
    return m.actions.map((a) => {
        const action = {
            name: a.name,
            type: a.desc?.includes('Ranged') && a.desc?.includes('Melee')
                ? 'Ataque com Arma Corpo a Corpo ou à Distância'
                : a.desc?.includes('Ranged Weapon')
                    ? 'Ataque com Arma à Distância'
                    : a.desc?.includes('Melee Weapon')
                        ? 'Ataque com Arma Corpo a Corpo'
                        : a.desc?.includes('Ranged Spell')
                            ? 'Ataque com Magia à Distância'
                            : a.desc?.includes('Melee Spell')
                                ? 'Ataque com Magia Corpo a Corpo'
                                : a.multiattack_type
                                    ? 'Multiattack'
                                    : 'Habilidade',
            cost: 'action',
            description: a.desc || '',
        };

        if (a.attack_bonus !== undefined && a.attack_bonus !== null) {
            action.hitBonus = `+${a.attack_bonus}`;
        }

        if (a.damage?.length) {
            const primary = a.damage[0];
            if (primary.damage_dice) action.damage = primary.damage_dice;
            if (primary.damage_type?.name) action.damageType = damageTypePT[primary.damage_type.index] || primary.damage_type.name;
        }

        if (a.dc) {
            action.saveDC = a.dc.dc_value;
            action.saveType = a.dc.dc_type?.name || '';
        }

        return action;
    });
}

// --- Build resources (spell slots) ---
function buildResources(m) {
    const resources = [];
    const spellcasting = m.special_abilities?.find((a) => a.spellcasting);
    if (spellcasting?.spellcasting?.slots) {
        const slots = spellcasting.spellcasting.slots;
        for (const [level, count] of Object.entries(slots)) {
            if (count > 0) {
                resources.push({
                    name: `Magia de ${level}º Nível`,
                    key: `spell_slot_${level}`,
                    maxValue: count,
                });
            }
        }
    }
    return resources;
}

// --- Format type string ---
function formatType(m) {
    let t = m.type ? m.type.charAt(0).toUpperCase() + m.type.slice(1) : 'Unknown';
    if (m.subtype) t += ` (${m.subtype})`;
    return t;
}

// --- Convert one monster ---
function convertMonster(m) {
    const cr = m.challenge_rating ?? 0;
    const hasImage = fs.existsSync(path.join(IMAGES_DIR, `${m.index}.png`));
    const dexMod = calcModifier(m.dexterity ?? 10);

    return {
        id: m.index,
        name: m.name,
        image: hasImage ? `./data/images/${m.index}.png` : `https://robohash.org/${m.index}?set=set2`,
        type: formatType(m),
        typeEmoji: typeEmojiMap[m.type?.toLowerCase()] || '❓',
        size: m.size || 'Medium',
        armorClass: m.armor_class?.[0]?.value ?? 10,
        hp: m.hit_points ?? 1,
        cr: crToString(cr),
        crValue: cr,
        proficiencyBonus: `+${m.proficiency_bonus ?? 2}`,
        initiativeBonus: formatMod(dexMod),
        resources: buildResources(m),
        stats: {
            str: { score: m.strength ?? 10, modifier: formatMod(calcModifier(m.strength ?? 10)) },
            dex: { score: m.dexterity ?? 10, modifier: formatMod(calcModifier(m.dexterity ?? 10)) },
            con: { score: m.constitution ?? 10, modifier: formatMod(calcModifier(m.constitution ?? 10)) },
            int: { score: m.intelligence ?? 10, modifier: formatMod(calcModifier(m.intelligence ?? 10)) },
            wis: { score: m.wisdom ?? 10, modifier: formatMod(calcModifier(m.wisdom ?? 10)) },
            cha: { score: m.charisma ?? 10, modifier: formatMod(calcModifier(m.charisma ?? 10)) },
        },
        buffs: buildBuffs(m),
        passives: buildPassives(m),
        actions: buildActions(m),
        // PullCards summoning fields
        table: crToTable(cr),
        tier: crToTier(cr),
    };
}

// --- Main ---
function main() {
    console.log('🏗️  PullCards Game DB Builder');
    console.log('============================\n');

    if (!fs.existsSync(RAW_FILE)) {
        console.error('❌ data/monsters_raw.json not found. Run: node sync_monsters.js');
        process.exit(1);
    }

    const raw = JSON.parse(fs.readFileSync(RAW_FILE, 'utf8'));
    console.log(`📖 Processing ${raw.length} monsters...`);

    const gameDB = raw.map(convertMonster);

    fs.writeFileSync(GAME_FILE, JSON.stringify(gameDB, null, 2), 'utf8');
    console.log(`💾 Saved ${gameDB.length} monsters to data/monsters_game.json\n`);

    // Stats
    const tables = { A: 0, B: 0, C: 0 };
    const tiers = { C: 0, B: 0, A: 0, S: 0 };
    let withActions = 0, withPassives = 0, withBuffs = 0, withResources = 0;
    gameDB.forEach((m) => {
        tables[m.table]++;
        tiers[m.tier]++;
        if (m.actions.length) withActions++;
        if (m.passives.length) withPassives++;
        if (m.buffs.length) withBuffs++;
        if (m.resources.length) withResources++;
    });

    console.log('📊 Distribution:');
    console.log(`   Tables:     A=${tables.A}  B=${tables.B}  C=${tables.C}`);
    console.log(`   Tiers:      C=${tiers.C}  B=${tiers.B}  A=${tiers.A}  S=${tiers.S}`);
    console.log(`   Actions:    ${withActions} monsters have actions`);
    console.log(`   Passives:   ${withPassives} monsters have passives`);
    console.log(`   Buffs:      ${withBuffs} monsters have immunities/resistances`);
    console.log(`   Resources:  ${withResources} monsters have spell slots`);
    console.log('\n🎉 Game DB ready!');
}

main();
