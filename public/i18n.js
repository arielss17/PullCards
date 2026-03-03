// ============================================================
// PullCards - i18n Module
// Cascading fallback: active locale → pt-BR → key itself
// Default: pt-BR | Stored in localStorage
// ============================================================

const I18n = (() => {
    const STORAGE_KEY = 'pullcards_lang';
    const DEFAULT_LANG = 'pt-BR';
    let currentLang = DEFAULT_LANG;
    let strings = {};
    let fallbackStrings = {};

    const init = async (lang) => {
        currentLang = lang || localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;

        // Always load PT-BR as fallback
        try {
            const fbRes = await fetch(`./locales/${DEFAULT_LANG}.json`);
            if (fbRes.ok) fallbackStrings = await fbRes.json();
        } catch {
            console.warn('⚠️ Failed to load fallback locale pt-BR');
        }

        // Load active locale (if different from PT-BR)
        if (currentLang === DEFAULT_LANG) {
            strings = fallbackStrings;
        } else {
            try {
                const res = await fetch(`./locales/${currentLang}.json`);
                if (!res.ok) throw new Error(`Locale ${currentLang} not found`);
                strings = await res.json();
            } catch {
                console.warn(`⚠️ Locale '${currentLang}' failed, falling back to ${DEFAULT_LANG}`);
                currentLang = DEFAULT_LANG;
                strings = fallbackStrings;
            }
        }

        localStorage.setItem(STORAGE_KEY, currentLang);
        applyToDOM();
        return currentLang;
    };

    // Resolve a dot-notation key from an object
    const resolve = (obj, key) => {
        const keys = key.split('.');
        let val = obj;
        for (const k of keys) {
            if (val && typeof val === 'object' && k in val) {
                val = val[k];
            } else {
                return undefined;
            }
        }
        return typeof val === 'string' ? val : undefined;
    };

    // Get translation: active locale → fallback (pt-BR) → key itself
    const t = (key, replacements) => {
        const val = resolve(strings, key) ?? resolve(fallbackStrings, key) ?? key;
        if (replacements && typeof val === 'string') {
            return val.replace(/\{(\w+)\}/g, (_, k) => replacements[k] ?? `{${k}}`);
        }
        return val;
    };

    // Auto-apply to all elements with data-i18n attributes
    const applyToDOM = () => {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translated = t(key);
            if (translated !== key) el.textContent = translated;
        });
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            const translated = t(key);
            if (translated !== key) el.title = translated;
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const translated = t(key);
            if (translated !== key) el.placeholder = translated;
        });
    };

    const getLang = () => currentLang;

    const setLang = async (lang) => {
        await init(lang);
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
