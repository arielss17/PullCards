// ============================================================
// PullCards - Auth Manager (Login / Register)
// ============================================================

const AuthManager = (() => {
    const STORAGE_KEY = 'pullcards_user';

    const getUser = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    };

    const setUser = (user) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    };

    const clearUser = () => {
        localStorage.removeItem(STORAGE_KEY);
    };

    const isLoggedIn = () => !!getUser();

    const login = async (email, password) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha ao fazer login.');
        setUser(data.user);
        return data.user;
    };

    const register = async (name, email, password) => {
        console.log('[Auth] Tentando registrar:', email);
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        });

        const contentType = res.headers.get('content-type');
        let data;

        if (contentType && contentType.includes('application/json')) {
            data = await res.json();
        } else {
            const text = await res.text();
            console.error('[Auth] Resposta não-JSON do servidor:', text);
            throw new Error(`Erro no servidor (${res.status})`);
        }

        if (!res.ok) {
            console.warn('[Auth] Falha no registro:', data.error);
            throw new Error(data.error || 'Falha ao registrar.');
        }

        console.log('[Auth] Registro ok:', data.user.id);
        setUser(data.user);
        return data.user;
    };

    const logout = () => {
        clearUser();
        window.location.href = '/auth.html';
    };

    const requireAuth = () => {
        if (window.location.pathname.includes('auth.html')) return; // Don't guard the login page itself
        if (!isLoggedIn()) {
            document.documentElement.style.visibility = 'hidden';
            window.location.href = '/auth.html';
            return false;
        }
        return true;
    };

    return { getUser, setUser, clearUser, isLoggedIn, login, register, logout, requireAuth };
})();

// --- Page Logic (only runs on auth.html) ---
(() => {
    // Redirect if already logged in
    if (AuthManager.isLoggedIn() && window.location.pathname.includes('auth.html')) {
        window.location.href = '/';
        return;
    }

    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const formLogin = document.getElementById('formLogin');
    const formRegister = document.getElementById('formRegister');
    const authMessage = document.getElementById('authMessage');

    if (!tabLogin) return; // Not on auth page

    const showMessage = (text, type = 'error') => {
        authMessage.textContent = text;
        authMessage.className = `auth-message visible auth-message--${type}`;
    };

    const hideMessage = () => {
        authMessage.className = 'auth-message';
    };

    const switchTab = (tab) => {
        hideMessage();
        if (tab === 'login') {
            tabLogin.classList.add('active');
            tabRegister.classList.remove('active');
            formLogin.classList.add('active');
            formRegister.classList.remove('active');
        } else {
            tabRegister.classList.add('active');
            tabLogin.classList.remove('active');
            formRegister.classList.add('active');
            formLogin.classList.remove('active');
        }
    };

    tabLogin.addEventListener('click', () => switchTab('login'));
    tabRegister.addEventListener('click', () => switchTab('register'));

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessage();
        const btn = formLogin.querySelector('.auth-submit');
        btn.disabled = true;

        try {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            await AuthManager.login(email, password);
            showMessage(I18n.t('auth.loginSuccess'), 'success');
            setTimeout(() => { window.location.href = '/'; }, 800);
        } catch (err) {
            showMessage(err.message);
        } finally {
            btn.disabled = false;
        }
    });

    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessage();
        const btn = formRegister.querySelector('.auth-submit');
        btn.disabled = true;

        try {
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            await AuthManager.register(name, email, password);
            showMessage(I18n.t('auth.registerSuccess'), 'success');
            setTimeout(() => { window.location.href = '/'; }, 800);
        } catch (err) {
            console.error('[Auth] Catch error em formRegister:', err);
            showMessage(err.message);
        } finally {
            btn.disabled = false;
        }
    });
})();
