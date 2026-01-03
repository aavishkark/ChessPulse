import axios from 'axios';
import { Chess } from 'chess.js';
import puzzleData from '../data/puzzles.json';

const LICHESS_API = 'https://lichess.org/api';

const lichessAxios = axios.create({
    baseURL: LICHESS_API,
    headers: {
        'Accept': 'application/json'
    }
});

const puzzleIndex = {
    byRating: {},
    byTheme: {},
    byMoveLength: {},
    byDifficulty: {},
    all: []
};

const DIFFICULTY_TIERS = {
    beginner: { min: 800, max: 1199 },
    intermediate: { min: 1200, max: 1599 },
    advanced: { min: 1600, max: 1999 },
    expert: { min: 2000, max: 2400 }
};

const MOVE_LENGTH_CATEGORIES = {
    oneMove: { min: 1, max: 2 },
    short: { min: 3, max: 4 },
    long: { min: 5, max: 6 },
    veryLong: { min: 7, max: Infinity }
};

function buildIndices() {
    puzzleIndex.all = puzzleData;

    for (let r = 800; r <= 2400; r += 100) {
        puzzleIndex.byRating[r] = [];
    }

    Object.keys(DIFFICULTY_TIERS).forEach(tier => {
        puzzleIndex.byDifficulty[tier] = [];
    });

    Object.keys(MOVE_LENGTH_CATEGORIES).forEach(cat => {
        puzzleIndex.byMoveLength[cat] = [];
    });

    puzzleData.forEach((puzzle, idx) => {
        const ratingBucket = Math.floor(puzzle.rating / 100) * 100;
        const clampedBucket = Math.max(800, Math.min(2400, ratingBucket));
        if (puzzleIndex.byRating[clampedBucket]) {
            puzzleIndex.byRating[clampedBucket].push(idx);
        }

        puzzle.themes.forEach(theme => {
            const themeLower = theme.toLowerCase();
            if (!puzzleIndex.byTheme[themeLower]) {
                puzzleIndex.byTheme[themeLower] = [];
            }
            puzzleIndex.byTheme[themeLower].push(idx);
        });

        const moveCount = puzzle.moves.length;
        for (const [category, range] of Object.entries(MOVE_LENGTH_CATEGORIES)) {
            if (moveCount >= range.min && moveCount <= range.max) {
                puzzleIndex.byMoveLength[category].push(idx);
                break;
            }
        }

        for (const [tier, range] of Object.entries(DIFFICULTY_TIERS)) {
            if (puzzle.rating >= range.min && puzzle.rating <= range.max) {
                puzzleIndex.byDifficulty[tier].push(idx);
                break;
            }
        }
    });

    console.log('Puzzle indices built:', {
        total: puzzleData.length,
        ratingBuckets: Object.entries(puzzleIndex.byRating).map(([k, v]) => `${k}: ${v.length}`).join(', '),
        themes: Object.keys(puzzleIndex.byTheme).length,
        difficulties: Object.entries(puzzleIndex.byDifficulty).map(([k, v]) => `${k}: ${v.length}`).join(', ')
    });
}

buildIndices();

let lastPuzzleIndex = -1;
let usedPuzzleIds = new Set();

function getRandomFromPool() {
    let index;
    do {
        index = Math.floor(Math.random() * puzzleIndex.all.length);
    } while (index === lastPuzzleIndex && puzzleIndex.all.length > 1);

    lastPuzzleIndex = index;
    return puzzleIndex.all[index];
}

function getRandomFromIndices(indices, excludeIds = new Set()) {
    if (!indices || indices.length === 0) return null;

    const available = excludeIds.size > 0
        ? indices.filter(idx => !excludeIds.has(puzzleIndex.all[idx].id))
        : indices;

    if (available.length === 0) return null;

    const randomIdx = available[Math.floor(Math.random() * available.length)];
    return puzzleIndex.all[randomIdx];
}

