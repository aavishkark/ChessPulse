import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useAuth } from '../../contexts/AuthContext';
import { getBotById, getRandomCatchphrase } from '../../data/botProfiles';
import { getStockfishService, destroyStockfishService } from '../../services/stockfishService';
import { botGameService } from '../../services/botGameService';
import { TrophyIcon, CheckIcon } from '../../Components/Icons/Icons';
import './botGame.css';

const BotGamePage = () => {
    const { botId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();

    const bot = getBotById(botId);
    const playerColor = searchParams.get('color') || 'white';

    const [game, setGame] = useState(new Chess());
    const [orientation, setOrientation] = useState(playerColor);
    const [lastMove, setLastMove] = useState(null);
    const [gameStatus, setGameStatus] = useState('playing');
    const [winner, setWinner] = useState(null);
    const [isThinking, setIsThinking] = useState(false);
    const [speechBubble, setSpeechBubble] = useState(null);
    const [moveHistory, setMoveHistory] = useState([]);
    const [gameStartTime] = useState(Date.now());
    const [gameRecorded, setGameRecorded] = useState(false);
    const [promotionMove, setPromotionMove] = useState(null);
    const engineRef = useRef(null);
    const bubbleTimerRef = useRef(null);
    const boardRef = useRef(null);

    useEffect(() => {
        const initEngine = async () => {
            try {
                engineRef.current = await getStockfishService();

                if (playerColor === 'black') {
                    setTimeout(() => makeBotMove(game), 1000);
                }
            } catch (error) {
                console.error('Failed to initialize Stockfish:', error);
                addChatMessage('system', 'Engine failed to load. Please refresh.');
            }
        };

        initEngine();
        showBotMessage(getRandomCatchphrase(botId) || "Let's play!");

        return () => {
            destroyStockfishService();
            if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
        };
    }, []);

    const showBotMessage = (text) => {
        if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);

        setSpeechBubble({ text, isVisible: true });

        bubbleTimerRef.current = setTimeout(() => {
            setSpeechBubble(prev => prev ? { ...prev, isVisible: false } : null);
            setTimeout(() => setSpeechBubble(null), 300);
        }, 4000);
    };

    useEffect(() => {
        const recordGame = async () => {
            if (gameStatus === 'playing' || gameRecorded || !isAuthenticated || !bot) return;

            let result;
            if (winner === 'player') {
                result = 'win';
            } else if (winner === 'bot') {
                result = 'loss';
            } else {
                result = 'draw';
            }

            try {
                await botGameService.recordGame({
                    botId: bot.id,
                    botName: bot.name,
                    botElo: bot.elo,
                    playerColor,
                    result,
                    endReason: gameStatus === 'resigned' ? 'resignation' : gameStatus,
                    moves: moveHistory,
                    finalFen: game.fen(),
                    durationMs: Date.now() - gameStartTime
                });
                setGameRecorded(true);
            } catch (error) {
                console.error('Failed to record game:', error);
            }
        };

        recordGame();
    }, [gameStatus, winner, isAuthenticated, bot, playerColor, moveHistory, game, gameStartTime, gameRecorded]);

    const checkGameEnd = useCallback((currentGame) => {
        if (currentGame.isCheckmate()) {
            const loser = currentGame.turn();
            const winnerSide = loser === 'w' ? 'black' : 'white';
            setGameStatus('checkmate');
            setWinner(winnerSide === playerColor ? 'player' : 'bot');

            if (winnerSide === playerColor) {
                showBotMessage("Well played! You got me this time.");
            } else {
                showBotMessage("Checkmate! Better luck next time.");
            }
            return true;
        }

        if (currentGame.isDraw()) {
            setGameStatus('draw');
            showBotMessage("A draw! That was a close game.");
            return true;
        }

        if (currentGame.isStalemate()) {
            setGameStatus('draw');
            showBotMessage("Stalemate! Nobody wins this time.");
            return true;
        }

        return false;
    }, [playerColor]);

    const makeBotMove = useCallback(async (currentGame) => {
        if (!engineRef.current || !bot) return;
        if (checkGameEnd(currentGame)) return;

        setIsThinking(true);

        try {
            const move = await engineRef.current.getMoveWithPersonality(
                currentGame.fen(),
                bot.engineConfig
            );

            if (move && move.length >= 4) {
                const from = move.substring(0, 2);
                const to = move.substring(2, 4);
                const promotion = move.length > 4 ? move[4] : undefined;

                const result = currentGame.move({ from, to, promotion });

                if (result) {
                    const newGame = new Chess(currentGame.fen());
                    setGame(newGame);
                    setLastMove({ from, to });
                    setMoveHistory(prev => [...prev, result.san]);

                    if (Math.random() < 0.2) {
                        setTimeout(() => {
                            showBotMessage(getRandomCatchphrase(botId));
                        }, 500);
                    }

                    checkGameEnd(newGame);
                }
            }
        } catch (error) {
            console.error('Bot move error:', error);
        } finally {
            setIsThinking(false);
        }
    }, [bot, checkGameEnd, botId]);

    const completePlayerMove = useCallback((from, to, promotion) => {
        try {
            const move = game.move({ from, to, promotion });

            if (!move) {
                return false;
            }

            const newGame = new Chess(game.fen());
            setGame(newGame);
            setLastMove({ from, to });
            setMoveHistory(prev => [...prev, move.san]);

            if (!checkGameEnd(newGame)) {
                setTimeout(() => makeBotMove(newGame), 500);
            }

            return true;
        } catch (err) {
            console.error('Move error:', err);
            return false;
        }
    }, [game, checkGameEnd, makeBotMove]);

    const onDrop = useCallback((moveData) => {
        const sourceSquare = moveData?.sourceSquare || moveData?.from;
        const targetSquare = moveData?.targetSquare || moveData?.to;
        const piece = moveData?.piece;

        if (!sourceSquare || !targetSquare) {
            return false;
        }

        if (gameStatus !== 'playing') {
            return false;
        }
        if (isThinking) {
            return false;
        }

        const turn = game.turn();
        const isPlayerTurn = (turn === 'w' && playerColor === 'white') ||
            (turn === 'b' && playerColor === 'black');

        if (!isPlayerTurn) {
            return false;
        }

        if (sourceSquare === targetSquare) {
            return false;
        }

        const boardPiece = game.get(sourceSquare);
        const isPawn = boardPiece && boardPiece.type === 'p';
        const promotionRank = playerColor === 'white' ? '8' : '1';
        const isPromotion = isPawn && targetSquare[1] === promotionRank;

        if (isPromotion) {
            const possibleMoves = game.moves({ square: sourceSquare, verbose: true });
            const isValidPromotion = possibleMoves.some(m => m.to === targetSquare && m.promotion);

            if (isValidPromotion) {
                setPromotionMove({ from: sourceSquare, to: targetSquare });
                return true;
            }
        }

        return completePlayerMove(sourceSquare, targetSquare, undefined);
    }, [game, gameStatus, isThinking, playerColor, completePlayerMove]);

    const onPromotionPieceSelect = useCallback((piece) => {
        if (!promotionMove) return;

        completePlayerMove(promotionMove.from, promotionMove.to, piece);
        setPromotionMove(null);
    }, [promotionMove, completePlayerMove]);

    const cancelPromotion = useCallback(() => {
        setPromotionMove(null);
    }, []);
    const handleResign = () => {
        setGameStatus('resigned');
        setWinner('bot');
        showBotMessage("A wise decision. Let's play again sometime!");
    };

    const handleRematch = () => {
        setGame(new Chess());
        setGameStatus('playing');
        setWinner(null);
        setLastMove(null);
        setMoveHistory([]);
        showBotMessage(getRandomCatchphrase(botId) || "Round 2! Let's go!");

        if (playerColor === 'black') {
            setTimeout(() => makeBotMove(new Chess()), 1000);
        }
    };

    const customSquareStyles = {};
    if (lastMove) {
        customSquareStyles[lastMove.from] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
        customSquareStyles[lastMove.to] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
    }

    if (!bot) {
        return (
            <div className="bot-game-page">
                <div className="bot-not-found">
                    <h2>Bot not found</h2>
                    <Link to="/bots">← Back to Bots</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bot-game-page">
            <div className="bot-game-layout">
                <div className="bot-board-wrapper">
                    <div className={`bot-board-container ${gameStatus !== 'playing' ? 'game-over' : ''}`}>
                        <Chessboard
                            id="bot-game-board"
                            options={{
                                position: game.fen(),
                                allowDragging: gameStatus === 'playing' && !isThinking && !promotionMove,
                                onPieceDrop: onDrop,
                                animationDurationInMs: 150,
                                boardOrientation: orientation,
                                squareStyles: customSquareStyles,
                                showNotation: true
                            }}
                        />

                        {promotionMove && (
                            <>
                                <div className="promotion-backdrop" onClick={cancelPromotion} />
                                <div className="promotion-dialog">
                                    <div className="promotion-title">Promote to:</div>
                                    <div className="promotion-pieces">
                                        {['q', 'r', 'b', 'n'].map((piece) => (
                                            <button
                                                key={piece}
                                                className="promotion-piece-btn"
                                                onClick={() => onPromotionPieceSelect(piece)}
                                            >
                                                <span className="promotion-piece-icon">
                                                    {piece === 'q' && '♕'}
                                                    {piece === 'r' && '♖'}
                                                    {piece === 'b' && '♗'}
                                                    {piece === 'n' && '♘'}
                                                </span>
                                                <span className="promotion-piece-name">
                                                    {piece === 'q' && 'Queen'}
                                                    {piece === 'r' && 'Rook'}
                                                    {piece === 'b' && 'Bishop'}
                                                    {piece === 'n' && 'Knight'}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {isThinking && (
                            <div className="thinking-overlay">
                                <div className="thinking-spinner"></div>
                                <span>{bot.name} is thinking...</span>
                            </div>
                        )}

                        {gameStatus !== 'playing' && (
                            <div className="game-result-overlay">
                                <div className="result-content">
                                    {gameStatus === 'checkmate' && (
                                        <>
                                            <h2>{winner === 'player' ? 'You Win!' : `${bot.name} Wins!`}</h2>
                                            <p>Checkmate</p>
                                        </>
                                    )}
                                    {gameStatus === 'draw' && (
                                        <>
                                            <h2>Draw</h2>
                                            <p>Game ended in a draw</p>
                                        </>
                                    )}
                                    {gameStatus === 'resigned' && (
                                        <>
                                            <h2>You Resigned</h2>
                                            <p>{bot.name} wins</p>
                                        </>
                                    )}
                                    <div className="result-actions">
                                        <button
                                            className="analyze-btn"
                                            onClick={() => navigate('/bots/analysis', {
                                                state: {
                                                    moves: moveHistory,
                                                    playerColor,
                                                    botName: bot.name,
                                                    botId: bot.id,
                                                    result: winner === 'player' ? 'win' : winner === 'bot' ? 'loss' : 'draw'
                                                }
                                            })}
                                        >
                                            Analyze Game
                                        </button>
                                        <button className="rematch-btn" onClick={handleRematch}>
                                            Rematch
                                        </button>
                                        <Link to="/bots" className="back-btn">
                                            Choose Another Bot
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bot-game-sidebar">
                    <div className="bot-info-card">
                        <img
                            src={bot.avatar}
                            alt={bot.name}
                            className="sidebar-bot-avatar"
                            onError={(e) => { e.target.src = '/assets/bots/default.png'; }}
                        />
                        <div className="sidebar-bot-details">
                            <h3>{bot.name}</h3>
                            <div className="sidebar-elo">
                                <TrophyIcon size={14} />
                                <span>{bot.elo} ELO</span>
                            </div>
                        </div>

                        {speechBubble && (
                            <div className={`speech-bubble ${speechBubble.isVisible ? 'visible' : 'hiding'}`}>
                                <span className="bubble-text">{speechBubble.text}</span>
                                <div className="bubble-tail"></div>
                            </div>
                        )}
                    </div>

                    <div className="move-history">
                        <div className="history-header">Moves</div>
                        <div className="moves-list">
                            {moveHistory.length === 0 ? (
                                <span className="no-moves">No moves yet</span>
                            ) : (
                                moveHistory.map((move, i) => (
                                    <span key={i} className="move-item">
                                        {i % 2 === 0 && <span className="move-number">{Math.floor(i / 2) + 1}.</span>}
                                        {move}
                                    </span>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="game-controls">
                        {gameStatus === 'playing' && (
                            <button className="resign-btn" onClick={handleResign}>
                                Resign
                            </button>
                        )}
                        <Link to="/bots" className="leave-btn">
                            Leave Game
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BotGamePage;
