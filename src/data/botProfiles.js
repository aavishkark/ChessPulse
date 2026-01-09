
export const BOT_PROFILES = [
    {
        id: 'timmy',
        name: 'Timmy the Turtle',
        elo: 400,
        avatar: '/assets/bots/timmy.png',
        bio: 'A friendly beginner who loves simple moves and never rushes.',
        personality: 'Cheerful and encouraging, celebrates every good move you make.',
        catchphrases: [
            "I'm still learning too!",
            "Nice move! I didn't see that.",
            "Oops, I made a mistake again!",
            "Chess is so fun, isn't it?"
        ],
        engineConfig: {
            skillLevel: 0,
            depth: 5,
            thinkTimeMs: 500
        }
    },
    {
        id: 'roxy',
        name: 'Roxy Rapid',
        elo: 800,
        avatar: '/assets/bots/roxy.png',
        bio: 'An impatient player who moves fast and plays aggressively.',
        personality: 'Energetic and impulsive, always in a hurry to attack.',
        catchphrases: [
            "Come on, let's go!",
            "Too slow! I'm already thinking ahead.",
            "Attack attack attack!",
            "No time for boring moves!"
        ],
        engineConfig: {
            skillLevel: 2,
            depth: 8,
            thinkTimeMs: 400
        }
    },
    {
        id: 'professor',
        name: 'Professor Pawn',
        elo: 1200,
        avatar: '/assets/bots/professor.png',
        bio: 'A methodical teacher who plays by the book and loves theory.',
        personality: 'Patient and analytical, offers educational commentary.',
        catchphrases: [
            "Interesting choice. Let me consider...",
            "A classic opening! I approve.",
            "Structure is everything, my friend.",
            "Did you know this position was played in 1972?"
        ],
        engineConfig: {
            skillLevel: 6,
            depth: 12,
            thinkTimeMs: 1500
        }
    },
    {
        id: 'captain',
        name: 'Captain Aggro',
        elo: 1500,
        avatar: '/assets/bots/captain.png',
        bio: 'A hyper-aggressive attacker who sacrifices everything for the king.',
        personality: 'Bold and fearless, never backs down from a sacrifice.',
        catchphrases: [
            "Prepare yourself!",
            "I smell blood!",
            "Your king is mine!",
            "Defense? What's that?"
        ],
        engineConfig: {
            skillLevel: 10,
            depth: 14,
            thinkTimeMs: 1200
        }
    },
    {
        id: 'elena',
        name: 'Elena the Endgamer',
        elo: 1800,
        avatar: '/assets/bots/elena.png',
        bio: 'A strategic genius who loves trading pieces and grinding endgames.',
        personality: 'Calm and patient, excels in the late game.',
        catchphrases: [
            "Let's simplify...",
            "Every pawn matters now.",
            "The endgame is where games are won.",
            "Patience is a virtue."
        ],
        engineConfig: {
            skillLevel: 13,
            depth: 16,
            thinkTimeMs: 2000
        }
    },
    {
        id: 'grandmaster',
        name: 'Grandmaster Gideon',
        elo: 2400,
        avatar: '/assets/bots/grandmaster.png',
        bio: 'A silent, calculating master. Nearly perfect in every phase.',
        personality: 'Stoic and intimidating, rarely speaks but plays flawlessly.',
        catchphrases: [
            "...",
            "Hmm.",
            "Interesting.",
            "You have potential."
        ],
        engineConfig: {
            skillLevel: 18,
            depth: 20,
            thinkTimeMs: 3000
        }
    }
];

export const getBotById = (id) => BOT_PROFILES.find(bot => bot.id === id);

export const getBotsByEloRange = (minElo, maxElo) =>
    BOT_PROFILES.filter(bot => bot.elo >= minElo && bot.elo <= maxElo);

export const getRandomCatchphrase = (botId) => {
    const bot = getBotById(botId);
    if (!bot) return '';
    return bot.catchphrases[Math.floor(Math.random() * bot.catchphrases.length)];
};

export default BOT_PROFILES;