function intersectIndices(...indexArrays) {
    if (indexArrays.length === 0) return [];
    if (indexArrays.length === 1) return indexArrays[0];

    const sorted = [...indexArrays].sort((a, b) => a.length - b.length);
    let result = new Set(sorted[0]);

    for (let i = 1; i < sorted.length; i++) {
        const currentSet = new Set(sorted[i]);
        result = new Set([...result].filter(x => currentSet.has(x)));
    }

    return Array.from(result);
}

function transformPuzzle(data) {
    const puzzle = data.puzzle || {};
    const game = data.game || {};

    let fen = null;

    if (game.pgn) {
        fen = getFenFromPgn(game.pgn, puzzle.initialPly);
    }

    if (!fen) {
        return getRandomFromPool();
    }

    return {
        id: puzzle.id,
        fen: fen,
        moves: puzzle.solution || [],
        rating: puzzle.rating,
        themes: puzzle.themes || [],
        initialPly: puzzle.initialPly
    };
}

function getFenFromPgn(pgn, initialPly) {
    try {
        const game = new Chess();
        game.loadPgn(pgn);
        const history = game.history({ verbose: true });

        const newGame = new Chess();
        const targetPly = Math.min(initialPly + 1, history.length);

        for (let i = 0; i < targetPly && i < history.length; i++) {
            newGame.move(history[i].san);
        }

        return newGame.fen();
    } catch (e) {
        console.error('Error parsing PGN:', e);
        return null;
    }
}

