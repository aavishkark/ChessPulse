import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useAuth } from '../../contexts/AuthContext';
import { puzzleService } from '../../services/puzzleService';
import './puzzleRush.css';

const TIME_OPTIONS = {
    '3': { seconds: 3 * 60, label: '3 min', description: 'Quick sprint' },
    '5': { seconds: 5 * 60, label: '5 min', description: 'Standard mode' },
    '10': { seconds: 10 * 60, label: '10 min', description: 'Marathon' }
};

const DIFFICULTY_OPTIONS = {
    'all': { label: 'All Levels', description: 'Mixed puzzles', icon: '🎲' },
    'beginner': { label: 'Beginner', description: '800-1199', icon: '🌱' },
    'intermediate': { label: 'Intermediate', description: '1200-1599', icon: '📈' },
    'advanced': { label: 'Advanced', description: '1600-1999', icon: '🔥' },
    'expert': { label: 'Expert', description: '2000-2400', icon: '👑' }
};

const PuzzleRushPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isAuthenticated } = useAuth();
    const timeMode = searchParams.get('time') || '5';

    const [gameState, setGameState] = useState('ready');
    const [timeLeft, setTimeLeft] = useState(TIME_OPTIONS[timeMode]?.seconds || 300);
    const [score, setScore] = useState(0);
    const [puzzlesSolved, setPuzzlesSolved] = useState(0);
    const [puzzlesAttempted, setPuzzlesAttempted] = useState(0);
    const [currentPuzzle, setCurrentPuzzle] = useState(null);
    const [game, setGame] = useState(null);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [orientation, setOrientation] = useState('white');
    const [lastMove, setLastMove] = useState(null);
    const [feedbackStatus, setFeedbackStatus] = useState(null);
    const [isLoadingPuzzle, setIsLoadingPuzzle] = useState(false);
    const [showTurnOverlay, setShowTurnOverlay] = useState(false);
    const [difficulty, setDifficulty] = useState('all');

    const timerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    useEffect(() => {
        if (gameState === 'playing' && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setGameState('finished');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timerRef.current);
        }
    }, [gameState]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getTimerClass = () => {
        if (timeLeft <= 10) return 'critical';
        if (timeLeft <= 30) return 'low';
        return '';
    };

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
        setTimeLeft(TIME_OPTIONS[timeMode]?.seconds || 300);
        setScore(0);
        setPuzzlesSolved(0);
        setPuzzlesAttempted(0);
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
        setScore(prev => prev + 1);
        setPuzzlesSolved(prev => prev + 1);

        setTimeout(async () => {
            setFeedbackStatus(null);
            await loadNewPuzzle(difficulty);
        }, 500);
    }, [loadNewPuzzle, difficulty]);

    const handleWrongMove = useCallback(() => {
        setFeedbackStatus('wrong');
        setTimeLeft(prev => Math.max(0, prev - 5));
        setPuzzlesAttempted(prev => prev + 1);

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

        setTimeout(async () => {
            setFeedbackStatus(null);
            await loadNewPuzzle(difficulty);
        }, 600);
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

    if (gameState === 'ready') {
        return (
            <div className="puzzle-rush-page">
                <div className="rush-bg-aura"></div>
                <div className="rush-bg-aura-2"></div>

                <div className="rush-top-nav">
                    <Link to="/puzzles" className="rush-back-link">
                        ← Back to Puzzles
                    </Link>
                </div>

                <div className="rush-hero">
                    <div className="rush-hero-content">
                        <p className="rush-pretitle">Race Against Time</p>
                        <h1 className="rush-title">
                            <span className="rush-gradient-text">Puzzle</span> Rush
                        </h1>
                        <p className="rush-description">
                            Test your tactical skills under pressure. Solve as many puzzles as you can before the clock runs out.
                            Every correct move earns points, but mistakes cost precious seconds!
                        </p>

                        <div className="rush-time-selector">
                            <h3>Choose Your Challenge</h3>
                            <div className="rush-time-options">
                                {Object.entries(TIME_OPTIONS).map(([key, value]) => (
                                    <button
                                        key={key}
                                        className={`rush-time-option ${timeMode === key ? 'active' : ''}`}
                                        onClick={() => navigate(`/puzzles/rush?time=${key}`)}
                                    >
                                        <span className="rush-time-value">{value.label}</span>
                                        <span className="rush-time-desc">{value.description}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="rush-difficulty-selector">
                            <h3>Difficulty</h3>
                            <div className="rush-difficulty-options">
                                {Object.entries(DIFFICULTY_OPTIONS).map(([key, value]) => (
                                    <button
                                        key={key}
                                        className={`rush-difficulty-option ${difficulty === key ? 'active' : ''}`}
                                        onClick={() => setDifficulty(key)}
                                    >
                                        <span className="difficulty-icon">{value.icon}</span>
                                        <span className="difficulty-label">{value.label}</span>
                                        <span className="difficulty-desc">{value.description}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="rush-rules">
                            <div className="rush-rule correct">
                                <span className="rush-rule-icon">+1</span>
                                <span>Point per puzzle</span>
                            </div>
                            <div className="rush-rule wrong">
                                <span className="rush-rule-icon">-5s</span>
                                <span>Wrong move penalty</span>
                            </div>
                        </div>

                        <div className="rush-cta-wrapper">
                            <div className="rush-cta-glow"></div>
                            <button className="rush-cta" onClick={startGame}>
                                Start Rush
                            </button>
                        </div>
                    </div>

                    <div className="rush-hero-visual">
                        <div className="rush-image-glow"></div>
                        <img
                            src="/assets/puzzlerush.png"
                            alt="Puzzle Rush"
                            className="rush-illustration"
                        />
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'finished') {
        const accuracy = puzzlesAttempted > 0
            ? Math.round((puzzlesSolved / (puzzlesSolved + puzzlesAttempted)) * 100)
            : 100;

        return (
            <div className="puzzle-rush-page results">
                <div className="rush-bg-aura"></div>
                <div className="rush-bg-aura-2"></div>

                <div className="rush-results">
                    <div className="results-timer-icon">⏱</div>

                    <h1 className="results-title">Time's Up!</h1>

                    <div className="final-score">
                        <span className="score-value">{score}</span>
                        <span className="score-label">Puzzles Solved</span>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <span className="stat-value">{puzzlesSolved + puzzlesAttempted}</span>
                            <span className="stat-label">Attempted</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">{accuracy}%</span>
                            <span className="stat-label">Accuracy</span>
                        </div>
                    </div>

                    {!isAuthenticated && (
                        <div className="signin-prompt">
                            <p>Sign in to save your score and compete on the leaderboard!</p>
                            <Link to="/signin" className="signin-link">Sign In</Link>
                        </div>
                    )}

                    <div className="results-actions">
                        <div className="play-again-wrapper">
                            <div className="play-again-glow"></div>
                            <button className="play-again-btn" onClick={startGame}>
                                Play Again
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
        <div className="puzzle-rush-page playing">
            <div className="rush-bg-aura"></div>
            <div className="rush-bg-aura-2"></div>

            <div className="rush-game-layout">
                <div className="rush-board-wrapper">
                    <div className={`rush-board-container ${feedbackStatus || ''}`}>
                        {game && currentPuzzle ? (
                            <Chessboard
                                id="rush-board"
                                options={{
                                    position: game.fen(),
                                    allowDragging: !isLoadingPuzzle,
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
                                <span>{orientation === 'white' ? 'White' : 'Black'} to play</span>
                            </div>
                        )}
                    </div>

                    <div className="puzzle-info-bar">
                        <span className="puzzle-rating-badge">Rating {currentPuzzle?.rating || '—'}</span>
                        <span className="move-hint">{orientation === 'white' ? 'White' : 'Black'} to move</span>
                    </div>
                </div>

                <div className="rush-sidebar">
                    <div className={`timer-card ${getTimerClass()}`}>
                        <span className="timer-value">{formatTime(timeLeft)}</span>
                        <span className="timer-label">Time Left</span>
                    </div>

                    <div className="score-card">
                        <span className="score-value">{score}</span>
                        <span className="score-label">Score</span>
                    </div>

                    <div className="stats-mini">
                        <div className="stat-row">
                            <span>Solved</span>
                            <span className="stat-num success">{puzzlesSolved}</span>
                        </div>
                        <div className="stat-row">
                            <span>Mistakes</span>
                            <span className="stat-num danger">{puzzlesAttempted}</span>
                        </div>
                    </div>

                    <button className="end-game-btn" onClick={() => setGameState('finished')}>
                        End Game
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PuzzleRushPage;
