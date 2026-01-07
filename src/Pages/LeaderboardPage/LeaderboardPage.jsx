import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { puzzleStatsService } from '../../services/puzzleStatsService';
import { TrophyIcon, FlameIcon, CheckIcon, ArrowRightIcon, TargetIcon, TrendUpIcon } from '../../Components/Icons/Icons';
import './leaderboard.css';

const LeaderboardPage = () => {
    const { isAuthenticated, user } = useAuth();
    const [activeTab, setActiveTab] = useState('rating');
    const [leaderboard, setLeaderboard] = useState([]);
    const [userRank, setUserRank] = useState(null);
    const [loading, setLoading] = useState(true);

    const tabs = [
        { id: 'rating', label: 'Rating', Icon: TrophyIcon },
        { id: 'streak', label: 'Best Streak', Icon: FlameIcon },
        { id: 'solved', label: 'Puzzles Solved', Icon: CheckIcon }
    ];

    useEffect(() => {
        fetchLeaderboard(activeTab);
    }, [activeTab, isAuthenticated]);

    const fetchLeaderboard = async (type) => {
        try {
            setLoading(true);
            const [lbRes, rankRes] = await Promise.all([
                puzzleStatsService.getLeaderboard(type, 50),
                isAuthenticated ? puzzleStatsService.getUserRank(type) : Promise.resolve({ success: true, data: null })
            ]);

            if (lbRes.success) setLeaderboard(lbRes.data.leaderboard);
            if (rankRes.success) setUserRank(rankRes.data);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getValueLabel = () => {
        switch (activeTab) {
            case 'streak': return 'Best Streak';
            case 'solved': return 'Puzzles';
            default: return 'Rating';
        }
    };

    const formatValue = (entry) => {
        switch (activeTab) {
            case 'streak': return `${entry.value} days`;
            case 'solved': return entry.value;
            default: return entry.value;
        }
    };

    const getRankBadge = (rank) => {
        if (rank === 1) return <span className="medal gold"><svg width="20" height="20" viewBox="0 0 24 24" fill="#ffd700" stroke="#b8860b" strokeWidth="1"><circle cx="12" cy="12" r="10" /><text x="12" y="12" textAnchor="middle" dy=".3em" fontSize="11" fill="#1a1a2e" fontWeight="bold">1</text></svg></span>;
        if (rank === 2) return <span className="medal silver"><svg width="20" height="20" viewBox="0 0 24 24" fill="#c0c0c0" stroke="#808080" strokeWidth="1"><circle cx="12" cy="12" r="10" /><text x="12" y="12" textAnchor="middle" dy=".3em" fontSize="11" fill="#1a1a2e" fontWeight="bold">2</text></svg></span>;
        if (rank === 3) return <span className="medal bronze"><svg width="20" height="20" viewBox="0 0 24 24" fill="#cd7f32" stroke="#8b4513" strokeWidth="1"><circle cx="12" cy="12" r="10" /><text x="12" y="12" textAnchor="middle" dy=".3em" fontSize="11" fill="#1a1a2e" fontWeight="bold">3</text></svg></span>;
        return <span className="rank-num">{rank}</span>;
    };

    return (
        <div className="leaderboard-page">
            <div className="leaderboard-header">
                <Link to="/puzzles" className="back-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Back to Puzzles
                </Link>
                <h1><TrophyIcon size={32} color="#fbbf24" /> Global Leaderboard</h1>
                <p>See how you compare with other puzzle solvers</p>
            </div>

            <div className="leaderboard-tabs">
                {tabs.map(tab => {
                    const IconComponent = tab.Icon;
                    return (
                        <button
                            key={tab.id}
                            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span className="tab-icon"><IconComponent size={16} /></span>
                            <span className="tab-label">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {isAuthenticated && userRank && userRank.rank && (
                <div className="user-rank-card">
                    <div className="user-rank-glow"></div>
                    <div className="user-rank-main">
                        <div className="user-rank-profile">
                            <div className="user-rank-avatar">
                                <img
                                    src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
                                    alt=""
                                />
                                <div className="user-rank-badge">
                                    <TrophyIcon size={14} color="#1a1a2e" />
                                </div>
                            </div>
                            <div className="user-rank-details">
                                <span className="your-rank-label">Your Global Standing</span>
                                <h2 className="your-rank-value">Rank #{userRank.rank}</h2>
                            </div>
                        </div>
                        <div className="user-rank-stats">
                            <div className="rank-stat">
                                <div className="rank-stat-icon solved">
                                    <CheckIcon size={18} />
                                </div>
                                <div className="rank-stat-info">
                                    <span className="stat-val">{userRank.value}</span>
                                    <span className="stat-lbl">{getValueLabel()}</span>
                                </div>
                            </div>
                            <div className="rank-stat">
                                <div className="rank-stat-icon percentile">
                                    <TrendUpIcon size={18} />
                                </div>
                                <div className="rank-stat-info">
                                    <span className="stat-val">Top {userRank.percentile}%</span>
                                    <span className="stat-lbl">Overall Performance</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!isAuthenticated && (
                <div className="auth-prompt">
                    <p>Sign in to see your ranking!</p>
                    <Link to="/signin" className="signin-btn">Sign In</Link>
                </div>
            )}

            <div className="leaderboard-table">
                <div className="table-header">
                    <span className="col-rank">Rank</span>
                    <span className="col-player">Player</span>
                    <span className="col-value">{getValueLabel()}</span>
                    <span className="col-accuracy">Accuracy</span>
                </div>

                {loading ? (
                    <div className="table-loading">
                        <div className="loading-spinner"></div>
                        <span>Loading...</span>
                    </div>
                ) : leaderboard.length === 0 ? (
                    <div className="table-empty">
                        <p>No players on the leaderboard yet!</p>
                    </div>
                ) : (
                    <div className="table-body">
                        {leaderboard.map((entry) => (
                            <div
                                key={entry.userId || entry.rank}
                                className={`table-row ${user && entry.userId === user._id ? 'is-user' : ''}`}
                            >
                                <span className="col-rank">{getRankBadge(entry.rank)}</span>
                                <span className="col-player">
                                    <img
                                        src={entry.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.username}`}
                                        alt=""
                                        className="player-avatar"
                                    />
                                    <span className="player-name">{entry.username}</span>
                                    {entry.country && <span className="player-country">{entry.country}</span>}
                                </span>
                                <span className="col-value">{formatValue(entry)}</span>
                                <span className="col-accuracy">{entry.accuracy}%</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="leaderboard-footer">
                <p>Minimum 10 puzzles attempted to appear on leaderboard</p>
            </div>
        </div>
    );
};

export default LeaderboardPage;
