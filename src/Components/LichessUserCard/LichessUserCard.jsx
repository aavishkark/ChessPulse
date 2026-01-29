import { useState, useCallback, useEffect } from 'react';
import { getLichessUser } from '../../services/lichessUserService';
import './LichessUserCard.css';

export default function LichessUserCard({ initialUsername = '' }) {
    const [username, setUsername] = useState(initialUsername || '');
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchUser = useCallback(async () => {
        if (!username?.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const [userResponse, gamesResponse] = await Promise.all([
                getLichessUser(username.trim()),
                import('../../services/lichessUserService').then(m => m.getUserRecentGames(username.trim())).catch(() => [])
            ]);

            setUserData({ ...userResponse, games: gamesResponse || [] });
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

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num?.toString() || '0';
    };

    const getRatingData = (perfs, type) => {
        const perf = perfs?.[type];
        if (!perf) return null;
        return {
            rating: perf.rating || '?',
            games: perf.games || 0,
            rd: perf.rd || 0
        };
    };

    return (
        <div className="lichess-user-card">
            <div className="lichess-search">
                <input
                    type="text"
                    placeholder="Enter Lichess username..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyPress={handleKeyPress}
                />
                <button
                    className="lichess-search-btn"
                    onClick={fetchUser}
                    disabled={loading || !username.trim()}
                >
                    {loading ? '...' : 'Search'}
                </button>
            </div>

            {loading && (
                <div className="lichess-loading">
                    <div className="lichess-loading-spinner"></div>
                    <p>Fetching player data...</p>
                </div>
            )}
            {error && !loading && (
                <div className="lichess-error">
                    <p>⚠️ {error}</p>
                </div>
            )}

            {!userData && !loading && !error && (
                <div className="lichess-empty">
                    <p>🔍 Search for a Lichess player to see their stats</p>
                </div>
            )}

            {userData && !loading && (
                <>
                    <div className="lichess-user-header">
                        <div className="lichess-user-avatar">
                            {userData.username?.charAt(0) || '?'}
                        </div>
                        <div className="lichess-user-info">
                            <h3>{userData.username}</h3>
                            <div className="lichess-user-meta">
                                {userData.online ? (
                                    <span className="lichess-online-badge" title="Online"></span>
                                ) : (
                                    <span className="lichess-offline-badge" title="Offline"></span>
                                )}
                                <span>{userData.online ? 'Online' : 'Offline'}</span>
                                {userData.patron && (
                                    <span className="lichess-patron-badge">Patron</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {userData.count && (
                        <div className="lichess-global-stats">
                            <div className="global-chart-section">
                                {(() => {
                                    const { win, loss, draw, all } = userData.count;
                                    const winDeg = (win / all) * 360;
                                    const lossDeg = (loss / all) * 360;
                                    const chartStyle = {
                                        background: `conic-gradient(
                                            #4ade80 0deg ${winDeg}deg,
                                            #f87171 ${winDeg}deg ${winDeg + lossDeg}deg,
                                            #94a3b8 ${winDeg + lossDeg}deg 360deg
                                        )`
                                    };
                                    return (
                                        <div className="global-donut-wrapper">
                                            <div className="donut-chart large" style={chartStyle}>
                                                <div className="chart-center">
                                                    <span>{all}</span>
                                                    <small>Games</small>
                                                </div>
                                            </div>
                                            <div className="global-legend">
                                                <div className="g-item"><span className="dot win"></span> {win} Wins</div>
                                                <div className="g-item"><span className="dot loss"></span> {loss} Losses</div>
                                                <div className="g-item"><span className="dot draw"></span> {draw} Draws</div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {userData.perfs && (
                        <div className="lichess-stats-grid">
                            {[
                                { key: 'bullet', label: 'Bullet', className: 'bullet' },
                                { key: 'blitz', label: 'Blitz', className: 'blitz' },
                                { key: 'rapid', label: 'Rapid', className: 'rapid' },
                                { key: 'classical', label: 'Classical', className: 'classical' },
                                { key: 'puzzle', label: 'Puzzles', className: 'puzzle' }
                            ].map(({ key, label, className }) => {
                                const perf = userData.perfs[key];
                                if (!perf || perf.games === 0) return null;

                                return (
                                    <div key={key} className="lichess-stat-card">
                                        <div className="stat-card-header">
                                            <span className="stat-label">{label}</span>
                                        </div>
                                        <div className="stat-card-body">
                                            <div className={`current-rating ${className}`}>{perf.rating}</div>
                                            <div className="games-count-bar">
                                                <span className="count-label">{perf.games} games</span>
                                                <div className="progress-bg">
                                                    <div
                                                        className={`progress-fill ${className}`}
                                                        style={{ width: `${Math.min((perf.games / 2000) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <a
                        href={`https://lichess.org/@/${userData.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="lichess-profile-link"
                    >
                        View Full Profile on Lichess →
                    </a>
                </>
            )}
        </div >
    );
}
