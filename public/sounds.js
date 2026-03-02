// ============================================================
// PullCards – Procedural Fantasy Sound Engine (Web Audio API)
// ============================================================

const SoundEngine = (() => {
    let ctx = null;

    const getCtx = () => {
        if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    };

    // --- Utility: play a tone ---
    const playTone = (freq, duration, type = 'sine', volume = 0.3, delay = 0) => {
        const c = getCtx();
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, c.currentTime + delay);
        gain.gain.setValueAtTime(volume, c.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(c.currentTime + delay);
        osc.stop(c.currentTime + delay + duration);
    };

    // --- Utility: noise burst ---
    const playNoise = (duration, volume = 0.15, delay = 0) => {
        const c = getCtx();
        const bufSize = c.sampleRate * duration;
        const buf = c.createBuffer(1, bufSize, c.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const src = c.createBufferSource();
        src.buffer = buf;
        const gain = c.createGain();
        const filter = c.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        gain.gain.setValueAtTime(volume, c.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(c.destination);
        src.start(c.currentTime + delay);
    };

    // ============================================================
    // SOUND EFFECTS
    // ============================================================

    // Coins clink
    const coinPay = () => {
        playTone(2400, 0.08, 'square', 0.1);
        playTone(3200, 0.06, 'square', 0.08, 0.06);
        playTone(4000, 0.1, 'sine', 0.06, 0.1);
    };

    // Dice tumbling (rattling)
    const diceRoll = () => {
        for (let i = 0; i < 12; i++) {
            const freq = 200 + Math.random() * 600;
            const d = i * 0.12 + Math.random() * 0.05;
            playNoise(0.04, 0.08 + Math.random() * 0.08, d);
            playTone(freq, 0.03, 'square', 0.04, d);
        }
    };

    // Dice lands (impact)
    const diceLand = () => {
        playNoise(0.08, 0.2);
        playTone(150, 0.15, 'sine', 0.25);
        playTone(100, 0.2, 'sine', 0.15, 0.05);
    };

    // --- Table Results ---

    // Table A: soft mystical chime
    const tableA = () => {
        playTone(523, 0.4, 'sine', 0.15);
        playTone(659, 0.5, 'sine', 0.12, 0.15);
        playTone(784, 0.6, 'sine', 0.1, 0.3);
    };

    // Table B: deeper resonant horn
    const tableB = () => {
        playTone(220, 0.6, 'sawtooth', 0.08);
        playTone(330, 0.5, 'sine', 0.12, 0.1);
        playTone(440, 0.4, 'sine', 0.15, 0.25);
        playTone(220, 0.8, 'triangle', 0.1, 0.15);
    };

    // Table C: thunderous rumble + dramatic chord
    const tableC = () => {
        playNoise(0.8, 0.25);
        playTone(55, 0.6, 'sawtooth', 0.15);
        playTone(110, 0.5, 'sawtooth', 0.12, 0.1);
        playTone(65, 1.0, 'sine', 0.2);
        playTone(330, 0.6, 'sine', 0.1, 0.3);
        playTone(440, 0.5, 'sine', 0.12, 0.4);
        playTone(554, 0.7, 'sine', 0.08, 0.5);
    };

    // --- Tier Results ---

    // Tier C: simple low chime
    const tierC = () => {
        playTone(330, 0.3, 'sine', 0.1);
        playTone(262, 0.4, 'sine', 0.08, 0.15);
    };

    // Tier B: mystical ascending chime
    const tierB = () => {
        playTone(392, 0.3, 'sine', 0.12);
        playTone(494, 0.3, 'sine', 0.12, 0.12);
        playTone(588, 0.4, 'sine', 0.1, 0.24);
        playTone(784, 0.5, 'triangle', 0.08, 0.36);
    };

    // Tier A: epic horn fanfare
    const tierA = () => {
        playTone(440, 0.3, 'sawtooth', 0.06);
        playTone(440, 0.3, 'sine', 0.12);
        playTone(554, 0.25, 'sine', 0.12, 0.15);
        playTone(659, 0.3, 'sine', 0.14, 0.3);
        playTone(880, 0.6, 'sine', 0.12, 0.45);
        playTone(880, 0.6, 'triangle', 0.06, 0.45);
    };

    // Critical/Tier S: legendary fanfare explosion
    const tierS = () => {
        playNoise(0.3, 0.2);
        playTone(65, 0.4, 'sawtooth', 0.12);
        // Rising fanfare
        playTone(440, 0.2, 'sine', 0.12, 0.1);
        playTone(554, 0.2, 'sine', 0.14, 0.2);
        playTone(659, 0.2, 'sine', 0.14, 0.3);
        playTone(880, 0.3, 'sine', 0.16, 0.4);
        playTone(1047, 0.5, 'sine', 0.14, 0.55);
        // Harmonic sustain
        playTone(880, 0.8, 'triangle', 0.08, 0.6);
        playTone(1047, 0.8, 'triangle', 0.06, 0.65);
        playTone(1319, 1.0, 'sine', 0.06, 0.7);
    };

    // Card flip whoosh
    const cardFlip = () => {
        const c = getCtx();
        const bufSize = c.sampleRate * 0.25;
        const buf = c.createBuffer(1, bufSize, c.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
        }
        const src = c.createBufferSource();
        src.buffer = buf;
        const filter = c.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        filter.Q.value = 0.8;
        const gain = c.createGain();
        gain.gain.setValueAtTime(0.12, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(c.destination);
        src.start();
    };

    // Card reveal shimmer
    const cardReveal = (tier) => {
        const freqs = {
            C: [330, 392],
            B: [392, 494, 588],
            A: [523, 659, 784, 988],
            S: [523, 659, 784, 988, 1175, 1319],
        };
        const notes = freqs[tier] || freqs.C;
        notes.forEach((f, i) => {
            playTone(f, 0.5 + i * 0.1, 'sine', 0.06, i * 0.08);
        });
    };

    // Ambient ritual hum (continuous)
    const startRitualHum = () => {
        const c = getCtx();
        const osc1 = c.createOscillator();
        const osc2 = c.createOscillator();
        const gain = c.createGain();
        osc1.type = 'sine';
        osc1.frequency.value = 82;
        osc2.type = 'sine';
        osc2.frequency.value = 123;
        gain.gain.value = 0;
        gain.gain.linearRampToValueAtTime(0.04, c.currentTime + 1);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(c.destination);
        osc1.start();
        osc2.start();
        return {
            stop: () => {
                gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.5);
                setTimeout(() => { osc1.stop(); osc2.stop(); }, 600);
            }
        };
    };

    // Narration typewriter tick
    const typewriterTick = () => {
        playTone(1800 + Math.random() * 400, 0.015, 'square', 0.02);
    };

    return {
        coinPay, diceRoll, diceLand,
        tableA, tableB, tableC,
        tierC, tierB, tierA, tierS,
        cardFlip, cardReveal,
        startRitualHum, typewriterTick,
    };
})();
