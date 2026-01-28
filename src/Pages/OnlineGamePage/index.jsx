import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useBoardCustomization } from '../../contexts/BoardCustomizationContext';
import { getCustomPieces } from '../../utils/pieceSets';
import { playSound, getMoveSound } from '../../utils/sounds';
import socketService from '../../services/socketService';
import { useAuth } from '../../contexts/AuthContext';
import PromotionDialog from '../../Components/PromotionDialog/PromotionDialog';
import './onlineGame.css';

export default function OnlineGamePage() {
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();
    const { darkSquareColor, lightSquareColor, showNotation: showNotationFromCustomization, pieceSet, animationSpeed, highlightColor, soundEnabled, soundTheme } = useBoardCustomization();
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
    const [myRating, setMyRating] = useState(1200);
    const [activeTab, setActiveTab] = useState('moves');
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef(null);
    const [showResignModal, setShowResignModal] = useState(false);
    const [showDrawOfferBubble, setShowDrawOfferBubble] = useState(false);
    const [drawOffered, setDrawOffered] = useState(false);
    const [gameNotification, setGameNotification] = useState(null);
    const [chatBubble, setChatBubble] = useState(null);

    const getRatingCategory = (timeControl) => {
        const [minutes, increment = 0] = timeControl.split('+').map(Number);
        const estimatedTime = minutes + (increment * 40 / 60);
        if (estimatedTime < 3) return 'bullet';
        if (estimatedTime < 10) return 'blitz';
        return 'rapid';
    };

    useEffect(() => {
        if (refreshUser) {
            refreshUser();
        }
    }, []);

    useEffect(() => {
        if (user && selectedTimeControl) {
            const category = getRatingCategory(selectedTimeControl);
            const userRating = user.ratings?.[category]?.rating;
            if (userRating) setMyRating(userRating);
        }
    }, [user, selectedTimeControl]);

    const gameRef = useRef(new Chess());
    const timerRef = useRef(null);

    useEffect(() => {
        socketService.connect();

        const checkRejoin = () => {
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
        };

        if (socketService.socket?.connected) {
            socketService.emit('get_challenges');
            checkRejoin();
        }

        socketService.on('connect', () => {
            socketService.emit('get_challenges');
            checkRejoin();
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

            setDrawOffered(false);
            setShowDrawOfferBubble(false);
            setShowResignModal(false);
        });

        socketService.on('game_rejoined', (data) => {
            setPlayerColor(data.color);
            setOpponent(data.opponent);
            setRoomId(data.roomId);
            setMyRating(data.myRating || 1200);
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
            setChatMessages(data.chatHistory || []);

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

        socketService.on('receive_chat', (message) => {
            setChatMessages(prev => {
                const isDuplicate = prev.some(m => m.timestamp === message.timestamp && m.sender === message.sender && m.message === message.message);
                if (isDuplicate) return prev;

                if (message.sender !== (user?.username || 'Guest')) {
                    setChatBubble(message.message);
                    setTimeout(() => setChatBubble(null), 5000);
                }

                return [...prev, message];
            });
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

        socketService.on('game_ended', ({ result, reason, ratingChanges }) => {
            setGameResult({ result, reason, ratingChanges });
            setGameState('game_over');
            localStorage.removeItem('chess_session');
            if (refreshUser) refreshUser();
        });

        socketService.on('error', ({ message }) => {

            alert(message);
        });

        socketService.on('challenge_list_updated', (challengeList) => {
            const myId = socketService.socket?.id;
            const myOwn = challengeList.find(c => c.playerId === myId);

            if (myOwn) {
                setMyChallenge(myOwn);
                setGameState('searching');
            } else {
                setMyChallenge(null);
                setGameState(prev => prev === 'searching' ? 'idle' : prev);
            }

            setChallenges(challengeList.filter(c => c.playerId !== myId));
        });

        socketService.on('challenge_created', ({ challengeId, challenge }) => {

            setMyChallenge({ id: challengeId, ...challenge });
        });

        socketService.on('challenge_cancelled', () => {

            setMyChallenge(null);
        });

        socketService.on('draw_offered', () => {
            setShowDrawOfferBubble(true);
        });

        socketService.on('draw_declined', () => {
            setDrawOffered(false);
            setShowDrawOfferBubble(false);
            setGameNotification("Draw Declined");
            setTimeout(() => setGameNotification(null), 3000);
        });

        return () => {
            socketService.off('connect');
            socketService.off('game_start');
            socketService.off('game_rejoined');
            socketService.off('rejoin_error');
            socketService.off('opponent_disconnected');
            socketService.off('opponent_reconnected');
            socketService.off('waiting_for_opponent');
            socketService.off('game_start');
            socketService.off('game_rejoined');
            socketService.off('rejoin_error');
            socketService.off('opponent_disconnected');
            socketService.off('opponent_reconnected');
            socketService.off('waiting_for_opponent');
            socketService.off('opponent_move');
            socketService.off('receive_chat');
            socketService.off('game_ended');
            socketService.off('error');
            socketService.off('challenge_list_updated');
            socketService.off('challenge_created');
            socketService.off('challenge_cancelled');
            socketService.off('draw_offered');
            socketService.off('draw_declined');
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

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages, activeTab]);

    const sendChat = (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        socketService.emit('send_chat', { roomId, message: chatInput });
        setChatInput('');
    };

    const findGame = () => {
        setGameState('searching');

        let timeControl = selectedTimeControl;
        if (selectedTimeControl === 'custom') {
            const mins = parseInt(customMinutes) || 5;
            const inc = parseInt(customIncrement) || 0;
            timeControl = `${mins}+${inc}`;
        }

        const ratingCategory = getRatingCategory(timeControl);
        const userRating = user?.ratings?.[ratingCategory]?.rating || 1200;
        setMyRating(userRating);

        socketService.emit('find_game', {
            username: user?.username || 'Guest',
            rating: userRating,
            avatar: user?.avatar,
            timeControl
        });
    };

    const cancelSearch = () => {
        if (myChallenge) {
            socketService.emit('cancel_challenge', { challengeId: myChallenge.id });
        }
        setGameState('idle');
    };

    const createChallenge = () => {
        let timeControl = selectedTimeControl;
        if (selectedTimeControl === 'custom') {
            const mins = parseInt(customMinutes) || 5;
            const inc = parseInt(customIncrement) || 0;
            timeControl = `${mins}+${inc}`;
        }

        const ratingCategory = getRatingCategory(timeControl);
        const userRating = user?.ratings?.[ratingCategory]?.rating || 1200;
        setMyRating(userRating);

        socketService.emit('create_challenge', {
            username: user?.username || 'Guest',
            rating: userRating,
            avatar: user?.avatar,
            timeControl
        });
    };

    const acceptChallenge = (challenge) => {
        const ratingCategory = getRatingCategory(challenge.timeControl);
        const userRating = user?.ratings?.[ratingCategory]?.rating || 1200;
        setMyRating(userRating);

        socketService.emit('accept_challenge', {
            challengeId: challenge.id,
            username: user?.username || 'Guest',
            rating: userRating,
            avatar: user?.avatar
        });
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

            setShowDrawOfferBubble(false);
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
        setShowResignModal(true);
    };

    const confirmResign = () => {
        socketService.emit('resign', { roomId });
        setShowResignModal(false);
    };

    const handleOfferDraw = () => {
        socketService.emit('offer_draw', { roomId });
        setDrawOffered(true);
    };

    const handleAcceptDraw = () => {
        socketService.emit('accept_draw', { roomId });
        setShowDrawOfferBubble(false);
    };

    const handleDeclineDraw = () => {
        socketService.emit('decline_draw', { roomId });
        setShowDrawOfferBubble(false);
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
        const val = Number(seconds);
        if (isNaN(val)) return '0:00';
        const totalSeconds = Math.floor(val);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="online-game-page">
            <div className="online-game-container">

                {gameState === 'idle' && (
                    <div className="online-dashboard">
                        <div className="dashboard-header">
                            <h2>Ready to Pulse?</h2>
                            <p>Select your pace or challenge a friend.</p>
                        </div>

                        <div className="dashboard-grid">
                            <div className="time-control-card bullet" onClick={() => setSelectedTimeControl('3+0')}>
                                <div className="card-icon">🚀</div>
                                <div className="card-content">
                                    <h3>Bullet</h3>
                                    <span className="time-label">3+0</span>
                                </div>
                                <div className={`selection-indicator ${selectedTimeControl === '3+0' ? 'active' : ''}`} />
                            </div>

                            <div className="time-control-card blitz" onClick={() => setSelectedTimeControl('5+0')}>
                                <div className="card-icon">⚡</div>
                                <div className="card-content">
                                    <h3>Blitz</h3>
                                    <span className="time-label">5+0</span>
                                </div>
                                <div className={`selection-indicator ${selectedTimeControl === '5+0' ? 'active' : ''}`} />
                            </div>

                            <div className="time-control-card rapid" onClick={() => setSelectedTimeControl('10+0')}>
                                <div className="card-icon">🐢</div>
                                <div className="card-content">
                                    <h3>Rapid</h3>
                                    <span className="time-label">10+0</span>
                                </div>
                                <div className={`selection-indicator ${selectedTimeControl === '10+0' ? 'active' : ''}`} />
                            </div>

                            <div className="mini-controls">
                                {['15+10', 'custom'].map(tc => (
                                    <button
                                        key={tc}
                                        className={`mini-control-btn ${selectedTimeControl === tc ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelectedTimeControl(tc);
                                            setShowCustomTime(tc === 'custom');
                                        }}
                                    >
                                        {tc === 'custom' ? 'Custom' : tc}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {showCustomTime && (
                            <div className="custom-config-panel">
                                <div className="time-input-group">
                                    <label>Minutes</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="180"
                                        value={customMinutes}
                                        onChange={(e) => setCustomMinutes(e.target.value)}
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
                                    />
                                </div>
                            </div>
                        )}

                        <div className="action-bar">
                            <button className="primary-action-btn pulse-glow" onClick={findGame}>
                                <span>Find Opponent</span>
                                <div className="btn-glow"></div>
                            </button>
                            <button className="secondary-action-btn" onClick={createChallenge}>
                                Create Challenge
                            </button>
                        </div>

                        <div className="challenges-feed">
                            <div className="feed-header">
                                <h3>Open Challenges</h3>
                                <span className="live-dot"></span>
                            </div>

                            {myChallenge && (
                                <div className="my-challenge-card">
                                    <div className="pulse-ring"></div>
                                    <span>Waiting for challenger...</span>
                                    <button onClick={cancelChallenge}>Cancel</button>
                                </div>
                            )}

                            <div className="challenges-list">
                                {challenges.length === 0 ? (
                                    <div className="empty-feed">
                                        <p>No active challenges right now.</p>
                                        <span className="sub-text">Be the first to create one!</span>
                                    </div>
                                ) : (
                                    challenges.map(challenge => (
                                        <div key={challenge.id} className="challenge-item">
                                            <div className="challenge-info">
                                                <span className="c-time">{challenge.timeControl}</span>
                                                <span className="c-player">{challenge.username}</span>
                                                <span className="c-rating">{challenge.username === 'Guest' ? '' : `(${challenge.rating})`}</span>
                                            </div>
                                            <button className="accept-challenge-btn" onClick={() => acceptChallenge(challenge)}>
                                                Accept
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="bots-teaser" onClick={() => navigate('/bots')}>
                            <div className="teaser-content">
                                <h3>Train with Bots</h3>
                                <p>Sharpen your skills against AI opponents.</p>
                            </div>
                            <div className="teaser-arrow">→</div>
                        </div>
                    </div>
                )}

                {gameState === 'searching' && (
                    <div className="searching-container">
                        <div className="radar-animation">
                            <div className="radar-sweep"></div>
                        </div>
                        <h2>Scanning for Opponents</h2>
                        <p>{selectedTimeControl} • {myRating} Rating</p>
                        <button className="cancel-search-btn" onClick={cancelSearch}>
                            Cancel Search
                        </button>
                    </div>
                )}

                {gameState === 'playing' && (
                    <div className="game-content">
                        <div className="left-section">
                            <div className="player-card opponent-card">
                                <img
                                    src={opponent?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${opponent?.username || 'opponent'}`}
                                    alt="Opponent"
                                    className="player-avatar"
                                />
                                {showDrawOfferBubble && (
                                    <div className="draw-offer-bubble">
                                        <div className="bubble-text">Wanna draw?</div>
                                        <div className="bubble-actions">
                                            <button onClick={handleAcceptDraw} className="bubble-btn accept">Yes</button>
                                            <button onClick={handleDeclineDraw} className="bubble-btn decline">No</button>
                                        </div>
                                    </div>
                                )}
                                {gameNotification && (
                                    <div className="notification-bubble">
                                        {gameNotification}
                                    </div>
                                )}
                                {chatBubble && (
                                    <div className="chat-bubble-overhead">
                                        {chatBubble}
                                    </div>
                                )}
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
                                    id="online-game-board"
                                    boardOrientation={playerColor}
                                    options={{
                                        position: game.fen(),
                                        onPieceDrop: onDrop,
                                        animationDurationInMs: animationSpeed,
                                        allowDragging: true,
                                        showNotation: showNotationFromCustomization,
                                        squareStyles: lastMove ? {
                                            [lastMove.from]: { backgroundColor: highlightColor },
                                            [lastMove.to]: { backgroundColor: highlightColor }
                                        } : {},
                                        darkSquareStyle: { backgroundColor: darkSquareColor },
                                        lightSquareStyle: { backgroundColor: lightSquareColor },
                                        customPieces: getCustomPieces(pieceSet)
                                    }}
                                />
                            </div>

                            <div className="player-card your-card">
                                <img
                                    src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'guest'}`}
                                    alt="You"
                                    className="player-avatar"
                                />
                                <div className="player-details">
                                    <span className="player-name">
                                        {user?.username || 'Guest'} ({myRating})
                                    </span>
                                    <div className={`player-clock ${playerColor === 'white' ? (whiteTime < 20 ? 'low-time' : '') : (blackTime < 20 ? 'low-time' : '')}`}>
                                        {playerColor === 'white' ? formatTime(whiteTime) : formatTime(blackTime)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="right-section">
                            <div className="tabs-header">
                                <button
                                    className={`tab-btn ${activeTab === 'moves' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('moves')}
                                >
                                    Moves
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('chat')}
                                >
                                    Chat
                                </button>
                            </div>

                            {activeTab === 'moves' ? (
                                <div className="moves-panel">
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
                            ) : (
                                <div className="chat-panel">
                                    <div className="chat-messages">
                                        {chatMessages.length === 0 ? (
                                            <p className="no-messages">No messages yet</p>
                                        ) : (
                                            chatMessages.map((msg, i) => (
                                                <div key={i} className={`chat-message ${msg.sender === (user?.username || 'Guest') ? 'mine' : 'theirs'}`}>
                                                    <span className="msg-sender">{msg.sender}</span>
                                                    <span className="msg-text">{msg.message}</span>
                                                </div>
                                            ))
                                        )}
                                        <div ref={chatEndRef} />
                                    </div>
                                    <form onSubmit={sendChat} className="chat-input-area">
                                        <input
                                            type="text"
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            placeholder="Type a message..."
                                        />
                                        <button type="submit">Send</button>
                                    </form>
                                </div>
                            )}

                            <div className="controls-panel">
                                <button
                                    className="draw-btn"
                                    onClick={handleOfferDraw}
                                    disabled={drawOffered || moveHistory.length < 2}
                                    title={
                                        drawOffered
                                            ? "Draw offered"
                                            : (moveHistory.length < 2 ? "Draw available after 2 moves" : "Offer draw")
                                    }
                                >
                                    {drawOffered ? 'Draw Offered' : '½ Offer Draw'}
                                </button>
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
                            <button
                                className="analyze-btn"
                                onClick={() => navigate('/analysis', {
                                    state: {
                                        moves: moveHistory,
                                        playerColor,
                                        opponentName: opponent?.username,
                                        source: 'online',
                                        result: gameResult?.result === playerColor ? 'win' : gameResult?.result === 'draw' ? 'draw' : 'loss'
                                    }
                                })}
                            >
                                Analyze Game
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

            {showResignModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Resign Game?</h3>
                        <p>Are you sure you want to resign this game?</p>
                        <div className="modal-actions">
                            <button className="modal-btn secondary" onClick={() => setShowResignModal(false)}>Cancel</button>
                            <button className="modal-btn danger" onClick={confirmResign}>Resign</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
