const BASE_SOUND_URL = 'https://lichess1.org/assets/sound';

const makeThemeUrls = (folder) => ({
  move: `${BASE_SOUND_URL}/${folder}/Move.ogg`,
  capture: `${BASE_SOUND_URL}/${folder}/Capture.ogg`,
  check: `${BASE_SOUND_URL}/${folder}/Check.ogg`,
  castle: `${BASE_SOUND_URL}/${folder}/Confirmation.ogg`,
  promote: `${BASE_SOUND_URL}/${folder}/Confirmation.ogg`,
  gameEnd: `${BASE_SOUND_URL}/${folder}/GenericNotify.ogg`,
  victory: `${BASE_SOUND_URL}/${folder}/Victory.ogg`,
  defeat: `${BASE_SOUND_URL}/${folder}/Defeat.ogg`,
  draw: `${BASE_SOUND_URL}/${folder}/Draw.ogg`,
});

const SOUND_URLS = {
  standard: makeThemeUrls('standard'),
  woodland: makeThemeUrls('woodland'),
  robot: makeThemeUrls('robot'),
  piano: makeThemeUrls('piano'),
  nes: makeThemeUrls('nes'),
  sfx: makeThemeUrls('sfx'),
  futuristic: makeThemeUrls('futuristic'),
};

// Aliases for backwards compatibility with previously saved settings
SOUND_URLS.wood = SOUND_URLS.woodland;
SOUND_URLS.arcade = SOUND_URLS.robot;

export const SOUND_THEMES = [
  { id: 'standard', name: 'Standard (Modern)', desc: 'Clean tactile clicks' },
  { id: 'woodland', name: 'Woodland (Acoustic)', desc: 'Organic wooden board' },
  { id: 'robot', name: 'Robot (Cybernetic)', desc: 'Crisp synthetic response' },
  { id: 'piano', name: 'Piano (Melodic)', desc: 'Harmonic acoustic notes' },
  { id: 'nes', name: 'NES (8-Bit Retro)', desc: 'Classic chiptune effects' },
  { id: 'sfx', name: 'SFX (Studio)', desc: 'Cinematic dynamic impact' },
  { id: 'futuristic', name: 'Futuristic', desc: 'Sleek telemetry chimes' },
  { id: 'silent', name: 'Silent (Mute)', desc: 'No sound effects' },
];

export const playSound = (type, soundTheme = 'standard', soundEnabled = true) => {
  if (!soundEnabled || soundTheme === 'silent') {
    return;
  }

  const themeKey = soundTheme === 'wood' ? 'woodland' : soundTheme === 'arcade' ? 'robot' : soundTheme;
  const theme = SOUND_URLS[themeKey] || SOUND_URLS.standard;
  const url = theme[type] || theme.move;

  if (url) {
    try {
      const audio = new Audio(url);
      audio.volume = 0.6;
      const promise = audio.play();
      if (promise !== undefined) {
        promise.catch(() => {
          // Ignore browser autoplay restrictions if user hasn't interacted yet
        });
      }
    } catch (e) {
      console.warn('[Sound] Playback error:', e);
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
