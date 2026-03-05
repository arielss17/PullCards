const { Router } = require('express');
const crypto = require('crypto');
const UserRepository = require('../repositories/UserRepository');
const AppError = require('../helpers/AppError');
const EnergyService = require('../services/EnergyService');

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
    console.log(`[AUTH] Solicitando registro: ${req.body?.email}`);
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            console.warn('[AUTH] Falha no registro: campos faltando');
            throw new AppError('Email, senha e nome são obrigatórios.', 400);
        }

        const exists = await UserRepository.findByEmail(email);

        if (exists) {
            console.warn(`[AUTH] Falha no registro: email ${email} já existe`);
            throw new AppError('Este email já está registrado.', 409);
        }

        let newUser = {
            id: crypto.randomUUID(),
            email: email.toLowerCase().trim(),
            password,
            name: name.trim(),
            createdAt: new Date().toISOString(),
            availableSummons: 6,
            lastSummonAt: null
        };

        // Grants any active expansion bonuses before saving
        newUser = await EnergyService.checkAndGrantBonuses(newUser);
        await UserRepository.save(newUser);
        console.log(`[AUTH] Usuário registrado com sucesso: ${email}`);

        const { password: _, ...safeUser } = newUser;
        const isAdmin = safeUser.email === 'arielssilva@hotmail.com';
        res.status(201).json({ success: true, user: { ...safeUser, isAdmin } });
    } catch (error) {
        next(error);
    }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new AppError('Email e senha são obrigatórios.', 400);
        }

        let user = await UserRepository.findByEmail(email);

        if (!user || user.password !== password) {
            throw new AppError('Email ou senha incorretos.', 401);
        }

        // Grant missing expansion bonuses on login
        user = await EnergyService.checkAndGrantBonuses(user);

        const { password: _, ...safeUser } = user;
        const isAdmin = safeUser.email === 'arielssilva@hotmail.com';
        res.json({ success: true, user: { ...safeUser, isAdmin } });
    } catch (error) {
        next(error);
    }
});

// GET /api/auth/me/:userId
router.get('/me/:userId', async (req, res, next) => {
    try {
        let user = await UserRepository.findById(req.params.userId);

        if (!user) {
            throw new AppError('Usuário não encontrado.', 404);
        }

        // Keep bonuses updated when fetching me
        user = await EnergyService.checkAndGrantBonuses(user);

        const { password: _, ...safeUser } = user;
        const isAdmin = safeUser.email === 'arielssilva@hotmail.com';
        res.json({ ...safeUser, isAdmin });
    } catch (error) {
        next(error);
    }
});

// PUT /api/auth/update
router.put('/update', async (req, res, next) => {
    try {
        const { userId, currentPassword, newName, newPassword } = req.body;

        if (!userId || !currentPassword) {
            throw new AppError('userId e senha atual são obrigatórios.', 400);
        }

        const user = await UserRepository.findById(userId);

        if (!user) {
            throw new AppError('Usuário não encontrado.', 404);
        }

        if (user.password !== currentPassword) {
            throw new AppError('Senha atual incorreta.', 401);
        }

        // Update fields
        if (newName && newName.trim()) {
            user.name = newName.trim();
        }
        if (newPassword && newPassword.trim()) {
            user.password = newPassword.trim();
        }

        await UserRepository.save(user);

        const { password: _, ...safeUser } = user;
        const isAdmin = safeUser.email === 'arielssilva@hotmail.com';
        res.json({ success: true, user: { ...safeUser, isAdmin } });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
