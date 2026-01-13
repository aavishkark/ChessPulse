import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import socketService from '../../services/socketService';
import { useAuth } from '../../contexts/AuthContext';
import PromotionDialog from '../../Components/PromotionDialog/PromotionDialog';
import './onlineGame.css';

export default function OnlineGamePage() {
    const { user } = useAuth();
    const [gameState, setGameState] = useState('idle');
    const [game, setGame] = useState(new Chess());
    const [playerColor, setPlayerColor] = useState(null);
    const [opponent, setOpponent] = useState(null);
    const [roomId, setRoomId] = useState(null);
    const [gameResult, setGameResult] = useState(null);
    const [lastMove, setLastMove] = useState(null);
    const [showPromotion, setShowPromotion] = useState(false);
    const [pendingMove, setPendingMove] = useState(null);
    const [moveHistory, setMoveHistory] = useState([]);
    const [selectedTimeControl, setSelectedTimeControl] = useState('10+0');
    const [whiteTime, setWhiteTime] = useState(600);
    const [blackTime, setBlackTime] = useState(600);
    const [showCustomTime, setShowCustomTime] = useState(false);
    const [customMinutes, setCustomMinutes] = useState('5');
    const [customIncrement, setCustomIncrement] = useState('0');
    const [challenges, setChallenges] = useState([]);
    const [myChallenge, setMyChallenge] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('connected');
    const gameRef = useRef(new Chess());
    const timerRef = useRef(null);

    useEffect(() => {
        socketService.connect();

        socketService.on('connect', () => {


            const savedSession = localStorage.getItem('chess_session');
            if (savedSession) {
                const session = JSON.parse(savedSession);
                if (Date.now() - session.timestamp < 3600000) {
                    socketService.emit('rejoin_game', {
                        roomId: session.roomId,
                        oldSocketId: session.playerId
                    });
                } else {
                    localStorage.removeItem('chess_session');
                }
            }
        });

        socketService.on('game_start', (data) => {
            setPlayerColor(data.color);
            setOpponent(data.opponent);
            setRoomId(data.roomId);
            setGameState('playing');
            setSelectedTimeControl(data.timeControl);
            gameRef.current = new Chess();
            setGame(new Chess());
            setMoveHistory([]);
            setConnectionStatus('connected');

            localStorage.setItem('chess_session', JSON.stringify({
                roomId: data.roomId,
                playerId: socketService.socket?.id,
                timestamp: Date.now()
            }));

            const [minutes, increment] = data.timeControl.split('+').map(Number);
            const initialTime = minutes * 60;
            setWhiteTime(initialTime);
            setBlackTime(initialTime);
        });

        socketService.on('game_rejoined', (data) => {
            setPlayerColor(data.color);
            setOpponent(data.opponent);
            setRoomId(data.roomId);
            setGameState('playing');
            setSelectedTimeControl(data.timeControl);
            setConnectionStatus('connected');

            const newGame = new Chess();
            data.moves.forEach(move => {
                newGame.move(move);
            });
            gameRef.current = newGame;
            setGame(new Chess(newGame.fen()));
            setMoveHistory(data.moves);

            const history = newGame.history({ verbose: true });
            if (history.length > 0) {
                const lastMoveData = history[history.length - 1];
                setLastMove({ from: lastMoveData.from, to: lastMoveData.to });
            }

            setWhiteTime(data.whiteTime);
            setBlackTime(data.blackTime);

            localStorage.setItem('chess_session', JSON.stringify({
                roomId: data.roomId,
                playerId: socketService.socket?.id,
                timestamp: Date.now()
            }));
        });

        socketService.on('rejoin_error', (error) => {
            localStorage.removeItem('chess_session');
            setGameState('idle');
        });

        socketService.on('opponent_disconnected', (data) => {
            setConnectionStatus('opponent_disconnected');
        });

        socketService.on('opponent_reconnected', (data) => {
            setConnectionStatus('connected');
        });

        socketService.on('waiting_for_opponent', () => {

        });
        socketService.on('opponent_move', ({ move, fen, from, to }) => {

            try {
                gameRef.current.load(fen);
                setGame(new Chess(fen));

                if (from && to) {
                    setLastMove({ from, to });

                }

                setMoveHistory(prev => [...prev, move]);

                const [minutes, increment] = selectedTimeControl.split('+').map(Number);
                const incrementSeconds = increment || 0;
                if (incrementSeconds > 0) {
                    setWhiteTime(prev => playerColor === 'black' ? prev + incrementSeconds : prev);
                    setBlackTime(prev => playerColor === 'white' ? prev + incrementSeconds : prev);
                }
            } catch (error) {

            }
        });

        socketService.on('game_ended', ({ result, reason }) => {
            setGameResult({ result, reason });
            setGameState('game_over');
            localStorage.removeItem('chess_session');
        });

        socketService.on('error', ({ message }) => {

            alert(message);
        });

        socketService.on('challenge_list_updated', (challengeList) => {

            setChallenges(challengeList.filter(c => c.playerId !== socketService.socket?.id));
        });

        socketService.on('challenge_created', ({ challengeId, challenge }) => {

            setMyChallenge({ id: challengeId, ...challenge });
        });

        socketService.on('challenge_cancelled', () => {

            setMyChallenge(null);
        });

        return () => {
            socketService.off('connect'); // Clean up connect listener
            socketService.off('game_start');
            socketService.off('game_rejoined');
            socketService.off('rejoin_error');
            socketService.off('opponent_disconnected');
            socketService.off('opponent_reconnected');
            socketService.off('waiting_for_opponent');
            socketService.off('opponent_move');
            socketService.off('game_ended');
            socketService.off('error');
            socketService.off('challenge_list_updated');
            socketService.off('challenge_created');
            socketService.off('challenge_cancelled');
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    useEffect(() => {
        if (gameState !== 'playing') {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        timerRef.current = setInterval(() => {
            const turn = gameRef.current.turn();
            const isWhiteTurn = turn === 'w';

            if (isWhiteTurn) {
                setWhiteTime(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        socketService.emit('game_over', {
                            roomId,
                            result: 'black',
                            reason: 'White ran out of time'
                        });
                        return 0;
                    }
                    return prev - 1;
                });
            } else {
                setBlackTime(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        socketService.emit('game_over', {
                            roomId,
                            result: 'white',
                            reason: 'Black ran out of time'
                        });
                        return 0;
                    }
                    return prev - 1;
                });
            }
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [gameState, roomId]);

    const findGame = () => {
        setGameState('searching');

        let timeControl = selectedTimeControl;
        if (selectedTimeControl === 'custom') {
            const mins = parseInt(customMinutes) || 5;
            const inc = parseInt(customIncrement) || 0;
            timeControl = `${mins}+${inc}`;
        }

        socketService.emit('find_game', {
            username: user?.username || 'Guest',
            rating: 1200,
            timeControl
        });
    };

    const cancelSearch = () => {
        setGameState('idle');
    };

    const createChallenge = () => {
        let timeControl = selectedTimeControl;
        if (selectedTimeControl === 'custom') {
            const mins = parseInt(customMinutes) || 5;
            const inc = parseInt(customIncrement) || 0;
            timeControl = `${mins}+${inc}`;
        }

        socketService.emit('create_challenge', {
            username: user?.username || 'Guest',
            rating: 1200,
            timeControl
        });
    };

    const acceptChallenge = (challengeId) => {
        socketService.emit('accept_challenge', { challengeId });
    };

    const cancelChallenge = () => {
        if (myChallenge) {
            socketService.emit('cancel_challenge', { challengeId: myChallenge.id });
        }
    };

    const makeMove = useCallback((sourceSquare, targetSquare, promotion = 'q') => {


        try {
            const move = gameRef.current.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: promotion
            });



            if (move === null) {

                return false;
            }

            setGame(new Chess(gameRef.current.fen()));
            setLastMove({ from: sourceSquare, to: targetSquare });
            setMoveHistory(prev => [...prev, move.san]);

            const [minutes, increment] = selectedTimeControl.split('+').map(Number);
            const incrementSeconds = increment || 0;
            if (incrementSeconds > 0) {
                if (playerColor === 'white') {
                    setWhiteTime(prev => prev + incrementSeconds);
                } else {
                    setBlackTime(prev => prev + incrementSeconds);
                }
            }

            socketService.emit('make_move', {
                roomId,
                move: move.san,
                fen: gameRef.current.fen(),
                from: sourceSquare,
                to: targetSquare
            });



            if (gameRef.current.isCheckmate()) {

                const winner = gameRef.current.turn() === 'w' ? 'black' : 'white';
                socketService.emit('game_over', {
                    roomId,
                    result: winner,
                    reason: 'checkmate'
                });
            } else if (gameRef.current.isStalemate()) {

                socketService.emit('game_over', {
                    roomId,
                    result: 'draw',
                    reason: 'stalemate'
                });
            } else if (gameRef.current.isDraw()) {

                let reason = 'draw';
                if (gameRef.current.isInsufficientMaterial()) reason = 'insufficient material';
                else if (gameRef.current.isThreefoldRepetition()) reason = 'threefold repetition';

                socketService.emit('game_over', {
                    roomId,
                    result: 'draw',
                    reason
                });
            }

            return true;
        } catch (error) {

            return false;
        }
    }, [roomId]);

    const onDrop = ({ sourceSquare, targetSquare }) => {
        const turn = gameRef.current.turn();
        const isPlayerTurn = (turn === 'w' && playerColor === 'white') ||
            (turn === 'b' && playerColor === 'black');



        if (!isPlayerTurn) {
            return false;
        }

        const piece = gameRef.current.get(sourceSquare);
        const isPromotion = piece?.type === 'p' &&
            ((piece.color === 'w' && targetSquare[1] === '8') ||
                (piece.color === 'b' && targetSquare[1] === '1'));

        if (isPromotion) {
            setPendingMove({ sourceSquare, targetSquare });
            setShowPromotion(true);
            return true;
        }

        return makeMove(sourceSquare, targetSquare);
    };

    const handlePromotionSelect = (piece) => {
        setShowPromotion(false);
        if (pendingMove) {
            makeMove(pendingMove.sourceSquare, pendingMove.targetSquare, piece);
            setPendingMove(null);
        }
    };

    const resign = () => {
        if (window.confirm('Are you sure you want to resign?')) {
            socketService.emit('resign', { roomId });
        }
    };

    const playAgain = () => {
        setGameState('idle');
        setGame(new Chess());
        setPlayerColor(null);
        setOpponent(null);
        setRoomId(null);
        setGameResult(null);
        setMyChallenge(null);
        gameRef.current = new Chess();
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="online-game-page">
            <div className="online-game-container">
                <h1>Play Online</h1>

                {gameState === 'idle' && (
                    <div className="idle-state">
                        <p>Jump into a quick match!</p>

                        <div className="time-control-selector">
                            <h4>Time Control</h4>
                            <div className="time-controls">
                                {['3+0', '5+0', '10+0', '15+10', 'custom'].map(tc => (
                                    <button
                                        key={tc}
                                        className={`time-control-btn ${selectedTimeControl === tc ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelectedTimeControl(tc);
                                            if (tc === 'custom') {
                                                setShowCustomTime(true);
                                            } else {
                                                setShowCustomTime(false);
                                            }
                                        }}
                                    >
                                        {tc === 'custom' ? 'Custom' : tc}
                                    </button>
                                ))}
                            </div>

                            {showCustomTime && (
                                <div className="custom-time-inputs">
                                    <div className="time-input-group">
                                        <label>Minutes</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="180"
                                            value={customMinutes}
                                            onChange={(e) => setCustomMinutes(e.target.value)}
                                            placeholder="5"
                                        />
                                    </div>
                                    <div className="time-input-group">
                                        <label>Increment</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="60"
                                            value={customIncrement}
                                            onChange={(e) => setCustomIncrement(e.target.value)}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {myChallenge ? (
                            <div className="my-challenge-banner">
                                <p>Looking for someone brave enough to take you on...</p>
                                <button className="cancel-challenge-btn" onClick={cancelChallenge}>
                                    Cancel Challenge
                                </button>
                            </div>
                        ) : (
                            <div className="action-buttons">
                                <button className="find-game-btn" onClick={findGame}>
                                    Quick Play
                                </button>
                                <button className="create-challenge-btn" onClick={createChallenge}>
                                    Create Challenge
                                </button>
                            </div>
                        )}

                        <div className="challenges-section">
                            <h3>Open Challenges</h3>
                            {challenges.length === 0 ? (
                                <p className="no-challenges">No challenges available</p>
                            ) : (
                                <div className="challenges-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Time</th>
                                                <th>Player</th>
                                                <th>Rating</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {challenges.map(challenge => (
                                                <tr key={challenge.id}>
                                                    <td>{challenge.timeControl}</td>
                                                    <td>{challenge.username}</td>
                                                    <td>{challenge.username === 'Guest' ? '-' : challenge.rating}</td>
                                                    <td>
                                                        <button
                                                            className="accept-btn"
                                                            onClick={() => acceptChallenge(challenge.id)}
                                                        >
                                                            Accept
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {gameState === 'searching' && (
                    <div className="searching-state">
                        <div className="spinner"></div>
                        <p>Searching for opponent...</p>
                        <button className="cancel-btn" onClick={cancelSearch}>
                            Cancel
                        </button>
                    </div>
                )}

                {gameState === 'playing' && (
                    <div className="game-content">
                        <div className="left-section">
                            <div className="player-card opponent-card">
                                <div className={`player-color-box ${playerColor === 'white' ? 'black' : 'white'}`}></div>
                                <div className="player-details">
                                    <span className="player-name">
                                        {opponent?.username}
                                        {opponent?.username !== 'Guest' && opponent?.rating && ` (${opponent.rating})`}
                                        {connectionStatus === 'opponent_disconnected' && (
                                            <span className="disconnect-badge">Disconnected (30s)</span>
                                        )}
                                    </span>
                                    <div className={`player-clock ${playerColor === 'white' ? (blackTime < 20 ? 'low-time' : '') : (whiteTime < 20 ? 'low-time' : '')}`}>
                                        {playerColor === 'white' ? formatTime(blackTime) : formatTime(whiteTime)}
                                    </div>
                                </div>
                            </div>

                            <div className="board-container">
                                <Chessboard
                                    id="online-board"
                                    options={{
                                        position: game.fen(),
                                        onPieceDrop: onDrop,
                                        boardOrientation: playerColor,
                                        animationDurationInMs: 200,
                                        allowDragging: true,
                                        showNotation: true,
                                        squareStyles: lastMove ? {
                                            [lastMove.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
                                            [lastMove.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }
                                        } : {}
                                    }}
                                />
                            </div>

                            <div className="player-card your-card">
                                <div className={`player-color-box ${playerColor}`}></div>
                                <div className="player-details">
                                    <span className="player-name">
                                        {user?.username || 'Guest'} ({playerColor})
                                    </span>
                                    <div className={`player-clock ${playerColor === 'white' ? (whiteTime < 20 ? 'low-time' : '') : (blackTime < 20 ? 'low-time' : '')}`}>
                                        {playerColor === 'white' ? formatTime(whiteTime) : formatTime(blackTime)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="right-section">
                            <div className="moves-panel">
                                <h3>Moves</h3>
                                <div className="moves-list">
                                    {moveHistory.length === 0 ? (
                                        <p className="no-moves">No moves yet</p>
                                    ) : (
                                        <div className="moves-grid">
                                            {moveHistory.reduce((pairs, move, index) => {
                                                if (index % 2 === 0) {
                                                    pairs.push([move, moveHistory[index + 1]]);
                                                }
                                                return pairs;
                                            }, []).map((pair, i) => (
                                                <div key={i} className="move-pair">
                                                    <span className="move-number">{i + 1}.</span>
                                                    <span className="move white-move">{pair[0]}</span>
                                                    {pair[1] && <span className="move black-move">{pair[1]}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="controls-panel">
                                <button className="resign-btn" onClick={resign}>
                                    Resign
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {gameState === 'game_over' && (
                    <div className="game-over-state">
                        <h2>Game Over</h2>
                        <div className={`result-badge ${gameResult?.result === 'draw' ? 'draw' : (gameResult?.result === playerColor ? 'win' : 'loss')}`}>
                            {gameResult?.result === 'draw'
                                ? '🤝 Draw'
                                : (gameResult?.result === playerColor ? '🏆 You Won!' : '💀 You Lost')}
                        </div>
                        <p className="reason-text">{gameResult?.reason}</p>

                        <div className="game-over-controls">
                            <button className="play-again-btn" onClick={playAgain}>
                                Play Again
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {showPromotion && (
                <PromotionDialog
                    color={playerColor}
                    onSelect={handlePromotionSelect}
                />
            )}
        </div>
    );
}
