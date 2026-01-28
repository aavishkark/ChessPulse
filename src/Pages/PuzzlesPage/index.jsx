import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PuzzleBoard from '../../Components/PuzzleBoard/PuzzleBoard';
import { puzzleService } from '../../services/puzzleService';
import { TrophyIcon, TrendUpIcon, UserIcon, LightningIcon, FlameIcon, TargetIcon } from '../../Components/Icons/Icons';
import './puzzles.css';

const getTodayString = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const PuzzlesPage = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [currentPuzzle, setCurrentPuzzle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [puzzleSolved, setPuzzleSolved] = useState(false);

    const [puzzleCount, setPuzzleCount] = useState(() => {
        const today = getTodayString();
        try {
            const saved = localStorage.getItem('puzzleStats');
            if (saved) {
                const stats = JSON.parse(saved);
                if (stats.date === today) return stats.count;
            }
        } catch (e) {
            console.error("Error loading puzzleStats:", e);
        }
        return 0;
    });

    const [streak, setStreak] = useState(() => {
        const saved = localStorage.getItem('puzzleStreak');
        return saved ? parseInt(saved, 10) : 0;
    });

    useEffect(() => {
        loadPuzzle(true);
    }, []);

    useEffect(() => {
        const today = getTodayString();
        localStorage.setItem('puzzleStats', JSON.stringify({ date: today, count: puzzleCount }));
        localStorage.setItem('puzzleStreak', streak.toString());
    }, [puzzleCount, streak]);

    const loadPuzzle = useCallback(async (isFirst = false) => {
        try {
            setLoading(true);
            setPuzzleSolved(false);
            const puzzle = isFirst
                ? await puzzleService.getDailyPuzzle()
                : await puzzleService.getRandomPuzzle();
            setCurrentPuzzle(puzzle);
        } catch (error) {
            console.error('Failed to load puzzle:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handlePuzzleSolve = () => {
        setPuzzleSolved(true);
        setPuzzleCount(prev => prev + 1);
        setStreak(prev => prev + 1);
    };

    const handlePuzzleFail = () => {
        setStreak(0);
    };

    const loadNextPuzzle = () => {
        loadPuzzle(false);
    };
    const puzzleModes = [
        {
            id: 'rush',
            title: 'Puzzle Rush',
            description: 'Solve as many as you can before time runs out',
            gradient: 'linear-gradient(135deg, #ff6b6b, #ee5a5a)',
            icon: <LightningIcon size={22} />,
            color: '#ff6b6b',
            path: '/puzzles/rush'
        },
        {
            id: 'survival',
            title: 'Survival',
            description: '3 lives - how far can you go?',
            gradient: 'linear-gradient(135deg, #845ef7, #7048e8)',
            icon: <FlameIcon size={22} />,
            color: '#845ef7',
            path: '/puzzles/survival'
        },
        {
            id: 'rating',
            title: 'Rated Puzzles',
            description: 'Climb the rating ladder with matched puzzles',
            gradient: 'linear-gradient(135deg, #20c997, #12b886)',
            icon: <TrendUpIcon size={22} />,
            color: '#20c997',
            path: '/puzzles/rating',
            requiresAuth: true
        },
        {
            id: 'themed',
            title: 'Themed Practice',
            description: 'Master specific tactics like forks, pins & mates',
            gradient: 'linear-gradient(135deg, #fab005, #f59e0b)',
            icon: <TargetIcon size={22} />,
            color: '#fab005',
            path: '/puzzles/themed'
        }
    ];

    const handleModeClick = (mode) => {
        if (mode.requiresAuth && !isAuthenticated) {
            navigate('/signin');
        } else {
            navigate(mode.path);
        }
    };

    return (
        <div className="puzzles-page">
            <div className="puzzles-header">
                <h1>Solve Puzzles</h1>
                <p>A new puzzle a day keeps the boredom away.</p>
            </div>

            <div className="puzzles-layout">
                <div className="puzzle-main">
                    <div className="daily-puzzle-header">
                        <span className="daily-badge">Daily Puzzle</span>
                        {currentPuzzle?.rating && (
                            <span className="puzzle-rating">Rating: {currentPuzzle.rating}</span>
                        )}
                    </div>

                    {loading ? (
                        <div className="puzzle-loading">
                            <div className="loading-spinner"></div>
                            <p>Loading puzzle...</p>
                        </div>
                    ) : currentPuzzle ? (
                        <div className="puzzle-container">
                            <PuzzleBoard
                                puzzle={currentPuzzle}
                                onSolve={handlePuzzleSolve}
                                onFail={handlePuzzleFail}
                            />
                            <div className="puzzle-actions">
                                {puzzleSolved ? (
                                    <button className="next-puzzle-btn" onClick={loadNextPuzzle}>
                                        Next Puzzle →
                                    </button>
                                ) : (
                                    <button className="skip-btn" onClick={loadNextPuzzle}>
                                        Skip Puzzle
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="puzzle-error">
                            <p>Failed to load puzzle</p>
                            <button onClick={() => loadPuzzle(true)}>Try Again</button>
                        </div>
                    )}
                </div>

                <div className="puzzle-sidebar">
                    <div className="stats-card">
                        <div className="stats-header">
                            <h3>{isAuthenticated ? "Today's Progress" : "Session"}</h3>
                        </div>
                        <div className="stats-grid">
                            <div className="stat-box streak">
                                <span className="stat-value">{streak}</span>
                                <span className="stat-label">Streak</span>
                            </div>
                            {isAuthenticated && (
                                <div className="stat-box solved">
                                    <span className="stat-value">{puzzleCount}</span>
                                    <span className="stat-label">Solved Today</span>
                                </div>
                            )}
                        </div>
                        {!isAuthenticated && (
                            <div className="guest-stats-cta">
                                <div className="cta-header">
                                    <UserIcon size={20} color="#fbbf24" />
                                    <h4>Track Your Progress</h4>
                                </div>
                                <p className="cta-text">Sign in to save your ratings and track your improvement over time.</p>
                                <Link to="/signin" className="cta-button">Sign In</Link>
                            </div>
                        )}
                    </div>

                    <div className="modes-card">
                        <h3>Modes</h3>
                        <div className="modes-grid">
                            {puzzleModes.map(mode => (
                                <button
                                    key={mode.id}
                                    className={`mode-card ${mode.requiresAuth && !isAuthenticated ? 'locked' : ''}`}
                                    style={{ '--mode-color': mode.color }}
                                    onClick={() => handleModeClick(mode)}
                                >
                                    <div className="mode-icon-wrapper">
                                        {mode.icon}
                                    </div>
                                    <div className="mode-content">
                                        <span className="mode-title">{mode.title}</span>
                                        <span className="mode-desc">{mode.description}</span>
                                    </div>
                                    {mode.requiresAuth && !isAuthenticated && (
                                        <span className="lock-badge">Sign in</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {isAuthenticated && (
                        <div className="quick-links-wrapper">
                            <h3>Resources & Insights</h3>
                            <div className="quick-links-grid">
                                <Link to="/puzzles/stats" className="quick-link">
                                    <TrendUpIcon size={20} />
                                    <div className="link-text">
                                        <span>View Full Stats</span>
                                        <small>Track your performance over time</small>
                                    </div>
                                </Link>
                                <Link to="/puzzles/leaderboard" className="quick-link">
                                    <TrophyIcon size={20} />
                                    <div className="link-text">
                                        <span>Leaderboard</span>
                                        <small>See how you rank against others</small>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    )}

                </div>
            </div>


        </div>
    );
};

export default PuzzlesPage;
