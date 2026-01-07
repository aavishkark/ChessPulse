import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { puzzleStatsService } from '../../services/puzzleStatsService';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import './puzzleStats.css';

const COLORS = ['#4ade80', '#f87171', '#60a5fa', '#fbbf24', '#a78bfa', '#f472b6'];

const PuzzleStatsPage = () => {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rank, setRank] = useState(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/signin');
            return;
        }
        if (isAuthenticated) {
            fetchStats();
        }
    }, [isAuthenticated, authLoading]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const [statsRes, rankRes] = await Promise.all([
                puzzleStatsService.getStats(),
                puzzleStatsService.getUserRank()
            ]);
            if (statsRes.success) setStats(statsRes.data);
            if (rankRes.success) setRank(rankRes.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="puzzle-stats-page">
                <div className="stats-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading your stats...</p>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="puzzle-stats-page">
                <div className="stats-empty">
                    <h2>No Stats Yet</h2>
                    <p>Start solving puzzles to see your statistics!</p>
                    <Link to="/puzzles" className="start-btn">Start Solving</Link>
                </div>
            </div>
        );
    }

    const ratingData = stats.ratingHistory?.map((r, i) => ({
        name: `${i + 1}`,
        rating: r.rating
    })) || [];

    const accuracyData = [
        { name: 'Solved', value: stats.totalSolved },
        { name: 'Failed', value: stats.totalAttempted - stats.totalSolved }
    ];



    const difficultyData = Object.entries(stats.difficultyStats || {})
        .filter(([_, d]) => d.attempted > 0)
        .map(([tier, data]) => ({
            name: tier.charAt(0).toUpperCase() + tier.slice(1),
            solved: data.solved,
            failed: data.attempted - data.solved
        }));

    return (
        <div className="puzzle-stats-page">
            <div className="stats-header">
                <div className="stats-nav">
                    <Link to="/puzzles" className="back-link">← Back to Puzzles</Link>
                </div>
                <h1>Your Puzzle Stats</h1>
                <p>Track your progress and identify areas for improvement</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card rating-card">
                    <div className="card-header">
                        <h3>Puzzle Rating</h3>
                        {rank && rank.rank && (
                            <span className="rank-badge">#{rank.rank}</span>
                        )}
                    </div>
                    <div className="rating-display">
                        <span className="rating-value">{stats.rating}</span>
                        <span className="peak-rating">Peak: {stats.peakRating}</span>
                    </div>
                    {ratingData.length > 1 && (
                        <div className="rating-chart">
                            <ResponsiveContainer width="100%" height={120}>
                                <LineChart data={ratingData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="name" hide />
                                    <YAxis domain={['auto', 'auto']} hide />
                                    <Tooltip
                                        contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                                        labelStyle={{ color: '#888' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="rating"
                                        stroke="#4ade80"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                <div className="stat-card accuracy-card">
                    <h3>Accuracy</h3>
                    <div className="accuracy-display">
                        <div className="accuracy-chart">
                            <ResponsiveContainer width="100%" height={150}>
                                <PieChart>
                                    <Pie
                                        data={accuracyData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={60}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        <Cell fill="#4ade80" />
                                        <Cell fill="#f87171" />
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="accuracy-stats">
                            <div className="accuracy-percent">{stats.accuracy}%</div>
                            <div className="accuracy-counts">
                                <span className="solved">✓ {stats.totalSolved}</span>
                                <span className="failed">✗ {stats.totalAttempted - stats.totalSolved}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="stat-card streak-card">
                    <h3>Streaks</h3>
                    <div className="streak-display">
                        <div className="streak-item current">
                            <span className="streak-value">{stats.streak?.current || 0}</span>
                            <span className="streak-label">Current Streak</span>
                        </div>
                        <div className="streak-item best">
                            <span className="streak-value">{stats.streak?.best || 0}</span>
                            <span className="streak-label">Best Streak</span>
                        </div>
                    </div>
                </div>

                <div className="stat-card totals-card">
                    <h3>Totals</h3>
                    <div className="totals-display">
                        <div className="total-item">
                            <span className="total-value">{stats.totalAttempted}</span>
                            <span className="total-label">Puzzles Attempted</span>
                        </div>
                        <div className="total-item">
                            <span className="total-value">{stats.totalSolved}</span>
                            <span className="total-label">Puzzles Solved</span>
                        </div>
                        {stats.averageTimeMs > 0 && (
                            <div className="total-item">
                                <span className="total-value">{Math.round(stats.averageTimeMs / 1000)}s</span>
                                <span className="total-label">Avg Time</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>



            {difficultyData.length > 0 && (
                <div className="stat-card difficulty-card">
                    <h3>Performance by Difficulty</h3>
                    <div className="difficulty-chart">
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={difficultyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="name" tick={{ fill: '#888' }} />
                                <YAxis tick={{ fill: '#888' }} />
                                <Tooltip
                                    contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                                />
                                <Legend />
                                <Bar dataKey="solved" fill="#4ade80" name="Solved" stackId="a" />
                                <Bar dataKey="failed" fill="#f87171" name="Failed" stackId="a" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <div className="stats-actions">
                <Link to="/puzzles" className="action-btn primary">Continue Training</Link>
                <Link to="/puzzles/leaderboard" className="action-btn secondary">View Leaderboard</Link>
            </div>
        </div>
    );
};

export default PuzzleStatsPage;
