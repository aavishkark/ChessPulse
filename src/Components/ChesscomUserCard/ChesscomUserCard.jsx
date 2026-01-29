import { useState, useCallback, useEffect } from 'react';
import { getChesscomUserFull } from '../../services/chesscomUserService';
import './ChesscomUserCard.css';

export default function ChesscomUserCard({ initialUsername = '' }) {
    const [username, setUsername] = useState(initialUsername || '');
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchUser = useCallback(async () => {
        if (!username?.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const data = await getChesscomUserFull(username.trim());
            setUserData(data);
        } catch (err) {
            setError(err.message);
            setUserData(null);
        } finally {
            setLoading(false);
        }
    }, [username]);

    useEffect(() => {
        if (initialUsername) {
            fetchUser();
        }
    }, []);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            fetchUser();
        }
    };

    const getRating = (stats, type) => {
        const data = stats?.[type]?.last;
        if (!data) return null;
        return {
            rating: data.rating || '?',
            rd: data.rd || 0
        };
    };

    const getRecord = (stats, type) => {
        const data = stats?.[type]?.record;
        if (!data) return null;
        return `${data.win || 0}W / ${data.loss || 0}L / ${data.draw || 0}D`;
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Unknown';
        return new Date(timestamp * 1000).toLocaleDateString();
    };

    return (
        <div className="chesscom-user-card">
            <div className="chesscom-search">
                <input
                    type="text"
                    placeholder="Enter Chess.com username..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyPress={handleKeyPress}
                />
                <button
                    className="chesscom-search-btn"
                    onClick={fetchUser}
                    disabled={loading || !username.trim()}
                >
                    {loading ? '...' : 'Search'}
                </button>
            </div>

            {loading && (
                <div className="chesscom-loading">
                    <div className="chesscom-loading-spinner"></div>
                    <p>Fetching player data...</p>
                </div>
            )}

            {error && !loading && (
                <div className="chesscom-error">
                    <p>⚠️ {error}</p>
                </div>
            )}

            {!userData && !loading && !error && (
                <div className="chesscom-empty">
                    <p>🔍 Search for a Chess.com player to see their stats</p>
                </div>
            )}

            {userData && !loading && (
                <>
                    <div className="chesscom-user-header">
                        <div className="avatar-section">
                            {userData.profile?.avatar ? (
                                <img
                                    src={userData.profile.avatar}
                                    alt={userData.profile.username}
                                    className="chesscom-user-avatar"
                                />
                            ) : (
                                <div className="chesscom-user-avatar-fallback">
                                    {userData.profile?.username?.charAt(0) || '?'}
                                </div>
                            )}
                            {userData.profile?.country && (
                                <span className="country-flag" title={userData.profile.country}>
                                    {/* Extract country code from URL if possible, or just link */}
                                    🌍
                                </span>
                            )}
                        </div>
                        <div className="chesscom-user-info">
                            <h3>{userData.profile?.username}</h3>
                            <div className="chesscom-user-meta">
                                <span>Joined {formatDate(userData.profile?.joined)}</span>
                                {userData.profile?.status && (
                                    <span className={`chesscom-status-badge ${userData.profile.status}`}>
                                        {userData.profile.status}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {userData.stats && (
                        <div className="chesscom-stats-grid">
                            {[
                                { key: 'chess_bullet', label: 'Bullet', className: 'bullet' },
                                { key: 'chess_blitz', label: 'Blitz', className: 'blitz' },
                                { key: 'chess_rapid', label: 'Rapid', className: 'rapid' },
                                { key: 'chess_daily', label: 'Daily', className: 'daily' }
                            ].map(({ key, label, className }) => {
                                const statsObj = userData.stats?.[key];
                                const rating = statsObj?.last?.rating || statsObj?.rating; // simpler access
                                const best = statsObj?.best?.rating;
                                const record = statsObj?.record;

                                if (!rating && !record) return null;

                                // Calculate Donut Chart segments
                                let chartStyle = {};
                                let totalGames = 0;
                                let winPct = 0, lossPct = 0, drawPct = 0;

                                if (record) {
                                    totalGames = (record.win || 0) + (record.loss || 0) + (record.draw || 0);
                                    if (totalGames > 0) {
                                        const winDeg = ((record.win || 0) / totalGames) * 360;
                                        const lossDeg = ((record.loss || 0) / totalGames) * 360;
                                        // Draw takes the rest
                                        chartStyle = {
                                            background: `conic-gradient(
                                                #4ade80 0deg ${winDeg}deg,
                                                #f87171 ${winDeg}deg ${winDeg + lossDeg}deg,
                                                #94a3b8 ${winDeg + lossDeg}deg 360deg
                                            )`
                                        };
                                        winPct = Math.round(((record.win || 0) / totalGames) * 100);
                                        lossPct = Math.round(((record.loss || 0) / totalGames) * 100);
                                        drawPct = 100 - winPct - lossPct;
                                    }
                                }

                                return (
                                    <div key={key} className="chesscom-stat-card">
                                        <div className="stat-card-header">
                                            <span className="stat-label">{label}</span>
                                            {best && <span className="stat-best" title="Best Rating">Best: {best}</span>}
                                        </div>

                                        <div className="stat-card-body">
                                            <div className="rating-display">
                                                <span className={`current-rating ${className}`}>{rating || '?'}</span>
                                            </div>

                                            {totalGames > 0 && (
                                                <div className="chart-container">
                                                    <div className="donut-chart" style={chartStyle}>
                                                        <div className="chart-center">
                                                            <span>{winPct}%</span>
                                                            <small>Win</small>
                                                        </div>
                                                    </div>
                                                    <div className="chart-legend">
                                                        <div className="legend-item win" title={`${record.win} Wins`}>
                                                            <div className="dot"></div>
                                                            <span>W</span>
                                                        </div>
                                                        <div className="legend-item loss" title={`${record.loss} Losses`}>
                                                            <div className="dot"></div>
                                                            <span>L</span>
                                                        </div>
                                                        <div className="legend-item draw" title={`${record.draw} Draws`}>
                                                            <div className="dot"></div>
                                                            <span>D</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {[
                                { key: 'tactics', label: 'Tactics', className: 'tactics' },
                                { key: 'puzzle_rush', label: 'Puzzle Rush', className: 'puzzle-rush' }
                            ].map(({ key, label, className }) => {
                                const statsObj = userData.stats?.[key];
                                const score = statsObj?.highest?.rating || statsObj?.score; // Tactics use highest usually
                                if (!score) return null;

                                return (
                                    <div key={key} className="chesscom-stat-card simple">
                                        <span className="stat-label">{label}</span>
                                        <span className={`current-rating ${className}`}>{score}</span>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    <a
                        href={userData.profile?.url || `https://www.chess.com/member/${userData.profile?.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="chesscom-profile-link"
                    >
                        View Full Profile on Chess.com →
                    </a>
                </>
            )}
        </div>
    );
}
