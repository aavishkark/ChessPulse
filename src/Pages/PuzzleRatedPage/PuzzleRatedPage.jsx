import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useAuth } from '../../contexts/AuthContext';
import { puzzleService } from '../../services/puzzleService';
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

    const [rating, setRating] = useState(() => {
        if (!isAuthenticated) return INITIAL_RATING;
        const saved = localStorage.getItem('puzzleRating');
        return saved ? parseInt(saved, 10) : INITIAL_RATING;
    });
    const [ratingHistory, setRatingHistory] = useState(() => {
        if (!isAuthenticated) return [INITIAL_RATING];
        const saved = localStorage.getItem('puzzleRatingHistory');
        return saved ? JSON.parse(saved) : [INITIAL_RATING];
    });
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

    const endSession = () => {
        setSessionActive(false);
        setCurrentPuzzle(null);
        setGame(null);
    };

    const makeUciMove = (chessGame, uciMove) => {
        if (!uciMove || uciMove.length < 4) return null;
        const from = uciMove.substring(0, 2);
        const to = uciMove.substring(2, 4);
        const promotion = uciMove.length > 4 ? uciMove[4] : undefined;
        return chessGame.move({ from, to, promotion });
    };

    const updateRating = useCallback((puzzleRating, solved) => {
        const { newRating, change } = calculateNewRating(rating, puzzleRating, solved);
        setRating(newRating);
        setLastChange(change);

        if (isAuthenticated) {
            localStorage.setItem('puzzleRating', newRating.toString());
            const newHistory = [...ratingHistory, newRating].slice(-50);
            setRatingHistory(newHistory);
            localStorage.setItem('puzzleRatingHistory', JSON.stringify(newHistory));
        }

        return newRating;
    }, [rating, ratingHistory, isAuthenticated]);

    const handleCorrectMove = useCallback(async () => {
        setFeedbackStatus('correct');
        setPuzzlesSolved(prev => prev + 1);
        setPuzzlesAttempted(prev => prev + 1);

        const newRating = updateRating(currentPuzzle.rating, true);

        setTimeout(async () => {
            setFeedbackStatus(null);
            await loadNewPuzzle(newRating);
        }, 800);
    }, [loadNewPuzzle, updateRating, currentPuzzle]);

    const handleWrongMove = useCallback(() => {
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

        const newRating = updateRating(currentPuzzle.rating, false);

        setTimeout(async () => {
            setFeedbackStatus(null);
            await loadNewPuzzle(newRating);
        }, 1000);
    }, [loadNewPuzzle, updateRating, currentPuzzle, game, currentMoveIndex]);

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
                        <p className="rated-pretitle">Climb The Ladder</p>
                        <h1 className="rated-title">
                            <span className="rated-gradient-text">Rated</span> Puzzles
                        </h1>
                        <p className="rated-description">
                            Challenge yourself with puzzles matched to your skill level. Solve correctly to gain rating points,
                            miss and you lose some. The harder the puzzle, the more points you can earn!
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
                                <p>You're playing as a guest. Rating won't be saved!</p>
                                <Link to="/signin" className="rated-signin-link">Sign in to save progress</Link>
                            </div>
                        )}

                        <div className="rated-cta-wrapper">
                            <div className="rated-cta-glow"></div>
                            <button className="rated-cta" onClick={startSession}>
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
