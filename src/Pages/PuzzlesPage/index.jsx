import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PuzzleBoard from '../../Components/PuzzleBoard/PuzzleBoard';
import { puzzleService } from '../../services/puzzleService';
import PageHeader, { PageAmbient } from '../../Components/UI/PageHeader';
import PuzzleSubnav from '../../Components/Puzzles/PuzzleSubnav';
import {
    Zap,
    Flame,
    TrendingUp,
    Target,
    Sparkles,
    Trophy,
    BarChart3,
    ArrowUpRight,
    RefreshCw,
    Lock,
} from 'lucide-react';
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
            console.error('Error loading puzzleStats:', e);
        }
        return 0;
    });

    const [streak, setStreak] = useState(() => {
        const saved = localStorage.getItem('puzzleStreak');
        return saved ? parseInt(saved, 10) : 0;
    });

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

    useEffect(() => {
        loadPuzzle(true);
    }, [loadPuzzle]);

    useEffect(() => {
        const today = getTodayString();
        localStorage.setItem('puzzleStats', JSON.stringify({ date: today, count: puzzleCount }));
        localStorage.setItem('puzzleStreak', streak.toString());
    }, [puzzleCount, streak]);

    const handlePuzzleSolve = () => {
        setPuzzleSolved(true);
        setPuzzleCount((prev) => prev + 1);
        setStreak((prev) => prev + 1);
    };

    const handlePuzzleFail = () => {
        setStreak(0);
    };

    const loadNextPuzzle = () => {
        loadPuzzle(false);
    };

    const puzzleModes = [
        {
            code: 'MOD-01',
            id: 'rush',
            title: 'Puzzle Rush',
            tag: 'HIGH VELOCITY',
            description: 'Race against the clock to solve rapid-fire tactical combinations.',
            icon: Zap,
            color: '#f43f5e',
            path: '/puzzles/rush',
        },
        {
            code: 'MOD-02',
            id: 'survival',
            title: '3-Life Survival',
            tag: 'ENDURANCE',
            description: 'Zero time pressure, 3 strikes allowed — climb into deep calculation.',
            icon: Flame,
            color: '#a855f7',
            path: '/puzzles/survival',
        },
        {
            code: 'MOD-03',
            id: 'rating',
            title: 'Rated ELO Track',
            tag: 'COMPETITIVE',
            description: 'Matched ELO puzzles that dynamically adjust to your tactical rating.',
            icon: TrendingUp,
            color: '#10b981',
            path: '/puzzles/rating',
            requiresAuth: true,
        },
        {
            code: 'MOD-04',
            id: 'themed',
            title: '11 Tactical Motifs',
            tag: 'PATTERN LAB',
            description: 'Isolate forks, pins, skewers, sacrifices, and back-rank checkmates.',
            icon: Target,
            color: '#f59e0b',
            path: '/puzzles/themed',
        },
        {
            code: 'MOD-05',
            id: 'curated',
            title: 'Pulse AI Curated',
            tag: 'NEURAL SET',
            description: 'Hand-picked grandmaster combinations tailored to your repertoire.',
            icon: Sparkles,
            color: '#06b6d4',
            path: '/puzzles/curated',
            requiresAuth: true,
        },
        {
            code: 'MOD-06',
            id: 'leaderboard',
            title: 'Global Leaderboard',
            tag: 'RANKINGS',
            description: 'Compare your tactical ELO and Rush records against top solvers.',
            icon: Trophy,
            color: '#fbbf24',
            path: '/puzzles/leaderboard',
        },
    ];

    const handleModeClick = (mode) => {
        if (mode.requiresAuth && !isAuthenticated) {
            navigate('/signin');
        } else {
            navigate(mode.path);
        }
    };

    return (
        <div className="puzzles-page cp-subpage">
            <PageAmbient watermark="TACTICS" theme="gold" />

            <PageHeader
                badge="2,500+ CURATED TACTICS · PATTERN RECOGNITION"
                title="Tactical"
                accent="Training Lab"
                subtitle="Sharpen calculation speed with daily grandmaster combinations, timed Puzzle Rush, and motif-specific drills."
                theme="gold"
                rightElement={
                    isAuthenticated ? (
                        <Link to="/puzzles/stats" className="puzzles-stats-pill-btn">
                            <BarChart3 size={14} />
                            <span>Performance Telemetry</span>
                            <ArrowUpRight size={14} />
                        </Link>
                    ) : null
                }
            />

            <PuzzleSubnav />

            {/* Top Telemetry HUD Ribbon */}
            <div className="puzzles-container">
                <div className="cp-console-window puzzles-hud-ribbon">
                    <div className="puzzles-hud-cell">
                        <span className="hud-cell-code">SYS-01 // TARGET</span>
                        <span className="hud-cell-val gold">
                            {currentPuzzle?.rating ? `${currentPuzzle.rating} ELO` : '1850 ELO'}
                        </span>
                        <span className="hud-cell-lbl">Active Puzzle Rating</span>
                    </div>
                    <div className="puzzles-hud-cell">
                        <span className="hud-cell-code">SYS-02 // STREAK</span>
                        <span className="hud-cell-val emerald">{streak}</span>
                        <span className="hud-cell-lbl">Consecutive Solved</span>
                    </div>
                    <div className="puzzles-hud-cell">
                        <span className="hud-cell-code">SYS-03 // SESSION</span>
                        <span className="hud-cell-val cyan">{puzzleCount}</span>
                        <span className="hud-cell-lbl">Solved Today</span>
                    </div>
                    <div className="puzzles-hud-cell">
                        <span className="hud-cell-code">SYS-04 // CORPUS</span>
                        <span className="hud-cell-val violet">2,500+</span>
                        <span className="hud-cell-lbl">Verified GM Motifs</span>
                    </div>
                </div>

                {/* 2-Column Studio Console Layout */}
                <div className="puzzles-layout">
                    {/* Left Column: Daily Combination Board Console */}
                    <div className="cp-console-window puzzle-main">
                        <div className="cp-window-topbar">
                            <div className="cp-window-title">
                                <span className="cp-window-dot amber" />
                                <span>DAILY TACTICAL COMBINATION</span>
                            </div>
                            <div className="puzzle-topbar-right">
                                {currentPuzzle?.rating && (
                                    <span className="puzzle-rating">ELO {currentPuzzle.rating}</span>
                                )}
                                <button
                                    type="button"
                                    className="puzzle-skip-top-btn"
                                    onClick={loadNextPuzzle}
                                >
                                    <RefreshCw size={12} />
                                    <span>{puzzleSolved ? 'Next Puzzle' : 'New Puzzle'}</span>
                                </button>
                            </div>
                        </div>

                        <div className="puzzle-main-body">
                            {loading ? (
                                <div className="puzzle-loading">
                                    <div className="loading-spinner" />
                                    <p>Loading tactical position...</p>
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
                                                Skip Combination
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
                    </div>

                    {/* Right Column: 6-Module Interactive Training Matrix */}
                    <div className="cp-console-window puzzle-modes-console">
                        <div className="cp-window-topbar">
                            <span className="cp-window-title">
                                <span>TRAINING MODULES // 06 WORKSTATIONS</span>
                            </span>
                            {!isAuthenticated && (
                                <Link to="/signin" className="puzzles-signin-chip">
                                    Sign in to sync ELO →
                                </Link>
                            )}
                        </div>

                        <div className="modes-bento-list">
                            {puzzleModes.map((mode) => {
                                const Icon = mode.icon;
                                const isLocked = mode.requiresAuth && !isAuthenticated;

                                return (
                                    <button
                                        key={mode.id}
                                        type="button"
                                        className={`mode-bento-row ${isLocked ? 'locked' : ''}`}
                                        style={{ '--mode-color': mode.color }}
                                        onClick={() => handleModeClick(mode)}
                                    >
                                        <div className="mode-row-sweep" aria-hidden="true" />

                                        <div className="mode-row-left">
                                            <span className="mode-code">{mode.code}</span>
                                            <div className="mode-icon-wrapper">
                                                <Icon size={19} strokeWidth={1.9} />
                                            </div>
                                        </div>

                                        <div className="mode-content">
                                            <div className="mode-title-line">
                                                <span className="mode-title">{mode.title}</span>
                                                <span className="mode-tag-pill">{mode.tag}</span>
                                            </div>
                                            <span className="mode-desc">{mode.description}</span>
                                        </div>

                                        <div className="mode-row-right">
                                            {isLocked ? (
                                                <span className="lock-badge">
                                                    <Lock size={11} />
                                                    <span>Sign in</span>
                                                </span>
                                            ) : (
                                                <div className="mode-arrow-circle">
                                                    <ArrowUpRight size={16} />
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PuzzlesPage;
