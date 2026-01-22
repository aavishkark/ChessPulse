import { useState, useCallback } from 'react';
import { getLichessUser } from '../../services/lichessUserService';
import './LichessUserCard.css';

export default function LichessUserCard({ initialUsername = '' }) {
    const [username, setUsername] = useState(initialUsername);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchUser = useCallback(async () => {
        if (!username.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const data = await getLichessUser(username.trim());
            setUserData(data);
        } catch (err) {
            setError(err.message);
            setUserData(null);
        } finally {
            setLoading(false);
        }
    }, [username]);

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

                    <div className="lichess-stats-grid">
                        {['bullet', 'blitz', 'rapid', 'classical', 'puzzle'].map((type) => {
                            const data = getRatingData(userData.perfs, type);
                            if (!data) return null;
                            return (
                                <div key={type} className="lichess-stat-box">
                                    <div className="lichess-stat-label">{type}</div>
                                    <div className={`lichess-stat-value ${type}`}>{data.rating}</div>
                                    <div className="lichess-stat-games">{formatNumber(data.games)} games</div>
                                </div>
                            );
                        })}
                    </div>

                    {userData.count && (
                        <div className="lichess-game-counts">
                            <div className="lichess-game-stat wins">
                                <div className="count">{formatNumber(userData.count.win)}</div>
                                <div className="label">Wins</div>
                            </div>
                            <div className="lichess-game-stat losses">
                                <div className="count">{formatNumber(userData.count.loss)}</div>
                                <div className="label">Losses</div>
                            </div>
                            <div className="lichess-game-stat draws">
                                <div className="count">{formatNumber(userData.count.draw)}</div>
                                <div className="label">Draws</div>
                            </div>
                            <div className="lichess-game-stat">
                                <div className="count">{formatNumber(userData.count.all)}</div>
                                <div className="label">Total</div>
                            </div>
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
        </div>
    );
}
