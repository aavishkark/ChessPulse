// Stockfish Service - Real Stockfish WASM implementation
// Uses the actual Stockfish chess engine for realistic play strength and evaluation

import { Chess } from 'chess.js';

class StockfishService {
    constructor() {
        this.engine = null;
        this.isReady = false;
        this.isThinking = false;
        this.initPromise = null;
        this.pendingResolve = null;
        this.currentBestMove = null;
        this.taskQueue = [];
        this.isProcessingQueue = false;
        // Fast in-memory cache for evaluated positions (FEN -> score)
        this.evalCache = new Map();
    }

    async init() {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = new Promise((resolve, reject) => {
            try {
                if (typeof window === 'undefined') {
                    this.isReady = true;
                    resolve();
                    return;
                }

                // Create Web Worker with Stockfish
                this.engine = new Worker('/stockfish.js');

                let initialized = false;
                const timeoutId = setTimeout(() => {
                    if (!initialized) {
                        console.warn('Stockfish init timed out after 6s, marking ready with fallback');
                        this.isReady = true;
                        initialized = true;
                        resolve();
                    }
                }, 6000);

                const handleInitialMessages = (event) => {
                    const message = event.data;

                    if (typeof message === 'string') {
                        if (message === 'uciok') {
                            this.engine.postMessage('isready');
                        }

                        if (message === 'readyok') {
                            clearTimeout(timeoutId);
                            this.isReady = true;
                            initialized = true;
                            resolve();
                        }
                    }
                };

                this.engine.onmessage = (event) => {
                    const message = event.data;

                    if (typeof message === 'string') {
                        if (message === 'uciok') {
                            this.engine.postMessage('isready');
                        }

                        if (message === 'readyok' && !initialized) {
                            clearTimeout(timeoutId);
                            this.isReady = true;
                            initialized = true;
                            resolve();
                        }

                        // Best move found for bot play
                        if (message.startsWith('bestmove')) {
                            const parts = message.split(' ');
                            this.currentBestMove = parts[1];
                            this.isThinking = false;

                            if (this.pendingResolve) {
                                this.pendingResolve(this.currentBestMove);
                                this.pendingResolve = null;
                            }
                        }
                    }
                };

                this.engine.onerror = (error) => {
                    console.error('Stockfish worker error:', error);
                    clearTimeout(timeoutId);
                    // Do not completely reject so app can fallback gracefully
                    this.isReady = true;
                    resolve();
                };

                // Initialize UCI protocol
                this.engine.postMessage('uci');

                // Send isready directly after a short tick
                setTimeout(() => {
                    if (this.engine) {
                        this.engine.postMessage('isready');
                    }
                }, 250);

            } catch (error) {
                console.error('Failed to initialize Stockfish worker:', error);
                this.isReady = true;
                resolve();
            }
        });

        return this.initPromise;
    }

    // Set skill level (0-20, maps roughly to ELO)
    setSkillLevel(level) {
        if (!this.engine) return;
        const skillLevel = Math.max(0, Math.min(20, level));
        this.engine.postMessage(`setoption name Skill Level value ${skillLevel}`);
        if (skillLevel <= 5) {
            this.engine.postMessage('setoption name Slow Mover value 10');
        }
    }

    // Convert ELO to skill level (approximate mapping)
    eloToSkillLevel(elo) {
        if (elo <= 400) return 0;
        if (elo <= 600) return 1;
        if (elo <= 800) return 2;
        if (elo <= 1000) return 4;
        if (elo <= 1200) return 6;
        if (elo <= 1400) return 8;
        if (elo <= 1600) return 10;
        if (elo <= 1800) return 12;
        if (elo <= 2000) return 14;
        if (elo <= 2200) return 16;
        if (elo <= 2400) return 18;
        return 20;
    }

