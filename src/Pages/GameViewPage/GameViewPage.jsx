import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { getGameByIndex, fetchRoundGames } from '../../utils/pgnStream';
import { parsePlayerNames, getCurrentFEN, getMoveList, getGameResult } from '../../utils/pgnParser';
import './game-view-page.css';

const API = "https://chesspulse-backend.onrender.com/evaluate?fen=";

export default function GameViewPage() {
    const { roundId, gameIndex } = useParams();
    const navigate = useNavigate();
    const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const [players, setPlayers] = useState({ white: 'Loading...', black: 'Loading...' });
    const [evaluation, setEvaluation] = useState(0);
    const [moves, setMoves] = useState([]);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const pgnBufferRef = useRef('');
    const cleanupRef = useRef(null);

    useEffect(() => {
        if (!roundId || gameIndex === undefined) {
            setError('Invalid round or game');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const updateGame = (buffer) => {
            pgnBufferRef.current = buffer;
            const gamePgn = getGameByIndex(buffer, parseInt(gameIndex));

            if (gamePgn) {
                const playerNames = parsePlayerNames(gamePgn);
                setPlayers(playerNames);

                const currentFen = getCurrentFEN(gamePgn);
                setFen(currentFen);

                const moveList = getMoveList(gamePgn);
                setMoves(moveList);

                const gameResult = getGameResult(gamePgn);
                setResult(gameResult);

                fetchEvaluation(currentFen);
                setLoading(false);
            }
        };

        (async () => {
            try {
                const cleanup = await fetchRoundGames(roundId, updateGame);
                cleanupRef.current = cleanup;
            } catch (err) {
                console.error('Error fetching game:', err);
                setError('Failed to load game');
                setLoading(false);
            }
        })();

        return () => {
            if (cleanupRef.current) {
                cleanupRef.current();
            }
        };
    }, [roundId, gameIndex]);

    const fetchEvaluation = async (currentFen) => {
        try {
            const response = await fetch(`${API}${encodeURIComponent(currentFen)}`);
            const data = await response.json();
            setEvaluation(data.evaluation || 0);
        } catch (err) {
            console.error('Error fetching evaluation:', err);
        }
    };

    const renderBoard = () => {
        const chess = new Chess(fen);
        const board = [];
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

        const pieceSymbols = {
            'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚',
            'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔'
        };

        for (let rank of ranks) {
            for (let file of files) {
                const square = `${file}${rank}`;
                const piece = chess.get(square);
                const isLight = (files.indexOf(file) + ranks.indexOf(rank)) % 2 === 0;

                board.push(
                    <div
                        key={square}
                        className={`chess-square ${isLight ? 'light' : 'dark'}`}
                    >
                        {piece && (
                            <span className={`chess-piece ${piece.color === 'w' ? 'white' : 'black'}`}>
                                {pieceSymbols[piece.type.toUpperCase()] || pieceSymbols[piece.type]}
                            </span>
                        )}
                    </div>
                );
            }
        }

        return board;
    };

    if (loading) {
        return (
            <div className="game-view-page">
                <div className="loading-game">
                    <div className="gv-loading-spinner"></div>
                    <p>Loading game...</p>
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
            </div>

            <div className="game-content">
                <div className="left-section">
                    <div className="gv-player-info white-player-info">
                        <div className="player-color-box white"></div>
                        <span className="gv-player-name">{players.white}</span>
                    </div>

                    <div className="chessboard">
                        {renderBoard()}
                    </div>

                    <div className="gv-player-info black-player-info">
                        <div className="player-color-box black"></div>
                        <span className="gv-player-name">{players.black}</span>
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
