import { useState, useCallback } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useAuth } from '../../contexts/AuthContext';
import { puzzleService } from '../../services/puzzleService';
import { puzzleStatsService } from '../../services/puzzleStatsService';
import './puzzleThemed.css';

const THEME_DATA = {
    mate: { name: 'Checkmate', icon: '♔', color: '#ef4444', description: 'Deliver checkmate' },
    mateIn1: { name: 'Mate in 1', icon: '♚', color: '#dc2626', description: 'One move to mate' },
    fork: { name: 'Fork', icon: '♞', color: '#8b5cf6', description: 'Attack two pieces' },
    pin: { name: 'Pin', icon: '♗', color: '#06b6d4', description: 'Pin pieces to the king' },
    backrank: { name: 'Back Rank', icon: '♜', color: '#f59e0b', description: 'Back rank mates' },
    endgame: { name: 'Endgame', icon: '♙', color: '#22c55e', description: 'Endgame techniques' },
    center: { name: 'Center Control', icon: '⬛', color: '#6366f1', description: 'Central play' },
    development: { name: 'Development', icon: '→', color: '#14b8a6', description: 'Piece development' },
    check: { name: 'Check', icon: '✓', color: '#ec4899', description: 'Giving check' },
    capture: { name: 'Captures', icon: '×', color: '#f97316', description: 'Win material' },
    attack: { name: 'Attack', icon: '⚔', color: '#e11d48', description: 'Aggressive play' }
};

const DIFFICULTY_OPTIONS = {
    'all': { label: 'All', icon: '🎲' },
    'beginner': { label: 'Easy', icon: '🌱' },
    'intermediate': { label: 'Medium', icon: '📈' },
    'advanced': { label: 'Hard', icon: '🔥' },
    'expert': { label: 'Expert', icon: '👑' }
};

