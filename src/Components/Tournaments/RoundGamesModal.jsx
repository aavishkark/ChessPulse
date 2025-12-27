import { useState, useEffect } from 'react';
import { fetchRoundGames, splitGames } from '../../utils/pgnStream';
import { parsePlayerNames, getGameResult } from '../../utils/pgnParser';
import './round-games-modal.css';

const RoundGamesModal = ({ roundId, roundName, isOpen, onClose, onSelectGame }) => {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pgnBuffer, setPgnBuffer] = useState('');

    useEffect(() => {
        if (!isOpen || !roundId) return;

        setLoading(true);
        setError(null);

        let cleanupFn = null;

        (async () => {
            try {
                cleanupFn = await fetchRoundGames(roundId, (buffer) => {
                    setPgnBuffer(buffer);
                    const gamesParsed = splitGames(buffer);

                    const gamesData = gamesParsed.map((pgn, index) => {
                        const { white, black } = parsePlayerNames(pgn);
                        const result = getGameResult(pgn);

                        return {
                            index,
                            white,
                            black,
                            result,
                            isLive: result === null
                        };
                    });

                    setGames(gamesData);
                    setLoading(false);
                });
            } catch (err) {
                console.error('Error loading games:', err);
                setError('Failed to load games');
                setLoading(false);
            }
        })();

        return () => {
            if (cleanupFn && typeof cleanupFn === 'function') {
                cleanupFn();
            }
        };
    }, [isOpen, roundId]);

    const handleGameClick = (gameIndex) => {
        onSelectGame(roundId, gameIndex);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="round-games-modal-overlay" onClick={onClose}>
            <div className="round-games-modal" onClick={(e) => e.stopPropagation()}>
                <div className="round-games-header">
                    <h2>{roundName || 'Round Games'}</h2>
                    <button className="modal-close-button" onClick={onClose}>×</button>
                </div>

                {loading && (
                    <div className="loading-state">
                        <div className="modal-loading-spinner"></div>
                        <p>Loading games...</p>
                    </div>
                )}

                {error && (
                    <div className="error-state">
                        <p>{error}</p>
                    </div>
                )}

                {!loading && !error && games.length === 0 && (
                    <div className="empty-state">
                        <p>No games found in this round</p>
                    </div>
                )}

                {!loading && !error && games.length > 0 && (
                    <div className="games-grid">
                        {games.map((game) => (
                            <div
                                key={game.index}
                                className="game-card"
                                onClick={() => handleGameClick(game.index)}
                            >
                                {game.isLive && <div className="live-badge">LIVE</div>}

                                <div className="modal-player white-player">
                                    <span className="modal-player-color">⬜</span>
                                    <span className="modal-player-name">{game.white}</span>
                                </div>

                                <div className="vs-divider">vs</div>

                                <div className="modal-player black-player">
                                    <span className="modal-player-color">⬛</span>
                                    <span className="modal-player-name">{game.black}</span>
                                </div>

                                {game.result && (
                                    <div className="game-result">{game.result}</div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoundGamesModal;
