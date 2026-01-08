import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useAuth } from '../../contexts/AuthContext';
import { puzzleService } from '../../services/puzzleService';
import { puzzleStatsService } from '../../services/puzzleStatsService';
import { AIIcon, CheckIcon, TrophyIcon, ArrowRightIcon, TimerIcon, TargetIcon } from '../../Components/Icons/Icons';
import './puzzleCurated.css';

const PuzzleCuratedPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [puzzles, setPuzzles] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [puzzlesSolved, setPuzzlesSolved] = useState(0);
    const [puzzlesAttempted, setPuzzlesAttempted] = useState(0);
    const [game, setGame] = useState(null);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [orientation, setOrientation] = useState('white');
    const [lastMove, setLastMove] = useState(null);
    const [feedbackStatus, setFeedbackStatus] = useState(null);
    const [isLoadingSet, setIsLoadingSet] = useState(true);
    const [isLoadingPuzzle, setIsLoadingPuzzle] = useState(false);
    const [showTurnOverlay, setShowTurnOverlay] = useState(false);
    const [sessionActive, setSessionActive] = useState(false);
    const [aiPlan, setAiPlan] = useState(null);
    const [sessionEnded, setSessionEnded] = useState(false);
    const [accuracy, setAccuracy] = useState(0);

    const loadCuratedSet = useCallback(async () => {
        setIsLoadingSet(true);
        try {
            let plan = null;
            if (isAuthenticated) {
                try {
                    const res = await puzzleStatsService.getCurationPlan();
                    if (res.success) plan = res.data;
                } catch (err) {
                    console.error("Failed to fetch AI plan, using default", err);
                }
            }

            if (!plan) {
                plan = {
                    themes: [
                        { theme: 'mateIn1', count: 6, reason: 'Core skill' },
                        { theme: 'fork', count: 6, reason: 'Tactical primary' },
                        { theme: 'pin', count: 6, reason: 'Essential pattern' },
                        { theme: 'backRank', count: 6, reason: 'Positional awareness' },
                        { theme: 'hangingPiece', count: 6, reason: 'Observation' }
                    ],
                    summary: "A balanced tactical foundation for your practice."
                };
            }
            setAiPlan(plan);

            const allPuzzles = [];
            for (const item of plan.themes) {
                const themePuzzles = await puzzleService.getPuzzlesBatchWithFilters(item.count, { themes: [item.theme] });
                allPuzzles.push(...themePuzzles);
            }

            // Shuffle and limit to exactly 30
            const finalPuzzles = allPuzzles
                .sort(() => Math.random() - 0.5)
                .slice(0, 30);

            setPuzzles(finalPuzzles);
        } catch (error) {
            console.error('Error loading curated set:', error);
        } finally {
            setIsLoadingSet(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        loadCuratedSet();
    }, [loadCuratedSet]);

    const startSession = () => {
        if (puzzles.length === 0) return;
        setSessionActive(true);
        setSessionEnded(false);
        setCurrentIndex(0);
        setPuzzlesSolved(0);
        setPuzzlesAttempted(0);
        loadCurrentPuzzle(0);
    };

    const [aiFeedback, setAiFeedback] = useState(null);
    const [loadingFeedback, setLoadingFeedback] = useState(false);

    const loadCurrentPuzzle = useCallback((index) => {
        if (!puzzles[index]) return;

        setIsLoadingPuzzle(true);
        setFeedbackStatus(null);
        setLastMove(null);

        const puzzle = puzzles[index];
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
        setTimeout(() => setShowTurnOverlay(false), 800);
        setIsLoadingPuzzle(false);
    }, [puzzles]);

    const makeUciMove = (chessGame, uciMove) => {
        if (!uciMove || uciMove.length < 4) return null;
        const from = uciMove.substring(0, 2);
        const to = uciMove.substring(2, 4);
        const promotion = uciMove.length > 4 ? uciMove[4] : undefined;
        return chessGame.move({ from, to, promotion });
    };

    const nextPuzzle = useCallback(() => {
        const nextIdx = currentIndex + 1;
        if (nextIdx < puzzles.length) {
            setCurrentIndex(nextIdx);
            loadCurrentPuzzle(nextIdx);
        } else {
            endSession();
        }
    }, [currentIndex, puzzles.length, loadCurrentPuzzle]);

    const endSession = async () => {
        setSessionActive(false);
        setSessionEnded(true);
        const finalAccuracy = puzzlesAttempted > 0 ? Math.round((puzzlesSolved / puzzlesAttempted) * 100) : 0;
        setAccuracy(finalAccuracy);

        if (isAuthenticated && puzzlesAttempted > 0) {
            setLoadingFeedback(true);
            try {
                const res = await puzzleStatsService.getSessionFeedback({
                    mode: 'curated',
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
    };

    const handleCorrectMove = useCallback(async () => {
        setFeedbackStatus('correct');
        const currentPuzzle = puzzles[currentIndex];

        setPuzzlesSolved(prev => prev + 1);
        setPuzzlesAttempted(prev => prev + 1);

        if (isAuthenticated && currentPuzzle) {
            puzzleStatsService.recordAttempt({
                puzzleId: currentPuzzle.id,
                solved: true,
                puzzleRating: currentPuzzle.rating,
                themes: currentPuzzle.themes || [],
                mode: 'curated'
            }).catch(err => console.error('Failed to record attempt:', err));
        }

        setTimeout(() => {
            nextPuzzle();
        }, 800);
    }, [currentIndex, puzzles, isAuthenticated, nextPuzzle]);

    const handleWrongMove = useCallback(() => {
        setFeedbackStatus('wrong');
        setPuzzlesAttempted(prev => prev + 1);

        const currentPuzzle = puzzles[currentIndex];
        if (isAuthenticated && currentPuzzle) {
            puzzleStatsService.recordAttempt({
                puzzleId: currentPuzzle.id,
                solved: false,
                puzzleRating: currentPuzzle.rating,
                themes: currentPuzzle.themes || [],
                mode: 'curated'
            }).catch(err => console.error('Failed to record attempt:', err));
        }

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

        setTimeout(() => {
            nextPuzzle();
        }, 1000);
    }, [currentIndex, puzzles, game, currentMoveIndex, isAuthenticated, nextPuzzle]);

    const onDrop = useCallback((moveData) => {
        if (!sessionActive || !game || !puzzles[currentIndex] || isLoadingPuzzle) return false;

        const sourceSquare = moveData?.sourceSquare || moveData?.from;
        const targetSquare = moveData?.targetSquare || moveData?.to;
        const piece = moveData?.piece;

        if (!sourceSquare || !targetSquare || sourceSquare === targetSquare) return false;

        const expectedMove = puzzles[currentIndex].moves[currentMoveIndex];
        if (!expectedMove) return false;

        const moveStr = sourceSquare + targetSquare;
        const isPawn = piece?.toLowerCase?.().includes('p');
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

                const nextMoveIdx = currentMoveIndex + 1;
                setCurrentMoveIndex(nextMoveIdx);

                if (nextMoveIdx >= puzzles[currentIndex].moves.length) {
                    handleCorrectMove();
                    return true;
                }

                setTimeout(() => {
                    const opponentMove = puzzles[currentIndex].moves[nextMoveIdx];
                    if (opponentMove) {
                        const moveResult = makeUciMove(game, opponentMove);
                        if (moveResult) {
                            setGame(new Chess(game.fen()));
                            setCurrentMoveIndex(nextMoveIdx + 1);
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
    }, [game, currentIndex, puzzles, currentMoveIndex, sessionActive, isLoadingPuzzle, handleCorrectMove, handleWrongMove]);

    const customSquareStyles = {};
    if (lastMove) {
        customSquareStyles[lastMove.from] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
        customSquareStyles[lastMove.to] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
    }

    const playerColor = orientation === 'white' ? 'White' : 'Black';

    if (isLoadingSet) {
        return (
            <div className="puzzle-curated-page">
                <div className="curated-bg-aura"></div>
                <div className="loading-state">
                    <div className="ai-brain-loading">
                        <div className="brain-ring ring-1"></div>
                        <div className="brain-ring ring-2"></div>
                        <div className="brain-ring ring-3"></div>
                    </div>
                    <h2>Pulse AI is curating your session...</h2>
                    <p>Analyzing your tactical patterns and weaknesses</p>
                </div>
            </div>
        );
    }

    if (sessionEnded) {
        return (
            <div className="puzzle-curated-page results">
                <div className="curated-bg-aura"></div>
                <div className="curated-bg-aura-2"></div>

                <div className="results-container">
                    <div className="results-header">
                        <h1 className="results-title">Session Complete</h1>
                        <p className="results-subtitle">Here's a summary of your AI-curated training</p>
                    </div>

                    <div className="results-stats-grid">
                        <div className="result-card">
                            <span className="result-value">{accuracy}%</span>
                            <span className="result-label">Accuracy</span>
                        </div>
                        <div className="result-card">
                            <span className="result-value">{puzzlesSolved}/30</span>
                            <span className="result-label">Solved</span>
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
                                </div>
                            ) : (
                                <p className="ai-error-msg">Coach analysis is standardizing. Well played!</p>
                            )}
                        </div>
                    )}

                    <div className="results-actions">
                        <button className="btn-retry" onClick={() => navigate('/puzzles')}>
                            Back to Puzzles
                        </button>
                        <button className="btn-primary" onClick={() => { setAiFeedback(null); loadCuratedSet(); }}>
                            New Curated Session
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!sessionActive) {
        return (
            <div className="puzzle-curated-page">
                <div className="curated-bg-aura"></div>
                <div className="curated-bg-aura-2"></div>

                <div className="curated-top-nav">
                    <Link to="/puzzles" className="curated-back-link">
                        ← Back to Puzzles
                    </Link>
                </div>

                <div className="curated-hero">
                    <div className="curated-hero-content">
                        <p className="curated-pretitle">Personalized Tactics</p>
                        <h1 className="curated-title">
                            AI <span className="curated-gradient-text">Curated</span>
                        </h1>
                        <p className="curated-description">
                            Pulse AI has analyzed your recent history and prepared a 30-puzzle set
                            focused on your current growth areas and tactical weaknesses.
                        </p>

                        <div className="plan-summary-card">
                            <div className="plan-header">
                                <TargetIcon size={20} color="#fbbf24" />
                                <h3>Training Parameters</h3>
                            </div>
                            <p className="plan-text">{aiPlan?.summary}</p>
                            <div className="themes-list">
                                {aiPlan?.themes.map((t, i) => (
                                    <div key={i} className="theme-item">
                                        <span className="theme-name">{t.theme}</span>
                                        <span className="theme-count">{t.count} puzzles</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="curated-cta-wrapper">
                            <div className="curated-cta-glow"></div>
                            <button className="curated-cta" onClick={startSession}>
                                Start Training Session
                            </button>
                        </div>
                    </div>

                    <div className="curated-hero-visual">
                        <div className="curated-image-glow"></div>
                        <img
                            src="/assets/curatedpuzzles.png"
                            alt="Curated Puzzles"
                            className="curated-illustration"
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="puzzle-curated-page playing">
            <div className="curated-bg-aura"></div>
            <div className="curated-bg-aura-2"></div>

            <div className="curated-game-layout">
                <div className="curated-board-wrapper">
                    <div className={`curated-board-container ${feedbackStatus || ''}`}>
                        {game && (
                            <Chessboard
                                id="curated-board"
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
                        <span className="puzzle-rating-badge">Puzzle {currentIndex + 1} / {puzzles.length}</span>
                        <span className="move-hint">{playerColor} to move</span>
                    </div>
                </div>

                <div className="curated-sidebar">
                    <div className="progress-card-live">
                        <span className="progress-value">{currentIndex + 1}</span>
                        <span className="progress-slash">/</span>
                        <span className="progress-total">{puzzles.length}</span>
                        <span className="progress-label">Puzzles</span>
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

                    <div className="active-theme-card">
                        <span className="theme-label">Active Pattern</span>
                        <span className="theme-value">{puzzles[currentIndex]?.themes?.[0] || 'Mixed'}</span>
                    </div>

                    <button className="end-session-btn" onClick={endSession}>
                        End Session
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PuzzleCuratedPage;
