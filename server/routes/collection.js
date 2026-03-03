const { Router } = require('express');
const AppError = require('../helpers/AppError');
const CollectionRepository = require('../repositories/CollectionRepository');
const EnergyService = require('../services/EnergyService');
const SummonService = require('../services/SummonService');

const router = Router();

// GET /api/collection/:userId/status
router.get('/:userId/status', async (req, res, next) => {
    try {
        const status = await EnergyService.getUserStatus(req.params.userId);
        res.json(status);
    } catch (error) {
        next(error);
    }
});

// GET /api/collection/:userId
router.get('/:userId', async (req, res, next) => {
    try {
        const userCollection = await CollectionRepository.findByUserId(req.params.userId);
        res.json(userCollection);
    } catch (error) {
        next(error);
    }
});

// POST /api/collection/:userId/deduct-summon
// [DEPRECATION WARNING] - This should ideally be replaced by the roll endpoint entirely, keeping for now to avoid breaking UI abruptly
router.post('/:userId/deduct-summon', async (req, res, next) => {
    try {
        const result = await EnergyService.consumeEnergy(req.params.userId);
        res.json({ success: true, message: 'Energia consumida com sucesso.', ...result });
    } catch (error) {
        next(error);
    }
});

// POST /api/collection/:userId/roll
// New ALL-IN-ONE endpoint for clean code separation
router.post('/:userId/roll', async (req, res, next) => {
    try {
        // 1. Consume energy
        await EnergyService.consumeEnergy(req.params.userId);

        // 2. Roll the RNG securely in the backend
        const rollResult = await SummonService.performSummon();

        // 3. Save directly to Collection
        const userCollection = await CollectionRepository.findByUserId(req.params.userId);
        const userCards = userCollection.cards;

        rollResult.cards.forEach(card => {
            if (userCards[card.id]) {
                userCards[card.id].quantity += 1;
            } else {
                userCards[card.id] = {
                    quantity: 1,
                    firstAcquired: new Date().toISOString()
                };
            }
        });

        await CollectionRepository.saveForUser(req.params.userId, userCollection);

        // 4. Send back the rolled cards (and RNG stats for the UI)
        res.json({ success: true, message: 'Summon completo!', rollData: rollResult });
    } catch (error) {
        next(error);
    }
});

// POST /api/collection/:userId/add
// [DEPRECATION WARNING] - Vulnerable endpoint. Will be removed when frontend fully migrates to /roll
router.post('/:userId/add', async (req, res, next) => {
    try {
        const { cardId, tier } = req.body;

        if (!cardId) {
            throw new AppError('cardId é obrigatório.', 400);
        }

        await EnergyService.getUserStatus(req.params.userId);

        const userCollection = await CollectionRepository.findByUserId(req.params.userId);
        const userCards = userCollection.cards;

        if (userCards[cardId]) {
            userCards[cardId].quantity += 1;
        } else {
            userCards[cardId] = {
                quantity: 1,
                firstAcquired: new Date().toISOString()
            };
        }

        await CollectionRepository.saveForUser(req.params.userId, userCollection);

        res.json({ success: true, message: 'Carta salva com sucesso!', collection: userCollection });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
