const auth = require('./server/routes/auth');
const express = require('express');
const app = express();

app.use(express.json());
app.use('/api/auth', auth);

const request = {
    body: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
    }
};

(async () => {
    console.log('Testing registration...');
    // We can't easily mock res in a short script without a library like supertest, 
    // but we can just import the logic or use a simple mock.

    const resMock = {
        status: function (s) { this.statusCode = s; return this; },
        json: function (j) { console.log('Response:', this.statusCode, j); }
    };

    // Need to handle the route handler manually
    const registerHandler = auth.stack.find(s => s.route && s.route.path === '/register').route.stack[0].handle;

    try {
        await registerHandler(request, resMock, () => { });
    } catch (e) {
        console.error('Handler threw error:', e);
    }
})();
