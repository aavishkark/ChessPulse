import { useState, useCallback } from 'react';
import { getChesscomUserFull } from '../../services/chesscomUserService';
import './ChesscomUserCard.css';

export default function ChesscomUserCard({ initialUsername = '' }) {
    const [username, setUsername] = useState(initialUsername);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchUser = useCallback(async () => {
        if (!username.trim()) return;

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
                                { key: 'chess_daily', label: 'Daily', className: 'daily' },
                                { key: 'tactics', label: 'Tactics', className: 'tactics' }
                            ].map(({ key, label, className }) => {
                                const rating = getRating(userData.stats, key);
                                const record = getRecord(userData.stats, key);
                                if (!rating) return null;
                                return (
                                    <div key={key} className="chesscom-stat-box">
                                        <div className="chesscom-stat-label">{label}</div>
                                        <div className={`chesscom-stat-value ${className}`}>{rating.rating}</div>
                                        {record && <div className="chesscom-stat-record">{record}</div>}
                                    </div>
                                );
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
