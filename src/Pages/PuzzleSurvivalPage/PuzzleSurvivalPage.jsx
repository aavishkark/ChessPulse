import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useAuth } from '../../contexts/AuthContext';
import { puzzleService } from '../../services/puzzleService';
import './puzzleSurvival.css';

const DIFFICULTY_OPTIONS = {
    'all': { label: 'All Levels', description: 'Mixed', icon: '🎲' },
    'beginner': { label: 'Beginner', description: '800-1199', icon: '🌱' },
    'intermediate': { label: 'Intermediate', description: '1200-1599', icon: '📈' },
    'advanced': { label: 'Advanced', description: '1600-1999', icon: '🔥' },
    'expert': { label: 'Expert', description: '2000-2400', icon: '👑' }
};

const PuzzleSurvivalPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [gameState, setGameState] = useState('ready');
    const [lives, setLives] = useState(3);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(() => {
        const saved = localStorage.getItem('survivalBestStreak');
        return saved ? parseInt(saved, 10) : 0;
    });
    const [currentPuzzle, setCurrentPuzzle] = useState(null);
    const [game, setGame] = useState(null);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [orientation, setOrientation] = useState('white');
    const [lastMove, setLastMove] = useState(null);
    const [feedbackStatus, setFeedbackStatus] = useState(null);
    const [isLoadingPuzzle, setIsLoadingPuzzle] = useState(false);
    const [showTurnOverlay, setShowTurnOverlay] = useState(false);
    const [difficulty, setDifficulty] = useState('all');

    const loadNewPuzzle = useCallback(async (selectedDifficulty) => {
        setIsLoadingPuzzle(true);
        setLastMove(null);
        setFeedbackStatus(null);

        try {
            const filters = selectedDifficulty && selectedDifficulty !== 'all'
                ? { difficulty: selectedDifficulty }
                : {};
            const puzzle = await puzzleService.getPuzzleWithFilters(filters);
            setCurrentPuzzle(puzzle);

            const newGame = new Chess(puzzle.fen);

            if (puzzle.moves && puzzle.moves.length > 0) {
                const firstMove = puzzle.moves[0];
                const moveResult = makeUciMove(newGame, firstMove);
                if (moveResult) {
                    setLastMove({ from: firstMove.substring(0, 2), to: firstMove.substring(2, 4) });
                    setCurrentMoveIndex(1);
                } else {
                    setCurrentMoveIndex(0);
                }
            } else {
                setCurrentMoveIndex(0);
            }

            setGame(newGame);

            const setupTurn = new Chess(puzzle.fen).turn();
            setOrientation(setupTurn === 'w' ? 'black' : 'white');

            setShowTurnOverlay(true);
            setTimeout(() => setShowTurnOverlay(false), 1000);
        } catch (error) {
            console.error('Error loading puzzle:', error);
        } finally {
            setIsLoadingPuzzle(false);
        }
    }, []);

    const startGame = async () => {
        setGameState('playing');
        setLives(3);
        setStreak(0);
        puzzleService.resetSession();
        await loadNewPuzzle(difficulty);
    };

    const makeUciMove = (chessGame, uciMove) => {
        if (!uciMove || uciMove.length < 4) return null;
        const from = uciMove.substring(0, 2);
        const to = uciMove.substring(2, 4);
        const promotion = uciMove.length > 4 ? uciMove[4] : undefined;
        return chessGame.move({ from, to, promotion });
    };

    const handleCorrectMove = useCallback(async () => {
        setFeedbackStatus('correct');
        setStreak(prev => {
            const newStreak = prev + 1;
            if (newStreak > bestStreak) {
                setBestStreak(newStreak);
                localStorage.setItem('survivalBestStreak', newStreak.toString());
            }
            return newStreak;
        });

        setTimeout(async () => {
            setFeedbackStatus(null);
            await loadNewPuzzle(difficulty);
        }, 500);
    }, [loadNewPuzzle, difficulty, bestStreak]);

    const handleWrongMove = useCallback(() => {
        setFeedbackStatus('wrong');

        if (currentPuzzle && game) {
            const correctMove = currentPuzzle.moves[currentMoveIndex];
            if (correctMove) {
                const moveResult = makeUciMove(game, correctMove);
                if (moveResult) {
                    setGame(new Chess(game.fen()));
                    setLastMove({
                        from: correctMove.substring(0, 2),
                        to: correctMove.substring(2, 4)
                    });
                }
            }
        }

        setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) {
                setTimeout(() => {
                    setGameState('finished');
                    setFeedbackStatus(null);
                }, 800);
            } else {
                setTimeout(async () => {
                    setFeedbackStatus(null);
                    await loadNewPuzzle(difficulty);
                }, 800);
            }
            return newLives;
        });
    }, [loadNewPuzzle, difficulty, currentPuzzle, game, currentMoveIndex]);

    const onDrop = useCallback((moveData) => {
        if (gameState !== 'playing' || !game || !currentPuzzle || isLoadingPuzzle) return false;

        const sourceSquare = moveData?.sourceSquare || moveData?.from;
        const targetSquare = moveData?.targetSquare || moveData?.to;
        const piece = moveData?.piece;

        if (!sourceSquare || !targetSquare) return false;

        if (sourceSquare === targetSquare) return false;

        const expectedMove = currentPuzzle.moves[currentMoveIndex];
        if (!expectedMove) return false;

        const moveStr = sourceSquare + targetSquare;
        const isPawn = piece?.toLowerCase?.().includes('p') || String(piece)?.toLowerCase?.().includes('p');
        const isPromotion = isPawn && (targetSquare[1] === '8' || targetSquare[1] === '1');
        const promotion = isPromotion ? 'q' : undefined;

        const expectedMoveStr = expectedMove.substring(0, 4);
        const playerMoveWithPromo = promotion ? moveStr + promotion : moveStr;

        if (moveStr === expectedMoveStr || playerMoveWithPromo === expectedMove) {
            try {
                const move = game.move({
                    from: sourceSquare,
                    to: targetSquare,
                    promotion: promotion || expectedMove[4]
                });

                if (!move) return false;

                setGame(new Chess(game.fen()));
                setLastMove({ from: sourceSquare, to: targetSquare });

                const nextMoveIndex = currentMoveIndex + 1;
                setCurrentMoveIndex(nextMoveIndex);

                if (nextMoveIndex >= currentPuzzle.moves.length) {
                    handleCorrectMove();
                    return true;
                }

                setTimeout(() => {
                    const opponentMove = currentPuzzle.moves[nextMoveIndex];
                    if (opponentMove) {
                        const moveResult = makeUciMove(game, opponentMove);
                        if (moveResult) {
                            setGame(new Chess(game.fen()));
                            setCurrentMoveIndex(nextMoveIndex + 1);
                            setLastMove({
                                from: opponentMove.substring(0, 2),
                                to: opponentMove.substring(2, 4)
                            });
                        }
                    }
                }, 200);

                return true;
            } catch (err) {
                return false;
            }
        } else {
            handleWrongMove();
            return false;
        }
    }, [game, currentPuzzle, currentMoveIndex, gameState, isLoadingPuzzle, handleCorrectMove, handleWrongMove]);

    const customSquareStyles = {};
    if (lastMove) {
        customSquareStyles[lastMove.from] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
        customSquareStyles[lastMove.to] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
    }

    const playerColor = orientation === 'white' ? 'White' : 'Black';

    if (gameState === 'ready') {
        return (
            <div className="puzzle-survival-page">
                <div className="survival-bg-aura"></div>
                <div className="survival-bg-aura-2"></div>

                <div className="survival-top-nav">
                    <Link to="/puzzles" className="survival-back-link">
                        ← Back to Puzzles
                    </Link>
                </div>

                <div className="survival-hero">
                    <div className="survival-hero-content">
                        <p className="survival-pretitle">Test Your Endurance</p>
                        <h1 className="survival-title">
                            <span className="survival-gradient-text">Puzzle</span> Survival
                        </h1>
                        <p className="survival-description">
                            You have 3 lives. Every wrong move costs one. Solve as many puzzles as you can
                            before running out of lives. How long can you survive?
                        </p>

                        <div className="survival-lives-display">
                            <span className="heart">♥</span>
                            <span className="heart">♥</span>
                            <span className="heart">♥</span>
                        </div>

                        {bestStreak > 0 && (
                            <div className="survival-best-streak">
                                <span className="survival-best-value">{bestStreak}</span>
                                <span className="survival-best-label">Your Best Streak</span>
                            </div>
                        )}

                        <div className="survival-difficulty-selector">
                            <h3>Difficulty</h3>
                            <div className="survival-difficulty-options">
                                {Object.entries(DIFFICULTY_OPTIONS).map(([key, value]) => (
                                    <button
                                        key={key}
                                        className={`survival-difficulty-option ${difficulty === key ? 'active' : ''}`}
                                        onClick={() => setDifficulty(key)}
                                    >
                                        <span className="difficulty-icon">{value.icon}</span>
                                        <span className="difficulty-label">{value.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="survival-cta-wrapper">
                            <div className="survival-cta-glow"></div>
                            <button className="survival-cta" onClick={startGame}>
                                Start Survival
                            </button>
                        </div>
                    </div>

                    <div className="survival-hero-visual">
                        <div className="survival-image-glow"></div>
                        <img
                            src="/src/assets/puzzlesurvival.png"
                            alt="Puzzle Survival"
                            className="survival-illustration"
                        />
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'finished') {
        const isNewRecord = streak >= bestStreak && streak > 0;

        return (
            <div className="puzzle-survival-page results">
                <div className="survival-bg-aura"></div>
                <div className="survival-bg-aura-2"></div>

                <div className="survival-results">
                    <div className="results-hearts">
                        <span className="heart lost">♥</span>
                        <span className="heart lost">♥</span>
                        <span className="heart lost">♥</span>
                    </div>

                    <h1 className="results-title">Game Over</h1>

                    <div className="final-streak">
                        <span className="streak-value">{streak}</span>
                        <span className="streak-label">Puzzles Solved</span>
                        {isNewRecord && <span className="new-record">New Record!</span>}
                    </div>

                    <div className="stats-row-results">
                        <div className="stat-item">
                            <span className="stat-value">{bestStreak}</span>
                            <span className="stat-label">Best Streak</span>
                        </div>
                    </div>

                    {!isAuthenticated && (
                        <div className="signin-prompt">
                            <p>Sign in to save your streak and compete on the leaderboard!</p>
                            <Link to="/signin" className="signin-link">Sign In</Link>
                        </div>
                    )}

                    <div className="results-actions">
                        <div className="play-again-wrapper">
                            <div className="play-again-glow"></div>
                            <button className="play-again-btn" onClick={startGame}>
                                Try Again
                            </button>
                        </div>
                        <Link to="/puzzles" className="results-back-link">
                            ← Back to Puzzles
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="puzzle-survival-page playing">
            <div className="survival-bg-aura"></div>
            <div className="survival-bg-aura-2"></div>

            <div className="survival-game-layout">
                <div className="survival-board-wrapper">
                    <div className={`survival-board-container ${feedbackStatus || ''}`}>
                        {game && currentPuzzle ? (
                            <Chessboard
                                id="survival-board"
                                options={{
                                    position: game.fen(),
                                    allowDragging: !isLoadingPuzzle && lives > 0,
                                    onPieceDrop: onDrop,
                                    animationDurationInMs: 150,
                                    boardOrientation: orientation,
                                    squareStyles: customSquareStyles,
                                    showNotation: true
                                }}
                            />
                        ) : (
                            <div className="loading-puzzle">
                                <div className="loading-spinner"></div>
                            </div>
                        )}

                        {feedbackStatus === 'correct' && (
                            <div className="feedback-overlay correct">✓</div>
                        )}
                        {feedbackStatus === 'wrong' && (
                            <div className="feedback-overlay wrong">✗</div>
                        )}
                        {showTurnOverlay && !feedbackStatus && (
                            <div className="turn-overlay">
                                <div className={`turn-dot-large ${orientation}`}></div>
                                <span>{playerColor} to play</span>
                            </div>
                        )}
                    </div>

                    <div className="puzzle-info-bar">
                        <span className="puzzle-rating-badge">Rating {currentPuzzle?.rating || '—'}</span>
                        <span className="move-hint">{playerColor} to move</span>
                    </div>
                </div>

                <div className="survival-sidebar">
                    <div className="lives-card">
                        <div className="lives-hearts">
                            {[1, 2, 3].map(i => (
                                <span key={i} className={`heart ${i <= lives ? 'active' : 'lost'}`}>
                                    ♥
                                </span>
                            ))}
                        </div>
                        <span className="lives-label">{lives} {lives === 1 ? 'Life' : 'Lives'} Left</span>
                    </div>

                    <div className="streak-card">
                        <span className="streak-value">{streak}</span>
                        <span className="streak-label">Current Streak</span>
                    </div>

                    {bestStreak > 0 && (
                        <div className="best-card">
                            <span className="best-value">{bestStreak}</span>
                            <span className="best-label">Best Streak</span>
                        </div>
                    )}

                    <button className="quit-btn" onClick={() => setGameState('finished')}>
                        Give Up
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PuzzleSurvivalPage;
