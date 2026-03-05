const { Router } = require('express');
const ExpansionRepository = require('../repositories/ExpansionRepository');
const AppError = require('../helpers/AppError');

// Note: you can import requireAdmin from server if needed, or pass it from server.js
const router = Router();

// GET all expansions
router.get('/', async (req, res, next) => {
    try {
        const expansions = await ExpansionRepository.findAll();
        res.json(expansions);
    } catch (error) {
        next(error);
    }
});

// GET one expansion
router.get('/:id', async (req, res, next) => {
    try {
        const expansion = await ExpansionRepository.findById(req.params.id);
        if (!expansion) throw new AppError('Expansão não encontrada', 404);
        res.json(expansion);
    } catch (error) {
        next(error);
    }
});

// The following routes will be protected by `requireAdmin` defined in server.js

// POST (Create or Update)
router.post('/', async (req, res, next) => {
    try {
        const { id, name, file, featured, bonusSummonsQty, loginDeadline } = req.body;
        if (!id || !name || !file) {
            throw new AppError('As propriedades id, name e file são obrigatórias.', 400);
        }

        const expansion = {
            id,
            name,
            file,
            featured: !!featured,
            createdAt: new Date().toISOString(),
            bonusSummonsQty: bonusSummonsQty || 0,
            loginDeadline: loginDeadline || null
        };

        // If this one is featured, un-feature the others
        if (expansion.featured) {
            const all = await ExpansionRepository.findAll();
            for (const e of all) {
                if (e.id !== id && e.featured) {
                    e.featured = false;
                    await ExpansionRepository.save(e);
                }
            }
        }

        await ExpansionRepository.save(expansion);
        res.json({ success: true, expansion });
    } catch (error) {
        next(error);
    }
});

// DELETE
router.delete('/:id', async (req, res, next) => {
    try {
        await ExpansionRepository.delete(req.params.id);
        res.json({ success: true, message: 'Expansão deletada' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
