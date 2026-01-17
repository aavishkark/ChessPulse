import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useBoardCustomization } from '../../contexts/BoardCustomizationContext';
import { getCustomPieces } from '../../utils/pieceSets';
import { getGameByIndex } from '../../utils/pgnStream';
import { parsePlayerNames, parsePlayerRatings, getCurrentFEN, getMoveList, getGameResult, parseClockInfo } from '../../utils/pgnParser';
import { getStockfishService } from '../../services/stockfishService';
import ChessLoader from '../../Components/ChessLoader/ChessLoader';
import './game-view-page.css';

export default function GameViewPage() {
    const { roundId, gameIndex } = useParams();
    const navigate = useNavigate();
    const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const [players, setPlayers] = useState({ white: 'Loading...', black: 'Loading...' });
    const [ratings, setRatings] = useState({ white: '-', black: '-' });
    const [displayClock, setDisplayClock] = useState({ w: 0, b: 0 });
    const [evaluation, setEvaluation] = useState(0);
    const [moves, setMoves] = useState([]);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [arrows, setArrows] = useState([]);
    const [boardOrientation, setBoardOrientation] = useState('white');
    const { darkSquareColor, lightSquareColor, showNotation, pieceSet, animationSpeed, arrowColor } = useBoardCustomization();
    const previousFenRef = useRef(null);
    const baseClockRef = useRef({ w: 0, b: 0 });
    const lastUpdateRef = useRef(Date.now());
    const turnRef = useRef('w');
    const abortControllerRef = useRef(null);
    const engineRef = useRef(null);

    useEffect(() => {
        const initEngine = async () => {
            try {
                engineRef.current = await getStockfishService();
            } catch (error) {
                console.error('Failed to initialize Stockfish:', error);
            }
        };
        initEngine();
    }, []);

    const formatClock = useCallback((t) => {
        if (typeof t !== 'number' || Number.isNaN(t)) return '--:--';
        const total = Math.max(0, Math.floor(t));
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);
        const s = total % 60;

        if (h > 0) {
            return `${h}:${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
        }
        return `${m}:${s < 10 ? '0' + s : s}`;
    }, []);

    const calcDisplayClock = useCallback(() => {
        const now = Date.now();
        const elapsed = (now - lastUpdateRef.current) / 1000;
        let w = baseClockRef.current.w;
        let b = baseClockRef.current.b;
        if (turnRef.current === 'w') w = Math.max(0, w - elapsed);
        else b = Math.max(0, b - elapsed);
        return { w, b };
    }, []);

    const getLastMoveSquares = useCallback((oldFen, newFen) => {
        if (!oldFen || !newFen || oldFen === newFen) return null;
        try {
            const oldChess = new Chess(oldFen);
            const newChess = new Chess(newFen);
            const history = newChess.history({ verbose: true });
            if (history.length === 0) return null;
            const lastMoveData = history[history.length - 1];
            return { from: lastMoveData.from, to: lastMoveData.to };
        } catch {
            return null;
        }
    }, []);

    useEffect(() => {
        const id = setInterval(() => {
            setDisplayClock(calcDisplayClock());
        }, 1000);
        return () => clearInterval(id);
    }, [calcDisplayClock]);

    const processPGN = useCallback((pgnText) => {
        const gamePgn = getGameByIndex(pgnText, parseInt(gameIndex));

        if (gamePgn) {
            const playerNames = parsePlayerNames(gamePgn);
            setPlayers(playerNames);

            const playerRatings = parsePlayerRatings(gamePgn);
            setRatings(playerRatings);

            const clockInfo = parseClockInfo(gamePgn);
            baseClockRef.current = { w: clockInfo.white, b: clockInfo.black };
            lastUpdateRef.current = Date.now();
            setDisplayClock(calcDisplayClock());

            const oldFen = previousFenRef.current;
            const currentFen = getCurrentFEN(gamePgn);
            setFen(currentFen);
            previousFenRef.current = currentFen;

            const parts = (currentFen || '').split(' ');
            if (parts[1] === 'w' || parts[1] === 'b') {
                turnRef.current = parts[1];
            }

            const moveSquares = getLastMoveSquares(oldFen, currentFen);
            if (moveSquares) {
                setArrows([{
                    startSquare: moveSquares.from,
                    endSquare: moveSquares.to,
                    color: arrowColor
                }]);
            } else {
                setArrows([]);
            }

            const moveList = getMoveList(gamePgn);
            setMoves(moveList);

            const gameResult = getGameResult(gamePgn);
            setResult(gameResult);

            fetchEvaluation(currentFen);
            setLoading(false);
        } else {
            console.log('No game found at index:', gameIndex);
        }
    }, [gameIndex, calcDisplayClock, getLastMoveSquares, arrowColor]);

    useEffect(() => {
        if (!roundId || gameIndex === undefined) {
            setError('Invalid round or game');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        let currentDelay = 30000;

        const startStream = async () => {
            try {
                if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                }

                abortControllerRef.current = new AbortController();
                const response = await fetch(
                    `https://lichess.org/api/stream/broadcast/round/${roundId}.pgn`,
                    { signal: abortControllerRef.current.signal }
                );

                if (response.status === 429) {
                    console.warn('Rate limited by Lichess. Stopping updates.');
                    clearInterval(refreshInterval);
                    setError('Rate limited by Lichess. Please wait 15-20 minutes before viewing live games again.');
                    setLoading(false);
                    return;
                }

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                currentDelay = 30000;

                const reader = response.body?.getReader();
                if (!reader) {
                    throw new Error('Reader not available');
                }

                const decoder = new TextDecoder();
                let buffer = '';

                async function processStream() {
                    try {
                        const { done, value } = await reader.read();
                        if (done) return;

                        buffer += decoder.decode(value, { stream: true });
                        processStream();
                    } catch (err) {
                        if (err.name !== 'AbortError') {
                            console.error('Stream error:', err);
                        }
                    }
                }

                processStream();

                setTimeout(() => {
                    if (buffer) processPGN(buffer);
                }, 100);

            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error:', err);
                    if (loading) {
                        setError('Failed to load game');
                        setLoading(false);
                    }
                }
            }
        };

        startStream();

        const refreshInterval = setInterval(startStream, 30000);

        return () => {
            clearInterval(refreshInterval);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [roundId, gameIndex, processPGN]);

    const fetchEvaluation = async (currentFen) => {
        try {
            if (engineRef.current) {
                const score = await engineRef.current.evaluatePosition(currentFen, 15);
                setEvaluation(score);
            }
        } catch (err) {
            console.error('Error fetching evaluation:', err);
        }
    };

    const customSquareStyles = useMemo(() => {
        if (!arrows || arrows.length === 0) return {};
        const lastMove = arrows[0];
        return {
            [lastMove.startSquare]: {
                backgroundColor: 'rgba(15, 240, 252, 0.25)',
                boxShadow: 'inset 0 0 20px rgba(15, 240, 252, 0.3)'
            },
            [lastMove.endSquare]: {
                backgroundColor: 'rgba(15, 240, 252, 0.35)',
                boxShadow: 'inset 0 0 25px rgba(15, 240, 252, 0.4)'
            }
        };
    }, [arrows]);

    if (loading) {
        return (
            <div className="game-view-page">
                <div className="loading-game">
                    <ChessLoader text="Loading game..." />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="game-view-page">
                <div className="error-game">
                    <p>{error}</p>
                    <button onClick={() => navigate('/tournaments')} className="back-btn">
                        Back to Tournaments
                    </button>
                </div>
            </div>
        );
    }

    const whiteBarWidth = evaluation >= 99 ? '100%' : evaluation >= 4 ? '90%' :
        evaluation <= -4 ? '10%' : `${50 + (evaluation * 7.5)}%`;

    return (
        <div className="game-view-page">
            <div className="game-header">
                <button onClick={() => navigate('/tournaments')} className="back-button">
                    ← Back
                </button>
                <h1 className="game-title">Live Game</h1>
                <button
                    onClick={() => setBoardOrientation(prev => prev === 'white' ? 'black' : 'white')}
                    className="flip-board-btn"
                    title="Flip board"
                >
                    ⇅ Flip
                </button>
            </div>

            <div className="game-content">
                <div className="left-section">
                    <div className="gv-player-info black-player-info">
                        <div className={`player-color-box ${boardOrientation === 'white' ? 'black' : 'white'}`}></div>
                        <div className="gv-player-details">
                            <span className="gv-player-name">
                                {boardOrientation === 'white' ? players.black : players.white}
                                ({boardOrientation === 'white' ? ratings.black : ratings.white})
                            </span>
                            <div className="gv-player-clock">
                                {boardOrientation === 'white' ? formatClock(displayClock.b) : formatClock(displayClock.w)}
                            </div>
                        </div>
                    </div>

                    <div className="chessboard-container">
                        <Chessboard
                            id="gameview-board"
                            options={{
                                position: fen,
                                arePiecesDraggable: false,
                                animationDurationInMs: animationSpeed,
                                boardOrientation: boardOrientation,
                                arrows: arrows,
                                arrowOptions: {
                                    color: arrowColor,
                                    opacity: 0.65
                                },
                                showNotation,
                                squareStyles: customSquareStyles,
                                darkSquareStyle: { backgroundColor: darkSquareColor },
                                lightSquareStyle: { backgroundColor: lightSquareColor },
                                boardStyle: {
                                    borderRadius: '12px',
                                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
                                },
                                customPieces: getCustomPieces(pieceSet)
                            }}
                        />
                    </div>

                    <div className="gv-player-info white-player-info">
                        <div className={`player-color-box ${boardOrientation === 'white' ? 'white' : 'black'}`}></div>
                        <div className="gv-player-details">
                            <span className="gv-player-name">
                                {boardOrientation === 'white' ? players.white : players.black}
                                ({boardOrientation === 'white' ? ratings.white : ratings.black})
                            </span>
                            <div className="gv-player-clock">
                                {boardOrientation === 'white' ? formatClock(displayClock.w) : formatClock(displayClock.b)}
                            </div>
                        </div>
                    </div>

                    {result && (
                        <div className="game-result-banner">{result}</div>
                    )}
                </div>

                <div className="right-section">
                    <div className="evaluation-section">
                        <h3>Evaluation</h3>
                        <div className="gv-eval-bar-container">
                            <div className="gv-eval-bar">
                                <div
                                    className="gv-eval-bar-white"
                                    style={{ height: whiteBarWidth }}
                                ></div>
                                <div className="gv-eval-number">
                                    {evaluation >= 99 ? 'M' : evaluation <= -99 ? 'M' :
                                        evaluation.toFixed(1)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="moves-section">
                        <h3>Moves</h3>
                        <div className="moves-list">
                            {moves.length === 0 ? (
                                <p className="no-moves">No moves yet</p>
                            ) : (
                                <div className="moves-grid">
                                    {moves.map((move, index) => {
                                        const moveNum = Math.floor(index / 2) + 1;
                                        const isWhiteMove = index % 2 === 0;

                                        return isWhiteMove ? (
                                            <div key={index} className="move-pair">
                                                <span className="move-number">{moveNum}.</span>
                                                <span className="move white-move">{move}</span>
                                                {moves[index + 1] && (
                                                    <span className="move black-move">{moves[index + 1]}</span>
                                                )}
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
