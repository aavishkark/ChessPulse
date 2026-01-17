const SOUND_URLS = {
    standard: {
        move: 'https://lichess1.org/assets/sound/standard/Move.ogg',
        capture: 'https://lichess1.org/assets/sound/standard/Capture.ogg',
        check: 'https://lichess1.org/assets/sound/standard/Check.ogg',
        castle: 'https://lichess1.org/assets/sound/standard/Castle.ogg',
        promote: 'https://lichess1.org/assets/sound/standard/Promote.ogg',
        gameEnd: 'https://lichess1.org/assets/sound/standard/GenericNotify.ogg',
    },
    wood: {
        move: 'https://lichess1.org/assets/sound/wood/Move.ogg',
        capture: 'https://lichess1.org/assets/sound/wood/Capture.ogg',
        check: 'https://lichess1.org/assets/sound/wood/Check.ogg',
        castle: 'https://lichess1.org/assets/sound/wood/Castle.ogg',
        promote: 'https://lichess1.org/assets/sound/wood/Promote.ogg',
        gameEnd: 'https://lichess1.org/assets/sound/standard/GenericNotify.ogg',
    },
    arcade: {
        move: 'https://lichess1.org/assets/sound/robot/Move.ogg',
        capture: 'https://lichess1.org/assets/sound/robot/Capture.ogg',
        check: 'https://lichess1.org/assets/sound/robot/Check.ogg',
        castle: 'https://lichess1.org/assets/sound/robot/Castle.ogg',
        promote: 'https://lichess1.org/assets/sound/robot/Promote.ogg',
        gameEnd: 'https://lichess1.org/assets/sound/standard/GenericNotify.ogg',
    },
};

export const SOUND_THEMES = [
    { id: 'standard', name: 'Standard' },
    { id: 'wood', name: 'Wood' },
    { id: 'arcade', name: 'Arcade' },
    { id: 'silent', name: 'Silent' },
];

// Audio cache to prevent repeated loading
const audioCache = {};

const getAudio = (url) => {
    if (!audioCache[url]) {
        audioCache[url] = new Audio(url);
    }
    return audioCache[url];
};

export const playSound = (type, soundTheme, soundEnabled) => {
    console.log('[Sound] playSound called:', { type, soundTheme, soundEnabled });

    if (!soundEnabled || soundTheme === 'silent') {
        console.log('[Sound] Skipped: sounds disabled or silent theme');
        return;
    }

    const theme = SOUND_URLS[soundTheme] || SOUND_URLS.standard;
    const url = theme[type];
    console.log('[Sound] Playing URL:', url);

    if (url) {
        try {
            const audio = getAudio(url);
            audio.currentTime = 0;
            audio.volume = 0.5;
            audio.play().catch((e) => {
                console.warn('[Sound] Playback blocked:', e.message);
            });
        } catch (e) {
            console.warn('Sound playback failed:', e);
        }
    }
};

export const getMoveSound = (move, isCapture, isCheck, isCastle, isPromotion) => {
    if (isCheck) return 'check';
    if (isPromotion) return 'promote';
    if (isCastle) return 'castle';
    if (isCapture) return 'capture';
    return 'move';
};
