const { Router } = require('express');
const crypto = require('crypto');
const { readJSON, writeJSON } = require('../helpers/json-store');

const router = Router();
const USERS_FILE = 'users.json';

// POST /api/auth/register
router.post('/register', async (req, res) => {
    console.log(`[AUTH] Solicitando registro: ${req.body?.email}`);
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            console.warn('[AUTH] Falha no registro: campos faltando');
            return res.status(400).json({ error: 'Email, senha e nome são obrigatórios.' });
        }

        const users = (await readJSON(USERS_FILE)) || [];
        const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (exists) {
            console.warn(`[AUTH] Falha no registro: email ${email} já existe`);
            return res.status(409).json({ error: 'Este email já está registrado.' });
        }

        const newUser = {
            id: crypto.randomUUID(),
            email: email.toLowerCase().trim(),
            password,
            name: name.trim(),
            createdAt: new Date().toISOString(),
            availableSummons: 6,
            lastSummonAt: null
        };

        users.push(newUser);
        await writeJSON(USERS_FILE, users);
        console.log(`[AUTH] Usuário registrado com sucesso: ${email}`);

        const { password: _, ...safeUser } = newUser;
        const isAdmin = safeUser.email === 'arielssilva@hotmail.com';
        res.status(201).json({ success: true, user: { ...safeUser, isAdmin } });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Falha ao registrar usuário.' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
        }

        const users = (await readJSON(USERS_FILE)) || [];
        const user = users.find(
            u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );

        if (!user) {
            return res.status(401).json({ error: 'Email ou senha incorretos.' });
        }

        const { password: _, ...safeUser } = user;
        const isAdmin = safeUser.email === 'arielssilva@hotmail.com';
        res.json({ success: true, user: { ...safeUser, isAdmin } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Falha ao fazer login.' });
    }
});

// GET /api/auth/me/:userId
router.get('/me/:userId', async (req, res) => {
    try {
        const users = (await readJSON(USERS_FILE)) || [];
        const user = users.find(u => u.id === req.params.userId);

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        const { password: _, ...safeUser } = user;
        const isAdmin = safeUser.email === 'arielssilva@hotmail.com';
        res.json({ ...safeUser, isAdmin });
    } catch (error) {
        console.error('Me error:', error);
        res.status(500).json({ error: 'Falha ao buscar usuário.' });
    }
});

module.exports = router;