    // Get best move for position (used in Bot matches)
    async getBestMove(fen, options = {}) {
        await this.init();

        const {
            depth = 12,
            moveTime = 800,
            skillLevel = 20
        } = options;

        if (!this.engine || !this.isReady) {
            return this.getFallbackMove(fen);
        }

        return new Promise((resolve) => {
            this.isThinking = true;
            this.pendingResolve = resolve;

            this.setSkillLevel(skillLevel);
            this.engine.postMessage(`position fen ${fen}`);
            this.engine.postMessage(`go movetime ${moveTime} depth ${depth}`);

            setTimeout(() => {
                if (this.isThinking) {
                    this.stop();
                    if (this.currentBestMove) {
                        resolve(this.currentBestMove);
                    } else {
                        resolve(this.getFallbackMove(fen));
                    }
                }
            }, moveTime + 1800);
        });
    }

    async getMoveWithPersonality(fen, engineConfig) {
        const {
            depth = 10,
            thinkTimeMs = 1000,
            skillLevel
        } = engineConfig;

        const level = skillLevel !== undefined ? skillLevel : 10;

        return this.getBestMove(fen, {
            depth,
            moveTime: thinkTimeMs,
            skillLevel: level
        });
    }

    getFallbackMove(fen) {
        try {
            const game = new Chess(fen);
            const moves = game.moves();
            if (moves.length > 0) {
                const randomMove = moves[Math.floor(Math.random() * moves.length)];
                game.move(randomMove);
                const history = game.history({ verbose: true });
                const lastMove = history[history.length - 1];
                return lastMove.from + lastMove.to + (lastMove.promotion || '');
            }
        } catch (e) {
            console.error('Fallback move error:', e);
        }
        return null;
    }

    // Evaluate position using Stockfish
    // ALWAYS normalized to White's perspective (positive = White ahead, negative = Black ahead)
    async evaluatePosition(fen, depth = 12, movetime = null) {
        // Fast instant cache lookup
        const cacheKey = `${fen}_${depth}`;
        if (this.evalCache.has(cacheKey)) {
            return this.evalCache.get(cacheKey);
        }

        // Instant rule-based check for game termination without requiring engine search
        try {
            const testGame = new Chess(fen);
            if (testGame.isCheckmate()) {
                const sideToMove = testGame.turn(); // 'w' or 'b'
                const mateScore = sideToMove === 'w' ? -99.0 : 99.0;
                this.evalCache.set(cacheKey, mateScore);
                return mateScore;
            }
            if (testGame.isDraw() || testGame.isStalemate() || testGame.isThreefoldRepetition() || testGame.isInsufficientMaterial()) {
                this.evalCache.set(cacheKey, 0.0);
                return 0.0;
            }
        } catch (e) {
            // Ignore parsing error, proceed to engine
        }

        await this.init();

        if (!this.engine || !this.isReady) {
            const matScore = this.getMaterialCount(fen);
            this.evalCache.set(cacheKey, matScore);
            return matScore;
        }

        // Determine whose turn it is from FEN
        const fenParts = fen.split(' ');
        const sideToMove = fenParts[1] || 'w';

        return new Promise((resolve) => {
            // Queue evaluation task so sequential calls don't collide on the single worker
            this.taskQueue.push({
                fen,
                depth,
                movetime,
                sideToMove,
                cacheKey,
                resolve
            });

            this.processQueue();
        });
    }

