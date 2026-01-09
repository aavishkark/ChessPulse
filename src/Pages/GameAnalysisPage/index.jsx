import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { getStockfishService } from '../../services/stockfishService';
import './gameAnalysis.css';

function classifyMove(cpLoss) {
    if (cpLoss <= 0) return { name: 'Best', symbol: '✓', color: '#96bc4b' };
    if (cpLoss <= 10) return { name: 'Excellent', symbol: '✓', color: '#96bc4b' };
    if (cpLoss <= 25) return { name: 'Good', symbol: '○', color: '#a4a4a4' };
    if (cpLoss <= 100) return { name: 'Inaccuracy', symbol: '?!', color: '#f7c631' };
    if (cpLoss <= 300) return { name: 'Mistake', symbol: '?', color: '#e6912c' };
    return { name: 'Blunder', symbol: '??', color: '#ca3431' };
}

function calculateAccuracy(cpLoss) {
    const accuracy = 103.1668 * Math.exp(-0.04354 * Math.abs(cpLoss)) - 3.1668;
    return Math.max(0, Math.min(100, Math.round(accuracy)));
}

export default function GameAnalysisPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const gameData = location.state;

    const [moves, setMoves] = useState([]);
    const [fens, setFens] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [game, setGame] = useState(new Chess());

    const [analysisMode, setAnalysisMode] = useState('manual');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisComplete, setAnalysisComplete] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [moveAnalysis, setMoveAnalysis] = useState([]);
    const [evalHistory, setEvalHistory] = useState([]);
    const [accuracy, setAccuracy] = useState({ white: 0, black: 0 });

    const [isPlaying, setIsPlaying] = useState(false);
    const playIntervalRef = useRef(null);

    const [variationMoves, setVariationMoves] = useState([]);
    const [inVariation, setInVariation] = useState(false);
    const [variationEval, setVariationEval] = useState(null);
    const [manualEval, setManualEval] = useState(null);

    const engineRef = useRef(null);
    const fensRef = useRef([]);

    const currentFen = inVariation ? game.fen() : (fens[currentIndex] || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

    const currentEval = inVariation && variationEval !== null
        ? variationEval
        : (analysisMode === 'manual' ? (manualEval || 0) : (evalHistory[currentIndex] || 0));

    useEffect(() => {
        if (!gameData || !gameData.moves) {
            navigate('/bots');
            return;
        }

        console.log('GameAnalysisPage received moves:', gameData.moves);

        const chess = new Chess();
        const fenList = [chess.fen()];
        const moveList = [];

        for (const move of gameData.moves) {
            try {
                const result = chess.move(move);
                if (result) {
                    moveList.push(result.san);
                    fenList.push(chess.fen());
                    console.log(`Parsed move ${move} -> FEN: ${chess.fen()}`);
                } else {
                    console.error('Move returned null:', move);
                }
            } catch (e) {
                console.error('Failed to parse move:', move, e.message);
            }
        }

        console.log('Total moves parsed:', moveList.length, 'Total fens:', fenList.length);

        setMoves(moveList);
        setFens(fenList);
        fensRef.current = fenList;
        setCurrentIndex(0);
        if (fenList.length > 0) {
            setGame(new Chess(fenList[0]));
        }
    }, [gameData, navigate]);

    useEffect(() => {
        if (analysisMode === 'stockfish' && fens.length > 1 && moves.length > 0 && !isAnalyzing && !analysisComplete) {
            startAnalysis(fens, moves);
        }
    }, [analysisMode, fens, moves]);

    useEffect(() => {
        const evaluateCurrent = async () => {
            if (analysisMode === 'manual' && !inVariation) {
                try {
                    if (!engineRef.current) {
                        engineRef.current = await getStockfishService();
                    }
                    const ev = await engineRef.current.evaluatePosition(currentFen, 15);
                    setManualEval(ev);
                } catch (error) {
                    console.error("Manual eval error:", error);
                }
            }
        };
        evaluateCurrent();
    }, [analysisMode, currentFen, inVariation]);

    const startAnalysis = async (fenList, moveList) => {
        setIsAnalyzing(true);
        setAnalysisProgress(0);

        try {
            engineRef.current = await getStockfishService();
        } catch (error) {
            console.error('Failed to initialize Stockfish:', error);
            setIsAnalyzing(false);
            return;
        }

        const evals = [];

        for (let i = 0; i < fenList.length; i++) {
            try {
                const ev = await engineRef.current.evaluatePosition(fenList[i], 18);
                evals.push(ev);
                setAnalysisProgress(Math.round(((i + 1) / fenList.length) * 100));
            } catch {
                evals.push(0);
            }
        }

        const analysis = [];
        let whiteAccuracySum = 0, blackAccuracySum = 0;
        let whiteMoveCount = 0, blackMoveCount = 0;

        for (let i = 1; i < evals.length; i++) {
            const evalBefore = evals[i - 1];
            const evalAfter = evals[i];
            const isWhiteMove = i % 2 === 1;

            const cpLoss = isWhiteMove
                ? (evalBefore - evalAfter) * 100
                : (evalAfter - evalBefore) * 100;

            const classification = classifyMove(cpLoss);
            const moveAccuracy = calculateAccuracy(cpLoss);

            if (isWhiteMove) {
                whiteAccuracySum += moveAccuracy;
                whiteMoveCount++;
            } else {
                blackAccuracySum += moveAccuracy;
                blackMoveCount++;
            }

            analysis.push({
                move: moveList[i - 1],
                evalBefore,
                evalAfter,
                cpLoss,
                classification,
                accuracy: moveAccuracy,
                isWhiteMove
            });
        }

        setMoveAnalysis(analysis);
        setEvalHistory(evals);
        setAccuracy({
            white: whiteMoveCount > 0 ? Math.round(whiteAccuracySum / whiteMoveCount) : 0,
            black: blackMoveCount > 0 ? Math.round(blackAccuracySum / blackMoveCount) : 0
        });
        setIsAnalyzing(false);
        setAnalysisComplete(true);
    };

    const analyzeVariation = async (fen) => {
        if (!engineRef.current) return;
        try {
            const ev = await engineRef.current.evaluatePosition(fen, 15);
            setVariationEval(ev);
        } catch {
            setVariationEval(null);
        }
    };

    const gotoMove = useCallback((index) => {
        if (inVariation) {
            setInVariation(false);
            setVariationMoves([]);
            setVariationEval(null);
        }
        const currentFens = fensRef.current;
        if (currentFens.length === 0) return;
        const clamped = Math.max(0, Math.min(currentFens.length - 1, index));
        setCurrentIndex(clamped);
    }, [inVariation]);

    const gotoStart = useCallback(() => gotoMove(0), [gotoMove]);
    const gotoEnd = useCallback(() => gotoMove(fensRef.current.length - 1), [gotoMove]);
    const prevMove = useCallback(() => {
        setCurrentIndex(prev => Math.max(0, prev - 1));
    }, []);
    const nextMove = useCallback(() => {
        setCurrentIndex(prev => Math.min(fensRef.current.length - 1, prev + 1));
    }, []);

    const togglePlay = useCallback(() => {
        if (isPlaying) {
            clearInterval(playIntervalRef.current);
            setIsPlaying(false);
        } else {
            setIsPlaying(true);
            playIntervalRef.current = setInterval(() => {
                setCurrentIndex(prev => {
                    const currentFens = fensRef.current;
                    if (prev >= currentFens.length - 1) {
                        clearInterval(playIntervalRef.current);
                        setIsPlaying(false);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 800);
        }
    }, [isPlaying]);

    const onDrop = useCallback((sourceSquare, targetSquare, piece) => {
        try {
            const gameCopy = new Chess(game.fen());
            const isPawn = piece?.toLowerCase?.().includes('p');
            const isPromotion = isPawn && (targetSquare[1] === '8' || targetSquare[1] === '1');

            const move = gameCopy.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: isPromotion ? 'q' : undefined
            });

            if (move) {
                setInVariation(true);
                setVariationMoves(prev => [...prev, move.san]);
                setGame(gameCopy);
                analyzeVariation(gameCopy.fen());
                return true;
            }
        } catch (e) { }
        return false;
    }, [game]);

    const resetVariation = () => {
        setInVariation(false);
        setVariationMoves([]);
        setVariationEval(null);
        setGame(new Chess(fens[currentIndex]));
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') prevMove();
            else if (e.key === 'ArrowRight') nextMove();
            else if (e.key === 'Home') gotoStart();
            else if (e.key === 'End') gotoEnd();
            else if (e.key === ' ') {
                e.preventDefault();
                togglePlay();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, fens.length, prevMove, nextMove, gotoStart, gotoEnd, togglePlay]);

    useEffect(() => {
        return () => {
            if (playIntervalRef.current) {
                clearInterval(playIntervalRef.current);
            }
        };
    }, []);



    const evalToWidth = (evalNum) => {
        const clamped = Math.max(-5, Math.min(5, evalNum));
        return `${((clamped + 5) / 10) * 100}%`;
    };

    if (!gameData) {
        return (
            <div className="game-analysis-page">
                <div className="analysis-error">
                    <h2>No game data available</h2>
                    <Link to="/bots">← Back to Bots</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="game-analysis-page">
            <div className="analysis-header">
                <Link to="/bots" className="back-link">← Back to Bots</Link>
                <div className="analysis-mode-selector">
                    <button
                        className={`mode-btn ${analysisMode === 'manual' ? 'active' : ''}`}
                        onClick={() => setAnalysisMode('manual')}
                    >
                        Manual
                    </button>
                    <button
                        className={`mode-btn ${analysisMode === 'stockfish' ? 'active' : ''}`}
                        onClick={() => setAnalysisMode('stockfish')}
                    >
                        Engine
                    </button>
                </div>
            </div>

            <div className="analysis-content">
                <div className="analysis-board-section">
                    <div className="board-center-column">
                        <div className="board-with-eval">
                            <div className="analysis-eval-bar">
                                {((analysisMode === 'stockfish' || analysisMode === 'manual') || (inVariation && variationEval !== null)) && (
                                    <>
                                        <div className="eval-bar-fill" style={{ height: evalToWidth(currentEval) }} />
                                        <span className="eval-value">
                                            {currentEval >= 99 ? '+M' : currentEval <= -99 ? '-M' :
                                                (currentEval >= 0 ? '+' : '') + currentEval.toFixed(1)}
                                        </span>
                                    </>
                                )}
                            </div>

                            <div className="analysis-board-container">
                                <Chessboard
                                    key={`board-${currentIndex}-${inVariation}`}
                                    id="analysis-board"
                                    options={{
                                        position: currentFen,
                                        onPieceDrop: onDrop,
                                        animationDurationInMs: 150,
                                        boardOrientation: gameData.playerColor || 'white',
                                        allowDragging: true,
                                        showNotation: true
                                    }}
                                />
                                {inVariation && (
                                    <div className="variation-indicator">
                                        <span>Exploring variation</span>
                                        <button onClick={resetVariation}>Reset</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="analysis-controls">
                            <button onClick={gotoStart}>⏮</button>
                            <button onClick={prevMove}>◀</button>
                            <button onClick={togglePlay}>{isPlaying ? '⏸' : '▶'}</button>
                            <button onClick={nextMove}>▶</button>
                            <button onClick={gotoEnd}>⏭</button>
                        </div>
                    </div>
                </div>

                <div className="analysis-panel">
                    <div className="game-info-card">
                        <div className="player-row">
                            <span className="player-color white" />
                            <span className="player-name">
                                {gameData.playerColor === 'white' ? 'You' : gameData.botName || 'Bot'}
                            </span>
                            {analysisMode === 'stockfish' && analysisComplete && (
                                <span className="accuracy-badge">{accuracy.white}%</span>
                            )}
                        </div>
                        <div className="vs-text">vs</div>
                        <div className="player-row">
                            <span className="player-color black" />
                            <span className="player-name">
                                {gameData.playerColor === 'black' ? 'You' : gameData.botName || 'Bot'}
                            </span>
                            {analysisMode === 'stockfish' && analysisComplete && (
                                <span className="accuracy-badge">{accuracy.black}%</span>
                            )}
                        </div>
                        <div className="result-text">
                            {gameData.result === 'win' ? 'You Won!' :
                                gameData.result === 'loss' ? `${gameData.botName} Won` : 'Draw'}
                        </div>
                    </div>

                    {analysisMode === 'stockfish' && !analysisComplete && isAnalyzing && (
                        <div className="analysis-status">
                            <div className="progress-container">
                                <div className="progress-bar" style={{ width: `${analysisProgress}%` }} />
                            </div>
                            <span>Analyzing... {analysisProgress}%</span>
                        </div>
                    )}

                    {analysisMode === 'stockfish' && !analysisComplete && !isAnalyzing && (
                        <div className="start-analysis-prompt">
                            <p>Run a full game review to get accuracy scores and move classifications.</p>
                        </div>
                    )}

                    <div className="moves-panel">
                        <h3>Moves</h3>
                        <div className="moves-list">
                            {moves.map((move, i) => {
                                const moveNum = Math.floor(i / 2) + 1;
                                const isWhite = i % 2 === 0;
                                const analysis = moveAnalysis[i];
                                const isActive = currentIndex === i + 1 && !inVariation;

                                return (
                                    <span
                                        key={i}
                                        className={`move-item ${isActive ? 'active' : ''} ${analysis?.classification?.name?.toLowerCase() || ''}`}
                                        onClick={() => gotoMove(i + 1)}
                                        title={analysis ? `${analysis.classification.name} (${analysis.cpLoss.toFixed(0)} cp)` : ''}
                                    >
                                        {isWhite && <span className="move-number">{moveNum}.</span>}
                                        {analysisMode === 'stockfish' && analysisComplete && analysis && (
                                            <span className="move-symbol" style={{ color: analysis.classification.color }}>
                                                {analysis.classification.symbol}
                                            </span>
                                        )}
                                        <span className="move-san">{move}</span>
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    {inVariation && variationMoves.length > 0 && (
                        <div className="variation-panel">
                            <h4>Your variation:</h4>
                            <div className="variation-moves">
                                {variationMoves.map((m, i) => (
                                    <span key={i} className="variation-move">{m}</span>
                                ))}
                            </div>
                            {variationEval !== null && (
                                <div className="variation-eval">
                                    Eval: {variationEval >= 0 ? '+' : ''}{variationEval.toFixed(1)}
                                </div>
                            )}
                        </div>
                    )}

                    {analysisMode === 'stockfish' && analysisComplete && evalHistory.length > 0 && (
                        <div className="eval-graph-container">
                            <h3>Game Flow</h3>
                            <div className="eval-graph-wrapper" style={{ width: '100%', height: 200 }}>
                                <ResponsiveContainer>
                                    <AreaChart
                                        data={evalHistory.map((ev, i) => ({ move: i, eval: Math.max(-10, Math.min(10, ev)) }))}
                                        margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                                        onClick={(data) => {
                                            if (data && data.activeLabel !== undefined) {
                                                gotoMove(data.activeLabel);
                                            }
                                        }}
                                    >
                                        <defs>
                                            <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset={(() => {
                                                    const min = Math.min(...evalHistory.map(e => Math.max(-10, Math.min(10, e))));
                                                    const max = Math.max(...evalHistory.map(e => Math.max(-10, Math.min(10, e))));
                                                    if (max <= 0) return 0;
                                                    if (min >= 0) return 1;
                                                    return max / (max - min);
                                                })()} stopColor="#96bc4b" stopOpacity={1} />
                                                <stop offset={(() => {
                                                    const min = Math.min(...evalHistory.map(e => Math.max(-10, Math.min(10, e))));
                                                    const max = Math.max(...evalHistory.map(e => Math.max(-10, Math.min(10, e))));
                                                    if (max <= 0) return 0;
                                                    if (min >= 0) return 1;
                                                    return max / (max - min);
                                                })()} stopColor="#ca3431" stopOpacity={1} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="move" hide />
                                        <YAxis domain={[-10, 10]} hide />
                                        <Tooltip
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    const val = payload[0].value;
                                                    return (
                                                        <div style={{ background: '#333', padding: '5px', borderRadius: '4px', border: '1px solid #555' }}>
                                                            <p style={{ margin: 0, fontSize: '12px' }}>Move {label}</p>
                                                            <p style={{ margin: 0, fontSize: '12px', color: val >= 0 ? '#96bc4b' : '#ca3431' }}>
                                                                Eval: {val > 0 ? '+' : ''}{val.toFixed(2)}
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                                        <Area
                                            type="monotone"
                                            dataKey="eval"
                                            stroke="#888"
                                            fill="url(#splitColor)"
                                            strokeWidth={2}
                                            activeDot={{ r: 4, stroke: 'white' }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
