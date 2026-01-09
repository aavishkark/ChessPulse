// Stockfish Service - Real Stockfish WASM implementation
// Uses the actual Stockfish chess engine for realistic play strength

class StockfishService {
    constructor() {
        this.engine = null;
        this.isReady = false;
        this.isThinking = false;
        this.pendingResolve = null;
        this.currentBestMove = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            try {
                // Create Web Worker with Stockfish
                this.engine = new Worker('/stockfish.js');

                this.engine.onmessage = (event) => {
                    const message = event.data;

                    // Engine is ready
                    if (message === 'uciok') {
                        this.isReady = true;
                        console.log('Stockfish engine ready');
                    }

                    // Best move found
                    if (message.startsWith('bestmove')) {
                        const parts = message.split(' ');
                        this.currentBestMove = parts[1];
                        this.isThinking = false;

                        if (this.pendingResolve) {
                            this.pendingResolve(this.currentBestMove);
                            this.pendingResolve = null;
                        }
                    }

                    // Ready for new game
                    if (message === 'readyok') {
                        resolve();
                    }
                };

                this.engine.onerror = (error) => {
                    console.error('Stockfish worker error:', error);
                    reject(error);
                };

                // Initialize UCI protocol
                this.engine.postMessage('uci');

                // Wait a bit for uciok then send isready
                setTimeout(() => {
                    this.engine.postMessage('isready');
                }, 500);

            } catch (error) {
                console.error('Failed to initialize Stockfish:', error);
                reject(error);
            }
        });
    }

    // Set skill level (0-20, maps roughly to ELO)
    // Level 0 = ~800 ELO, Level 20 = ~3000+ ELO
    setSkillLevel(level) {
        if (!this.engine) return;

        // Clamp to valid range
        const skillLevel = Math.max(0, Math.min(20, level));
        this.engine.postMessage(`setoption name Skill Level value ${skillLevel}`);

        // Also set some randomness for lower levels
        // At skill 0, limit depth and add move overhead
        if (skillLevel <= 5) {
            this.engine.postMessage('setoption name Slow Mover value 10');
        }
    }

    // Convert ELO to skill level (approximate mapping)
    eloToSkillLevel(elo) {
        // Stockfish Skill Level to ELO mapping (approximate):
        // Level 0: ~800, Level 5: ~1200, Level 10: ~1600
        // Level 15: ~2000, Level 20: ~2800+

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

    // Get best move for position
    async getBestMove(fen, options = {}) {
        const {
            depth = 15,
            moveTime = 1000,
            skillLevel = 20
        } = options;

        if (!this.engine || !this.isReady) {
            console.warn('Stockfish not ready, using fallback');
            return this.getFallbackMove(fen);
        }

        return new Promise((resolve) => {
            this.isThinking = true;
            this.pendingResolve = resolve;

            // Set skill level
            this.setSkillLevel(skillLevel);

            // Set position
            this.engine.postMessage(`position fen ${fen}`);

            // Start search with time limit
            this.engine.postMessage(`go movetime ${moveTime} depth ${depth}`);

            // Timeout fallback
            setTimeout(() => {
                if (this.isThinking) {
                    this.stop();
                    if (this.currentBestMove) {
                        resolve(this.currentBestMove);
                    } else {
                        resolve(this.getFallbackMove(fen));
                    }
                }
            }, moveTime + 2000);
        });
    }

    // Get move with bot personality configuration
    async getMoveWithPersonality(fen, engineConfig) {
        const {
            depth = 10,
            thinkTimeMs = 1000,
            skillLevel
        } = engineConfig;

        // Calculate skill level from config or use provided
        const level = skillLevel !== undefined ? skillLevel : 10;

        return this.getBestMove(fen, {
            depth,
            moveTime: thinkTimeMs,
            skillLevel: level
        });
    }

    // Fallback move generator if Stockfish fails
    getFallbackMove(fen) {
        try {
            const { Chess } = require('chess.js');
            const game = new Chess(fen);
            const moves = game.moves();
            if (moves.length > 0) {
                const randomMove = moves[Math.floor(Math.random() * moves.length)];
                // Convert SAN to UCI format
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

    // Evaluate position using actual Stockfish analysis
    // IMPORTANT: UCI evaluation is from the perspective of the side to move
    // We normalize it to always be from White's perspective (positive = White winning)
    // depth: search depth (higher = more accurate but slower). Default 18 for deep analysis.
    // movetime: optional time in ms to search (overrides depth if provided)
    async evaluatePosition(fen, depth = 18, movetime = null) {
        if (!this.engine || !this.isReady) {
            console.warn('Stockfish not ready, using material count fallback');
            return this.getMaterialCount(fen);
        }

        // Determine whose turn it is from FEN
        const fenParts = fen.split(' ');
        const sideToMove = fenParts[1] || 'w'; // 'w' or 'b'

        return new Promise((resolve) => {
            let lastScore = 0;
            let foundScore = false;
            let resolved = false;

            const messageHandler = (event) => {
                if (resolved) return;
                const message = event.data;

                // Parse info lines for score
                if (typeof message === 'string' && message.includes('info') && message.includes('score')) {
                    const scoreMatch = message.match(/score (cp|mate) (-?\d+)/);
                    if (scoreMatch) {
                        const scoreType = scoreMatch[1];
                        const scoreValue = parseInt(scoreMatch[2]);

                        if (scoreType === 'cp') {
                            // Centipawns to pawns
                            lastScore = scoreValue / 100;
                        } else if (scoreType === 'mate') {
                            // Mate in X moves - use high value
                            lastScore = scoreValue > 0 ? 99 : -99;
                        }
                        foundScore = true;
                    }
                }

                // Best move received - search complete
                if (typeof message === 'string' && message.startsWith('bestmove')) {
                    resolved = true;
                    this.engine.removeEventListener('message', messageHandler);

                    let finalScore = foundScore ? lastScore : this.getMaterialCount(fen);

                    // CRITICAL: UCI evaluation is from side-to-move's perspective
                    // If it's Black's turn, flip the sign to get White's perspective
                    if (sideToMove === 'b') {
                        finalScore = -finalScore;
                    }

                    resolve(finalScore);
                }
            };

            this.engine.addEventListener('message', messageHandler);

            // Send commands to engine
            this.engine.postMessage('ucinewgame');
            this.engine.postMessage(`position fen ${fen}`);

            // Use movetime if specified, otherwise use depth
            if (movetime) {
                this.engine.postMessage(`go movetime ${movetime}`);
            } else {
                this.engine.postMessage(`go depth ${depth}`);
            }

            // Timeout fallback - 10 seconds max for deep analysis
            const timeoutMs = movetime ? movetime + 2000 : 10000;
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    this.engine.removeEventListener('message', messageHandler);

                    let fallbackScore = foundScore ? lastScore : this.getMaterialCount(fen);

                    // Flip for Black's turn
                    if (sideToMove === 'b') {
                        fallbackScore = -fallbackScore;
                    }

                    resolve(fallbackScore);
                }
            }, timeoutMs);
        });
    }

    // Simple material count fallback
    getMaterialCount(fen) {
        const pieceValues = { p: 1, n: 3, b: 3.2, r: 5, q: 9, k: 0 };
        let score = 0;

        for (const char of fen.split(' ')[0]) {
            const lower = char.toLowerCase();
            if (pieceValues[lower] !== undefined) {
                score += char === lower ? -pieceValues[lower] : pieceValues[lower];
            }
        }

        return score;
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
    }

    destroy() {
        if (this.engine) {
            this.engine.terminate();
            this.engine = null;
        }
        this.isReady = false;
    }
}

// Singleton instance
let stockfishInstance = null;

export const getStockfishService = async () => {
    if (!stockfishInstance) {
        stockfishInstance = new StockfishService();
        try {
            await stockfishInstance.init();
        } catch (error) {
            console.error('Failed to initialize Stockfish, using fallback mode');
            // Return instance even if init fails - it will use fallback moves
        }
    }
    return stockfishInstance;
};

export const destroyStockfishService = () => {
    if (stockfishInstance) {
        stockfishInstance.destroy();
        stockfishInstance = null;
    }
};

export default StockfishService;
