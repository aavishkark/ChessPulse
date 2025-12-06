import React, { useMemo } from "react";
import { Chessboard } from "react-chessboard";
import { pgnToFEN, formatResult, getMoveCount } from "../../utils/pgnParser";
import "./game-card.css";

export default function GameCard({ game }) {
    const { white, black, result, site, pgn } = game;

    const fen = useMemo(() => pgnToFEN(pgn || ""), [pgn]);
    const moveCount = useMemo(() => getMoveCount(pgn || ""), [pgn]);
    const formattedResult = useMemo(() => formatResult(result), [result]);

    const gameId = site?.split("/").pop();

    return (
        <div className="game-card">
            <div className="game-card-header">
                <div className="player-info">
                    <span className="player-color">⚫</span>
                    <span className="player-name">{black || "Unknown"}</span>
                </div>
            </div>

            <div className="game-card-board">
                <Chessboard
                    position={fen}
                    boardWidth={250}
                    arePiecesDraggable={false}
                    customLightSquareStyle={{ backgroundColor: "#f0efe8" }}
                    customDarkSquareStyle={{ backgroundColor: "#7a9b57" }}
                />
            </div>

            <div className="game-card-footer">
                <div className="player-info">
                    <span className="player-color">⚪</span>
                    <span className="player-name">{white || "Unknown"}</span>
                </div>
            </div>

            <div className="game-card-meta">
                <div className="game-info">
                    <span className="move-count">{moveCount} moves</span>
                    {result && result !== "*" && (
                        <span className="game-result">{formattedResult}</span>
                    )}
                </div>
                {gameId && (
                    <a
                        href={`https://lichess.org/${gameId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="lichess-link-btn"
                    >
                        View on Lichess
                    </a>
                )}
            </div>
        </div>
    );
}