export const puzzleService = {
    getDailyPuzzle: async () => {
        try {
            const response = await lichessAxios.get('/puzzle/daily');
            return transformPuzzle(response.data);
        } catch (error) {
            console.error('Error fetching daily puzzle:', error);
            return getRandomFromPool();
        }
    },

    getRandomPuzzle: async () => {
        return getRandomFromPool();
    },

    getPuzzlesBatch: async (count = 10) => {
        const puzzles = [];
        const usedIndices = new Set();

        while (puzzles.length < count && puzzles.length < puzzleIndex.all.length) {
            const index = Math.floor(Math.random() * puzzleIndex.all.length);
            if (!usedIndices.has(index)) {
                usedIndices.add(index);
                puzzles.push(puzzleIndex.all[index]);
            }
        }
        return puzzles;
    },

    getPuzzleByRating: async (targetRating, range = 200) => {
        const minRating = targetRating - range;
        const maxRating = targetRating + range;

        const matchingIndices = [];
        for (let bucket = Math.floor(minRating / 100) * 100; bucket <= maxRating; bucket += 100) {
            const clampedBucket = Math.max(800, Math.min(2400, bucket));
            if (puzzleIndex.byRating[clampedBucket]) {
                matchingIndices.push(...puzzleIndex.byRating[clampedBucket]);
            }
        }

        const exactMatch = matchingIndices.filter(idx => {
            const rating = puzzleIndex.all[idx].rating;
            return rating >= minRating && rating <= maxRating;
        });

        if (exactMatch.length > 0) {
            return getRandomFromIndices(exactMatch);
        }

        const sorted = [...puzzleIndex.all].sort(
            (a, b) => Math.abs(a.rating - targetRating) - Math.abs(b.rating - targetRating)
        );
        return sorted[Math.floor(Math.random() * Math.min(5, sorted.length))];
    },

    getPuzzleByTheme: async (theme) => {
        const themeLower = theme.toLowerCase();

        if (puzzleIndex.byTheme[themeLower]) {
            return getRandomFromIndices(puzzleIndex.byTheme[themeLower]);
        }

        for (const [indexedTheme, indices] of Object.entries(puzzleIndex.byTheme)) {
            if (indexedTheme.includes(themeLower) || themeLower.includes(indexedTheme)) {
                return getRandomFromIndices(indices);
            }
        }

        return getRandomFromPool();
    },

    getPuzzleByDifficulty: async (difficulty) => {
        const tier = difficulty.toLowerCase();
        if (puzzleIndex.byDifficulty[tier]) {
            return getRandomFromIndices(puzzleIndex.byDifficulty[tier]);
        }
        return getRandomFromPool();
    },

    getPuzzleByMoveLength: async (length) => {
        const category = length.toLowerCase();
        if (puzzleIndex.byMoveLength[category]) {
            return getRandomFromIndices(puzzleIndex.byMoveLength[category]);
        }
        return getRandomFromPool();
    },

    getPuzzleWithFilters: async (filters = {}) => {
        const { rating, ratingRange = 200, themes, moveLength, difficulty, exclude = [] } = filters;
        const excludeSet = new Set(exclude);

        let candidateIndices = null;

        if (difficulty && puzzleIndex.byDifficulty[difficulty.toLowerCase()]) {
            candidateIndices = puzzleIndex.byDifficulty[difficulty.toLowerCase()];
        }

        if (rating !== undefined) {
            const minRating = rating - ratingRange;
            const maxRating = rating + ratingRange;
            const ratingIndices = [];

            for (let bucket = Math.floor(minRating / 100) * 100; bucket <= maxRating; bucket += 100) {
                const clampedBucket = Math.max(800, Math.min(2400, bucket));
                if (puzzleIndex.byRating[clampedBucket]) {
                    ratingIndices.push(...puzzleIndex.byRating[clampedBucket]);
                }
            }

            const filteredRating = ratingIndices.filter(idx => {
                const r = puzzleIndex.all[idx].rating;
                return r >= minRating && r <= maxRating;
            });

            candidateIndices = candidateIndices
                ? intersectIndices(candidateIndices, filteredRating)
                : filteredRating;
        }

        if (themes && themes.length > 0) {
            const themeIndices = themes.map(t => puzzleIndex.byTheme[t.toLowerCase()] || []);
            const themeIntersection = intersectIndices(...themeIndices);

            candidateIndices = candidateIndices
                ? intersectIndices(candidateIndices, themeIntersection)
                : themeIntersection;
        }

        if (moveLength && puzzleIndex.byMoveLength[moveLength.toLowerCase()]) {
            const lengthIndices = puzzleIndex.byMoveLength[moveLength.toLowerCase()];
            candidateIndices = candidateIndices
                ? intersectIndices(candidateIndices, lengthIndices)
                : lengthIndices;
        }

        if (!candidateIndices) {
            return getRandomFromPool();
        }

        return getRandomFromIndices(candidateIndices, excludeSet) || getRandomFromPool();
    },

    getPuzzlesBatchWithFilters: async (count = 10, filters = {}) => {
        const puzzles = [];
        const usedIds = new Set();

        while (puzzles.length < count) {
            const puzzle = await puzzleService.getPuzzleWithFilters({
                ...filters,
                exclude: [...usedIds]
            });

            if (!puzzle || usedIds.has(puzzle.id)) {
                break;
            }

            usedIds.add(puzzle.id);
            puzzles.push(puzzle);
        }

        return puzzles;
    },

    getAvailableThemes: () => {
        return Object.keys(puzzleIndex.byTheme).sort();
    },

    getAvailableDifficulties: () => {
        return Object.keys(DIFFICULTY_TIERS);
    },

    getAvailableMoveLengths: () => {
        return Object.keys(MOVE_LENGTH_CATEGORIES);
    },

    getPuzzleCount: () => puzzleIndex.all.length,

    getPoolStats: () => {
        return {
            total: puzzleIndex.all.length,
            byDifficulty: Object.fromEntries(
                Object.entries(puzzleIndex.byDifficulty).map(([k, v]) => [k, v.length])
            ),
            byMoveLength: Object.fromEntries(
                Object.entries(puzzleIndex.byMoveLength).map(([k, v]) => [k, v.length])
            ),
            byRating: Object.fromEntries(
                Object.entries(puzzleIndex.byRating)
                    .filter(([k, v]) => v.length > 0)
                    .map(([k, v]) => [k, v.length])
            ),
            themeCount: Object.keys(puzzleIndex.byTheme).length,
            topThemes: Object.entries(puzzleIndex.byTheme)
                .sort((a, b) => b[1].length - a[1].length)
                .slice(0, 15)
                .map(([theme, indices]) => ({ theme, count: indices.length }))
        };
    },

    resetSession: () => {
        usedPuzzleIds.clear();
        lastPuzzleIndex = -1;
    }
};

export default puzzleService;
