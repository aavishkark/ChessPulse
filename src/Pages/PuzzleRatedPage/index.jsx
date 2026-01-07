import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useAuth } from '../../contexts/AuthContext';
import { puzzleService } from '../../services/puzzleService';
import { puzzleStatsService } from '../../services/puzzleStatsService';
import { AIIcon, CheckIcon, TrophyIcon, TrendUpIcon, ArrowRightIcon, TimerIcon } from '../../Components/Icons/Icons';
import './puzzleRated.css';

const INITIAL_RATING = 1200;
const K_FACTOR = 32;

const calculateNewRating = (playerRating, puzzleRating, solved) => {
    const expectedScore = 1 / (1 + Math.pow(10, (puzzleRating - playerRating) / 400));
    const actualScore = solved ? 1 : 0;
    const newRating = Math.round(playerRating + K_FACTOR * (actualScore - expectedScore));
    const change = newRating - playerRating;
    return { newRating, change };
};

const PuzzleRatedPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [rating, setRating] = useState(INITIAL_RATING);
    const [peakRating, setPeakRating] = useState(INITIAL_RATING);
    const [puzzlesSolved, setPuzzlesSolved] = useState(0);
    const [puzzlesAttempted, setPuzzlesAttempted] = useState(0);
    const [lastChange, setLastChange] = useState(null);
    const [currentPuzzle, setCurrentPuzzle] = useState(null);
    const [game, setGame] = useState(null);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [orientation, setOrientation] = useState('white');
    const [lastMove, setLastMove] = useState(null);
    const [feedbackStatus, setFeedbackStatus] = useState(null);
    const [isLoadingPuzzle, setIsLoadingPuzzle] = useState(false);
    const [showTurnOverlay, setShowTurnOverlay] = useState(false);
    const [sessionActive, setSessionActive] = useState(false);
    const [aiFeedback, setAiFeedback] = useState(null);
    const [loadingFeedback, setLoadingFeedback] = useState(false);
    const [sessionJustEnded, setSessionJustEnded] = useState(false);
    const [loadingRating, setLoadingRating] = useState(true);

    // Fetch rating from backend on mount
    useEffect(() => {
        if (isAuthenticated) {
            puzzleStatsService.getRating()
                .then(res => {
                    if (res.success) {
                        setRating(res.data.rating);
                        setPeakRating(res.data.peakRating);
                    }
                })
                .catch(err => console.error('Failed to fetch rating:', err))
                .finally(() => setLoadingRating(false));
        } else {
            setLoadingRating(false);
        }
    }, [isAuthenticated]);

    const loadNewPuzzle = useCallback(async (currentRating) => {
        setIsLoadingPuzzle(true);
        setLastMove(null);
        setFeedbackStatus(null);
        setLastChange(null);

        try {
            const puzzle = await puzzleService.getPuzzleByRating(currentRating);
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

    const startSession = async () => {
        setSessionActive(true);
        setPuzzlesSolved(0);
        setPuzzlesAttempted(0);
        await loadNewPuzzle(rating);
    };

    const endSession = async () => {
        setSessionActive(false);
        setCurrentPuzzle(null);
        setGame(null);

        if (puzzlesAttempted > 0) {
            setSessionJustEnded(true);
            if (isAuthenticated) {
                setLoadingFeedback(true);
                try {
                    const res = await puzzleStatsService.getSessionFeedback({
                        mode: 'rated',
                        solved: puzzlesSolved,
                        failed: puzzlesAttempted - puzzlesSolved,
                        totalAttempted: puzzlesAttempted
                    });
                    if (res.success) setAiFeedback(res.data);
                } catch (err) {
                    console.error('Failed to get AI feedback:', err);
                } finally {
                    setLoadingFeedback(false);
                }
            }
        }
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
        setPuzzlesSolved(prev => prev + 1);
        setPuzzlesAttempted(prev => prev + 1);

        let newRating = rating;

        if (isAuthenticated && currentPuzzle) {
            try {
                const res = await puzzleStatsService.recordAttempt({
                    puzzleId: currentPuzzle.id,
                    solved: true,
                    puzzleRating: currentPuzzle.rating,
                    themes: currentPuzzle.themes || [],
                    mode: 'rated'
                });
                if (res.success) {
                    newRating = res.data.newRating;
                    setRating(newRating);
                    setLastChange(res.data.ratingChange);
                    if (res.data.peakRating > peakRating) {
                        setPeakRating(res.data.peakRating);
                    }
                }
            } catch (err) {
                console.error('Failed to record attempt:', err);
            }
        } else {
            // Guest mode - local calculation
            const expectedScore = 1 / (1 + Math.pow(10, (currentPuzzle.rating - rating) / 400));
            const change = Math.round(K_FACTOR * (1 - expectedScore));
            newRating = rating + change;
            setRating(newRating);
            setLastChange(change);
        }

        setTimeout(async () => {
            setFeedbackStatus(null);
            await loadNewPuzzle(newRating);
        }, 800);
    }, [loadNewPuzzle, currentPuzzle, isAuthenticated, rating, peakRating]);

    const handleWrongMove = useCallback(async () => {
        setFeedbackStatus('wrong');
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

        let newRating = rating;

        if (isAuthenticated && currentPuzzle) {
            try {
                const res = await puzzleStatsService.recordAttempt({
                    puzzleId: currentPuzzle.id,
                    solved: false,
                    puzzleRating: currentPuzzle.rating,
                    themes: currentPuzzle.themes || [],
                    mode: 'rated'
                });
                if (res.success) {
                    newRating = res.data.newRating;
                    setRating(newRating);
                    setLastChange(res.data.ratingChange);
                }
            } catch (err) {
                console.error('Failed to record attempt:', err);
            }
        } else {
            const expectedScore = 1 / (1 + Math.pow(10, (currentPuzzle.rating - rating) / 400));
            const change = Math.round(K_FACTOR * (0 - expectedScore));
            newRating = Math.max(100, rating + change);
            setRating(newRating);
            setLastChange(change);
        }

        setTimeout(async () => {
            setFeedbackStatus(null);
            await loadNewPuzzle(newRating);
        }, 1000);
    }, [loadNewPuzzle, currentPuzzle, game, currentMoveIndex, isAuthenticated, rating]);

    const onDrop = useCallback((moveData) => {
        if (!sessionActive || !game || !currentPuzzle || isLoadingPuzzle) return false;

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
    }, [game, currentPuzzle, currentMoveIndex, sessionActive, isLoadingPuzzle, handleCorrectMove, handleWrongMove]);

    const customSquareStyles = {};
    if (lastMove) {
        customSquareStyles[lastMove.from] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
        customSquareStyles[lastMove.to] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
    }

    const playerColor = orientation === 'white' ? 'White' : 'Black';
    const accuracy = puzzlesAttempted > 0 ? Math.round((puzzlesSolved / puzzlesAttempted) * 100) : 0;

    if (sessionJustEnded) {
        return (
            <div className="puzzle-rated-page results">
                <div className="rated-bg-aura"></div>
                <div className="rated-bg-aura-2"></div>

                <div className="results-container">
                    <div className="results-header">
                        <h1 className="results-title">Session Complete</h1>
                        <p className="results-subtitle">Here's how you performed in this Skill Track session</p>
                    </div>

                    <div className="results-stats-grid">
                        <div className="result-card rating">
                            <div className="result-card-glow"></div>
                            <TrophyIcon size={24} color="#fbbf24" />
                            <span className="result-value">{rating}</span>
                            <span className="result-label">Current Rating</span>
                        </div>
                        <div className="result-card accuracy">
                            <TrendUpIcon size={24} color="#4ade80" />
                            <span className="result-value">{accuracy}%</span>
                            <span className="result-label">Accuracy</span>
                        </div>
                        <div className="result-card solved">
                            <CheckIcon size={24} color="#60a5fa" />
                            <span className="result-value">{puzzlesSolved}</span>
                            <span className="result-label">Puzzles Solved</span>
                        </div>
                    </div>

                    {isAuthenticated && (
                        <div className="results-ai-section">
                            <div className="ai-coach-header">
                                <AIIcon size={20} />
                                <h3>AI Coach Analysis</h3>
                            </div>
                            {loadingFeedback ? (
                                <div className="ai-loading-skeleton">
                                    <div className="skeleton-line"></div>
                                    <div className="skeleton-line short"></div>
                                </div>
                            ) : aiFeedback ? (
                                <div className="ai-feedback-box">
                                    <p className="ai-summary-text">{aiFeedback.summary}</p>
                                    <div className="ai-tips-grid">
                                        {aiFeedback.tips?.map((tip, i) => (
                                            <div key={i} className="ai-tip-item">
                                                <span className="tip-dot"></span>
                                                <p>{tip}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {aiFeedback.strength && (
                                        <div className="ai-strength-tag">
                                            <CheckIcon size={14} />
                                            <span>Strength: {aiFeedback.strength}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="ai-error-msg">Coach is busy right now. Try another session!</p>
                            )}
                        </div>
                    )}

                    {!isAuthenticated && (
                        <div className="results-auth-nudge">
                            <p>Sign in to get personalized AI tips and save your progress!</p>
                            <Link to="/signin" className="nudge-signin-btn">Sign In Now</Link>
                        </div>
                    )}

                    <div className="results-actions">
                        <button className="btn-retry" onClick={() => { setSessionJustEnded(false); setAiFeedback(null); startSession(); }}>
                            Start New Session
                        </button>
                        <Link to="/puzzles" className="btn-back">
                            Back to Puzzles
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!sessionActive) {
        return (
            <div className="puzzle-rated-page">
                <div className="rated-bg-aura"></div>
                <div className="rated-bg-aura-2"></div>

                <div className="rated-top-nav">
                    <Link to="/puzzles" className="rated-back-link">
                        ← Back to Puzzles
                    </Link>
                </div>

                <div className="rated-hero">
                    <div className="rated-hero-content">
                        <p className="rated-pretitle">Track Your Progress</p>
                        <h1 className="rated-title">
                            <span className="rated-gradient-text">Skill</span> Track
                        </h1>
                        <p className="rated-description">
                            Measure your chess puzzle strength with ELO rating. Solve puzzles at your skill level—
                            win to climb, miss to learn. Your rating persists forever!
                        </p>

                        <div className="rated-current-rating">
                            <span className="rated-rating-value">{rating}</span>
                            <span className="rated-rating-label">Your Rating</span>
                        </div>

                        <div className="rated-rules">
                            <div className="rated-rule">
                                <span className="rated-rule-icon">+</span>
                                <span>Gain points for correct solutions</span>
                            </div>
                            <div className="rated-rule negative">
                                <span className="rated-rule-icon">−</span>
                                <span>Lose points for wrong moves</span>
                            </div>
                            <div className="rated-rule">
                                <span className="rated-rule-icon">≈</span>
                                <span>Harder puzzles = more points</span>
                            </div>
                        </div>

                        {!isAuthenticated && (
                            <div className="rated-auth-warning">
                                <div className="auth-warning-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                </div>
                                <div className="auth-warning-content">
                                    <p className="auth-warning-title">Playing as Guest</p>
                                    <p className="auth-warning-text">Your rating won't be saved to your account</p>
                                </div>
                                <Link to="/signin" className="rated-signin-btn">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                        <polyline points="10 17 15 12 10 7" />
                                        <line x1="15" y1="12" x2="3" y2="12" />
                                    </svg>
                                    Sign In
                                </Link>
                            </div>
                        )}

                        <div className="rated-cta-wrapper">
                            <div className="rated-cta-glow"></div>
                            <button className="rated-cta" onClick={() => { setSessionJustEnded(false); setAiFeedback(null); startSession(); }}>
                                Start Training
                            </button>
                        </div>
                    </div>

                    <div className="rated-hero-visual">
                        <div className="rated-image-glow"></div>
                        <img
                            src="/assets/puzzlerated.png"
                            alt="Rated Puzzles"
                            className="rated-illustration"
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="puzzle-rated-page playing">
            <div className="rated-bg-aura"></div>
            <div className="rated-bg-aura-2"></div>

            <div className="rated-game-layout">
                <div className="rated-board-wrapper">
                    <div className={`rated-board-container ${feedbackStatus || ''}`}>
                        {game && currentPuzzle ? (
                            <Chessboard
                                id="rated-board"
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
                            <div className="feedback-overlay correct"><CheckIcon size={64} /></div>
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

                <div className="rated-sidebar">
                    <div className="rating-card-live">
                        <span className="rating-value">{rating}</span>
                        {lastChange !== null && (
                            <span className={`rating-change ${lastChange >= 0 ? 'positive' : 'negative'}`}>
                                {lastChange >= 0 ? '+' : ''}{lastChange}
                            </span>
                        )}
                        <span className="rating-label">Rating</span>
                    </div>

                    <div className="puzzle-rating-card">
                        <span className="puzzle-rating-value">{currentPuzzle?.rating || '...'}</span>
                        <span className="puzzle-rating-label">Puzzle Rating</span>
                    </div>

                    <div className="stats-mini">
                        <div className="stat-row">
                            <span>Solved</span>
                            <span className="stat-num success">{puzzlesSolved}</span>
                        </div>
                        <div className="stat-row">
                            <span>Accuracy</span>
                            <span className="stat-num">{accuracy}%</span>
                        </div>
                    </div>

                    <button className="end-session-btn" onClick={endSession}>
                        End Session
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PuzzleRatedPage;