    async processQueue() {
        if (this.isProcessingQueue || this.taskQueue.length === 0) return;
        this.isProcessingQueue = true;

        const task = this.taskQueue.shift();
        const { fen, depth, movetime, sideToMove, cacheKey, resolve } = task;

        // Check cache once again in case an earlier task already evaluated this position
        if (this.evalCache.has(cacheKey)) {
            resolve(this.evalCache.get(cacheKey));
            this.isProcessingQueue = false;
            this.processQueue();
            return;
        }

        let lastScore = 0;
        let foundScore = false;
        let resolved = false;

        const cleanupAndResolve = (rawScore) => {
            if (resolved) return;
            resolved = true;
            this.engine.removeEventListener('message', messageHandler);

            let finalScore = Number(rawScore);
            if (isNaN(finalScore)) finalScore = 0;

            // Round to 2 decimal places
            finalScore = Math.round(finalScore * 100) / 100;
            // Clamp to [-99, 99]
            finalScore = Math.max(-99, Math.min(99, finalScore));

            this.evalCache.set(cacheKey, finalScore);
            resolve(finalScore);

            this.isProcessingQueue = false;
            // Process next queued evaluation
            setTimeout(() => this.processQueue(), 10);
        };

        const messageHandler = (event) => {
            if (resolved) return;
            const message = event.data;

            if (typeof message === 'string' && message.includes('info') && message.includes('score')) {
                const scoreMatch = message.match(/score (cp|mate) (-?\d+)/);
                if (scoreMatch) {
                    const scoreType = scoreMatch[1];
                    const scoreValue = parseInt(scoreMatch[2], 10);

                    if (scoreType === 'cp') {
                        // Centipawns to pawns
                        lastScore = scoreValue / 100;
                    } else if (scoreType === 'mate') {
                        // Mate in X moves from side to move's perspective
                        if (scoreValue === 0) {
                            lastScore = -99;
                        } else if (scoreValue > 0) {
                            lastScore = 99;
                        } else {
                            lastScore = -99;
                        }
                    }
                    foundScore = true;
                }
            }

            if (typeof message === 'string' && message.startsWith('bestmove')) {
                if (foundScore) {
                    // UCI score is from side-to-move's perspective
                    // Normalize to White's perspective
                    const whiteScore = sideToMove === 'b' ? -lastScore : lastScore;
                    cleanupAndResolve(whiteScore);
                } else {
                    // Fallback to material count (which is already from White's perspective)
                    const matScore = this.getMaterialCount(fen);
                    cleanupAndResolve(matScore);
                }
            }
        };

        this.engine.addEventListener('message', messageHandler);

        // Tell engine position and start search
        this.engine.postMessage(`position fen ${fen}`);

        if (movetime) {
            this.engine.postMessage(`go movetime ${movetime}`);
        } else {
            this.engine.postMessage(`go depth ${depth}`);
        }

        // Safety timeout
        const timeoutMs = movetime ? movetime + 1500 : Math.max(3000, depth * 400);
        setTimeout(() => {
            if (!resolved) {
                if (foundScore) {
                    const whiteScore = sideToMove === 'b' ? -lastScore : lastScore;
                    cleanupAndResolve(whiteScore);
                } else {
                    cleanupAndResolve(this.getMaterialCount(fen));
                }
            }
        }, timeoutMs);
    }

    // Realistic piece-square & material positional fallback (always White perspective)
    getMaterialCount(fen) {
        const pieceValues = { p: 1, n: 3.1, b: 3.25, r: 5, q: 9, k: 0 };
        let score = 0;

        const boardPart = fen.split(' ')[0] || '';
        for (const char of boardPart) {
            const lower = char.toLowerCase();
            if (pieceValues[lower] !== undefined) {
                // Uppercase is White (positive), lowercase is Black (negative)
                if (char === char.toUpperCase() && char !== char.toLowerCase()) {
                    score += pieceValues[lower];
                } else if (char === lower) {
                    score -= pieceValues[lower];
                }
            }
        }

        return Math.round(score * 100) / 100;
    }

    stop() {
        if (this.engine) {
            this.engine.postMessage('stop');
            this.isThinking = false;
        }
    }

    reset() {
        if (this.engine) {
            this.engine.postMessage('ucinewgame');
            this.engine.postMessage('isready');
        }
        this.taskQueue = [];
        this.isProcessingQueue = false;
        this.evalCache.clear();
    }

    destroy() {
        if (this.engine) {
            this.engine.terminate();
            this.engine = null;
        }
        this.isReady = false;
        this.initPromise = null;
        this.taskQueue = [];
        this.isProcessingQueue = false;
        this.evalCache.clear();
    }
}

// Singleton instance
let stockfishInstance = null;

export const getStockfishService = async () => {
    if (!stockfishInstance) {
        stockfishInstance = new StockfishService();
    }
    await stockfishInstance.init();
    return stockfishInstance;
};

export const destroyStockfishService = () => {
    if (stockfishInstance) {
        stockfishInstance.destroy();
        stockfishInstance = null;
    }
};

export default StockfishService;
