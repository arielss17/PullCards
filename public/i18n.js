// ============================================================
// PullCards - i18n Module
// Simple internationalization with JSON locale files
// Default: pt-BR | Stored in localStorage
// ============================================================

const I18n = (() => {
    const STORAGE_KEY = 'pullcards_lang';
    const DEFAULT_LANG = 'pt-BR';
    let currentLang = DEFAULT_LANG;
    let strings = {};

    const init = async (lang) => {
        currentLang = lang || localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
        try {
            const res = await fetch(`./locales/${currentLang}.json`);
            if (!res.ok) throw new Error(`Locale ${currentLang} not found`);
            strings = await res.json();
        } catch {
            console.warn(`⚠️ Locale '${currentLang}' failed, falling back to ${DEFAULT_LANG}`);
            currentLang = DEFAULT_LANG;
            const res = await fetch(`./locales/${DEFAULT_LANG}.json`);
            strings = await res.json();
        }
        localStorage.setItem(STORAGE_KEY, currentLang);
        applyToDOM();
        return currentLang;
    };

    // Get translation by dot-notation key: I18n.t('buttons.begin')
    const t = (key, replacements) => {
        const keys = key.split('.');
        let val = strings;
        for (const k of keys) {
            if (val && typeof val === 'object' && k in val) {
                val = val[k];
            } else {
                return key; // fallback to key itself
            }
        }
        if (typeof val !== 'string') return key;
        if (replacements) {
            return val.replace(/\{(\w+)\}/g, (_, k) => replacements[k] ?? `{${k}}`);
        }
        return val;
    };

    // Auto-apply to all elements with data-i18n attribute
    const applyToDOM = () => {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translated = t(key);
            if (translated !== key) el.textContent = translated;
        });
        // Also handle data-i18n-placeholder, data-i18n-title etc
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            const translated = t(key);
            if (translated !== key) el.title = translated;
        });
    };

    const getLang = () => currentLang;

    const setLang = async (lang) => {
        await init(lang);
        // Dispatch event so other modules can react
        window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: currentLang } }));
    };

    const getMonstersPath = () => {
        return `./locales/${currentLang}/monsters.json`;
    };

    const getGameDataFallback = () => {
        return './data/monsters_game.json';
    };

    return { init, t, getLang, setLang, applyToDOM, getMonstersPath, getGameDataFallback };
})();