const PuzzleThemedPage = () => {
    const navigate = useNavigate();
    const { theme } = useParams();
    const { isAuthenticated } = useAuth();

    const [selectedTheme, setSelectedTheme] = useState(theme || null);
    const [puzzlesSolved, setPuzzlesSolved] = useState(0);
    const [currentPuzzle, setCurrentPuzzle] = useState(null);
    const [game, setGame] = useState(null);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [orientation, setOrientation] = useState('white');
    const [lastMove, setLastMove] = useState(null);
    const [feedbackStatus, setFeedbackStatus] = useState(null);
    const [isLoadingPuzzle, setIsLoadingPuzzle] = useState(false);
    const [showTurnOverlay, setShowTurnOverlay] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [difficulty, setDifficulty] = useState('all');

    const loadNewPuzzle = useCallback(async (themeName, selectedDifficulty) => {
        setIsLoadingPuzzle(true);
        setLastMove(null);
        setFeedbackStatus(null);

        try {
            const filters = { themes: [themeName] };
            if (selectedDifficulty && selectedDifficulty !== 'all') {
                filters.difficulty = selectedDifficulty;
            }
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

    const startPractice = async (themeName) => {
        setSelectedTheme(themeName);
        setIsPlaying(true);
        setPuzzlesSolved(0);
        puzzleService.resetSession();
        await loadNewPuzzle(themeName, difficulty);
    };

    const endPractice = () => {
        setIsPlaying(false);
        setSelectedTheme(null);
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

    const handleCorrectMove = useCallback(async () => {
        setFeedbackStatus('correct');
        setPuzzlesSolved(prev => prev + 1);

        if (isAuthenticated && currentPuzzle) {
            try {
                await puzzleStatsService.recordAttempt({
                    puzzleId: currentPuzzle.id,
                    solved: true,
                    puzzleRating: currentPuzzle.rating,
                    themes: currentPuzzle.themes || [selectedTheme],
                    mode: 'themed',
                    difficulty
                });
            } catch (err) {
                console.error('Failed to record attempt:', err);
            }
        }

        setTimeout(async () => {
            setFeedbackStatus(null);
            await loadNewPuzzle(selectedTheme, difficulty);
        }, 600);
    }, [loadNewPuzzle, selectedTheme, difficulty, isAuthenticated, currentPuzzle]);

    const handleWrongMove = useCallback(() => {
        setFeedbackStatus('wrong');

        if (isAuthenticated && currentPuzzle) {
            puzzleStatsService.recordAttempt({
                puzzleId: currentPuzzle.id,
                solved: false,
                puzzleRating: currentPuzzle.rating,
                themes: currentPuzzle.themes || [selectedTheme],
                mode: 'themed',
                difficulty
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

        setTimeout(async () => {
            setFeedbackStatus(null);
            await loadNewPuzzle(selectedTheme, difficulty);
        }, 800);
    }, [loadNewPuzzle, selectedTheme, difficulty, currentPuzzle, game, currentMoveIndex, isAuthenticated]);

    const onDrop = useCallback((moveData) => {
        if (!isPlaying || !game || !currentPuzzle || isLoadingPuzzle) return false;

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
    }, [game, currentPuzzle, currentMoveIndex, isPlaying, isLoadingPuzzle, handleCorrectMove, handleWrongMove]);

    const customSquareStyles = {};
    if (lastMove) {
        customSquareStyles[lastMove.from] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
        customSquareStyles[lastMove.to] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
    }

    const playerColor = orientation === 'white' ? 'White' : 'Black';
    const currentThemeData = THEME_DATA[selectedTheme] || {};

    if (!isPlaying) {
        return (
            <div className="puzzle-themed-page">
                <div className="themed-bg-aura"></div>
                <div className="themed-bg-aura-2"></div>

                <div className="themed-top-nav">
                    <Link to="/puzzles" className="themed-back-link">
                        ← Back to Puzzles
                    </Link>
                </div>

                <div className="themed-hero">
                    <div className="themed-hero-header">
                        <p className="themed-pretitle">Master The Patterns</p>
                        <h1 className="themed-title">
                            <span className="themed-gradient-text">Themed</span> Puzzles
                        </h1>
                        <p className="themed-description">
                            Focus on specific tactical patterns to sharpen your skills.
                            Choose a theme below and practice until it becomes second nature.
                        </p>
                    </div>

                    <div className="themes-grid">
                        {Object.entries(THEME_DATA).map(([key, data]) => (
                            <button
                                key={key}
                                className="theme-card"
                                style={{ '--theme-color': data.color }}
                                onClick={() => startPractice(key)}
                            >
                                <span className="theme-icon">{data.icon}</span>
                                <span className="theme-name">{data.name}</span>
                                <span className="theme-desc">{data.description}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="puzzle-themed-page playing">
            <div className="themed-bg-aura"></div>
            <div className="themed-bg-aura-2"></div>

            <div className="themed-game-layout">
                <div className="themed-board-wrapper">
                    <div className={`themed-board-container ${feedbackStatus || ''}`}>
                        {game && currentPuzzle ? (
                            <Chessboard
                                id="themed-board"
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

                <div className="themed-sidebar">
                    <div className="theme-badge" style={{ '--theme-color': currentThemeData.color }}>
                        <span className="badge-icon">{currentThemeData.icon}</span>
                        <span className="badge-name">{currentThemeData.name}</span>
                    </div>

                    <div className="solved-card">
                        <span className="solved-value">{puzzlesSolved}</span>
                        <span className="solved-label">Solved</span>
                    </div>

                    <div className="difficulty-filter">
                        <span className="filter-label">Difficulty</span>
                        <div className="filter-buttons">
                            {Object.entries(DIFFICULTY_OPTIONS).map(([key, value]) => (
                                <button
                                    key={key}
                                    className={`filter-btn ${difficulty === key ? 'active' : ''}`}
                                    onClick={() => setDifficulty(key)}
                                    title={value.label}
                                >
                                    {value.icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button className="change-theme-btn" onClick={endPractice}>
                        Change Theme
                    </button>

                    <Link to="/puzzles" className="back-to-puzzles-btn">
                        ← Back to Puzzles
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PuzzleThemedPage;
