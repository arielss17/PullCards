const { Router } = require('express');
const { readJSON, writeJSON } = require('../helpers/json-store');

const router = Router();
const COLLECTIONS_FILE = 'collections.json';
const USERS_FILE = 'users.json';

const MAX_SUMMONS = 6;
const SUMMON_COOLDOWN_MS = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

// --- Helper: Calculate Current Summons ---
const calculateSummons = (user) => {
    let { availableSummons = MAX_SUMMONS, lastSummonAt } = user;

    // If not set or already full, enforce max and clear timer
    if (availableSummons >= MAX_SUMMONS || !lastSummonAt) {
        return { availableSummons: MAX_SUMMONS, lastSummonAt: null, nextSummonAt: null };
    }

    const now = Date.now();
    const last = new Date(lastSummonAt).getTime();
    const elapsed = now - last;

    // How many 8h cycles have passed?
    const earned = Math.floor(elapsed / SUMMON_COOLDOWN_MS);

    if (earned > 0) {
        availableSummons = Math.min(MAX_SUMMONS, availableSummons + earned);
        if (availableSummons === MAX_SUMMONS) {
            lastSummonAt = null; // Reached max, stop counting
        } else {
            // Advance the timer by the number of earned cycles
            lastSummonAt = new Date(last + (earned * SUMMON_COOLDOWN_MS)).toISOString();
        }
    }

    const nextSummonAt = lastSummonAt ? new Date(new Date(lastSummonAt).getTime() + SUMMON_COOLDOWN_MS).toISOString() : null;

    return { availableSummons, lastSummonAt, nextSummonAt };
};

// GET /api/collection/:userId/status
router.get('/:userId/status', async (req, res) => {
    try {
        const users = (await readJSON(USERS_FILE)) || [];
        const userIndex = users.findIndex(u => u.id === req.params.userId);

        if (userIndex === -1) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        const user = users[userIndex];
        const status = calculateSummons(user);

        // Update user if state changed (lazy update)
        if (status.availableSummons !== user.availableSummons || status.lastSummonAt !== user.lastSummonAt) {
            users[userIndex] = { ...user, ...status };
            await writeJSON(USERS_FILE, users);
        }

        res.json({
            availableSummons: status.availableSummons,
            maxSummons: MAX_SUMMONS,
            nextSummonAt: status.nextSummonAt
        });
    } catch (error) {
        console.error('Status error:', error);
        res.status(500).json({ error: 'Falha ao checar status de invocação.' });
    }
});

// GET /api/collection/:userId
router.get('/:userId', async (req, res) => {
    try {
        const collections = (await readJSON(COLLECTIONS_FILE)) || {};
        const userCollection = collections[req.params.userId] || { cards: {} };
        res.json(userCollection);
    } catch (error) {
        console.error('Get collection error:', error);
        res.status(500).json({ error: 'Falha ao buscar coleção.' });
    }
});

// POST /api/collection/:userId/deduct-summon
router.post('/:userId/deduct-summon', async (req, res) => {
    try {
        // 1. Check Energy (Available Summons)
        const users = (await readJSON(USERS_FILE)) || [];
        const userIndex = users.findIndex(u => u.id === req.params.userId);

        if (userIndex === -1) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        let user = users[userIndex];
        let status = calculateSummons(user);

        if (status.availableSummons <= 0) {
            return res.status(403).json({ error: 'Sem energia. Aguarde o retorno do poder de invocação.' });
        }

        // 2. Consume Energy
        status.availableSummons -= 1;
        // If it was full, start the timer now
        if (!status.lastSummonAt) {
            status.lastSummonAt = new Date().toISOString();
        }

        users[userIndex] = { ...user, ...status };
        await writeJSON(USERS_FILE, users);

        res.json({ success: true, message: 'Energia consumida com sucesso.' });
    } catch (error) {
        console.error('Deduct summon error:', error);
        res.status(500).json({ error: 'Falha ao consumir energia de invocação.' });
    }
});

// POST /api/collection/:userId/add
router.post('/:userId/add', async (req, res) => {
    try {
        const { cardId, tier } = req.body;

        if (!cardId) {
            return res.status(400).json({ error: 'cardId é obrigatório.' });
        }

        // 1. Check User exists
        const users = (await readJSON(USERS_FILE)) || [];
        const userIndex = users.findIndex(u => u.id === req.params.userId);

        if (userIndex === -1) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        // We assume energy was already deducted in /deduct-summon before rolling
        // 2. Add Card to Collection
        const collections = (await readJSON(COLLECTIONS_FILE)) || {};

        if (!collections[req.params.userId]) {
            collections[req.params.userId] = { cards: {} };
        }

        const userCards = collections[req.params.userId].cards;

        if (userCards[cardId]) {
            userCards[cardId].quantity += 1;
        } else {
            userCards[cardId] = {
                quantity: 1,
                tier: tier || 'C',
                firstObtained: new Date().toISOString(),
            };
        }

        await writeJSON(COLLECTIONS_FILE, collections);

        res.json({
            success: true,
            card: { id: cardId, ...userCards[cardId] },
            totalUnique: Object.keys(userCards).length,
        });
    } catch (error) {
        console.error('Add to collection error:', error);
        res.status(500).json({ error: 'Falha ao adicionar carta à coleção.' });
    }
});

module.exports = router;
