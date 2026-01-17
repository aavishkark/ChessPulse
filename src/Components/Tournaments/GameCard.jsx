import React, { useMemo } from "react";
import { Chessboard } from "react-chessboard";
import { useBoardCustomization } from "../../contexts/BoardCustomizationContext";
import { getCustomPieces } from "../../utils/pieceSets";
import { pgnToFEN, formatResult, getMoveCount } from "../../utils/pgnParser";
import "./game-card.css";

export default function GameCard({ game, onClick }) {
    const { darkSquareColor, lightSquareColor, pieceSet } = useBoardCustomization();
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
                    id={`game-${gameId}`}
                    options={{
                        position: fen,
                        arePiecesDraggable: false,
                        boardOrientation: "white",
                        showNotation: false,
                        darkSquareStyle: { backgroundColor: darkSquareColor },
                        lightSquareStyle: { backgroundColor: lightSquareColor },
                        customPieces: getCustomPieces(pieceSet)
                    }}
                    boardWidth={180}
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
