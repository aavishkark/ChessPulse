import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Chessboard } from "react-chessboard";
import { getCustomPieces } from '../../utils/pieceSets';
import { useBoardCustomization } from "../../contexts/BoardCustomizationContext";
import { Chess } from "chess.js";
import "./livegame.css";
import React from 'react';


export default function LiveGame() {
  const FIXED_SPEEDS = ["bullet", "blitz", "rapid"];

  return (
    <section className="live-row-wrapper">
      <header className="live-row-header">
        <div className="live-row-title">Live Games</div>
      </header>

      <div className="live-boards-grid">
        {FIXED_SPEEDS.map((s, i) => (
          <LiveGameCard key={i} speed={s} cardId={i} />
        ))}
      </div>
    </section>
  );
}

const LiveGameCard = React.memo(function LiveGameCard({ speed, cardId }) {
  const [fen, setFen] = useState(new Chess().fen());
  const [white, setWhite] = useState({ name: "-", elo: "-" });
  const [black, setBlack] = useState({ name: "-", elo: "-" });
  const [displayClock, setDisplayClock] = useState({ w: 0, b: 0 });
  const [gameId, setGameId] = useState(null);
  const [arrows, setArrows] = useState([]);
  const { darkSquareColor, lightSquareColor, showNotation, pieceSet, animationSpeed, arrowColor } = useBoardCustomization();
  const [error, setError] = useState(null);
  const [lastMove, setLastMove] = useState(null);

  const abortRef = useRef(null);
  const baseClockRef = useRef({ w: 0, b: 0 });
  const lastUpdateRef = useRef(Date.now());
  const turnRef = useRef("w");
  const previousFenRef = useRef(null);

  const boardWidth = 280;

  const formatClock = React.useCallback((t) => {
    if (typeof t !== "number" || Number.isNaN(t)) return "--:--";
    const total = Math.max(0, Math.floor(t));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s < 10 ? "0" + s : s}`;
  }, []);

  const calcDisplayClock = React.useCallback(() => {
    const now = Date.now();
    const elapsed = (now - lastUpdateRef.current) / 1000;
    let w = baseClockRef.current.w;
    let b = baseClockRef.current.b;
    if (turnRef.current === "w") w = Math.max(0, w - elapsed);
    else b = Math.max(0, b - elapsed);
    return { w, b };
  }, []);

  const getLastMoveSquares = React.useCallback((oldFen, newFen) => {
    if (!oldFen || !newFen || oldFen === newFen) return null;

    try {
      const oldChess = new Chess(oldFen);
      const newChess = new Chess(newFen);

      const history = newChess.history({ verbose: true });
      if (history.length === 0) return null;

      const lastMove = history[history.length - 1];
      return { from: lastMove.from, to: lastMove.to };
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

  async function loadRandomGameForSpeed(selectedSpeed) {
    try {
      setError(null);
      const res = await fetch(`https://lichess.org/api/tv/${selectedSpeed}`);

      if (res.status === 429) {
        setError("Rate limited. Please wait...");
        return;
      }

      const text = await res.text();

      const whiteName = text.match(/\[White "([^"]+)"\]/)?.[1] || "-";
      const blackName = text.match(/\[Black "([^"]+)"\]/)?.[1] || "-";
      const whiteElo = text.match(/\[WhiteElo "([^"]+)"\]/)?.[1] || "-";
      const blackElo = text.match(/\[BlackElo "([^"]+)"\]/)?.[1] || "-";

      setWhite({ name: whiteName, elo: whiteElo });
      setBlack({ name: blackName, elo: blackElo });

      const id = text.match(/\[Site "https:\/\/lichess\.org\/([^"]+)"\]/)?.[1];
      if (!id) {
        setError("Game not found");
        return;
      }
      setGameId(id);
      startStream(id);
    } catch (err) {
      setError("Connection error");
    }
  }

  async function startStream(id) {
    try {
      abortRef.current?.abort();
    } catch (e) { }
    const controller = new AbortController();
    abortRef.current = controller;

    const url = `https://lichess.org/api/stream/game/${id}`;
    let response;
    try {
      response = await fetch(url, { signal: controller.signal });

      if (response.status === 429) {
        setError("Rate limited");
        return;
      }

      if (!response.ok) {
        setError(`Error: ${response.status}`);
        return;
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError("Stream failed");
      }
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    let buffer = "";

    const tmpChess = new Chess();
    setFen(tmpChess.fen());
    setLastMove(null);
    previousFenRef.current = null;
    setDisplayClock({ w: 0, b: 0 });
    baseClockRef.current = { w: 0, b: 0 };
    lastUpdateRef.current = Date.now();
    turnRef.current = "w";

    async function process() {
      const { done, value } = await reader.read();
      if (done) return;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        let evt;
        try {
          evt = JSON.parse(line);
        } catch {
          continue;
        }

        if (evt.players) {
          if (evt.players.white?.name) {
            setWhite({
              name: evt.players.white.name,
              elo: evt.players.white.rating ?? "-",
            });
          }
          if (evt.players.black?.name) {
            setBlack({
              name: evt.players.black.name,
              elo: evt.players.black.rating ?? "-",
            });
          }
        }

        if (typeof evt.wc === "number" && typeof evt.bc === "number") {
          baseClockRef.current = { w: evt.wc, b: evt.bc };
          lastUpdateRef.current = Date.now();
          setDisplayClock(calcDisplayClock());
        }

        if (evt.fen) {
          const oldFen = previousFenRef.current;
          setFen(evt.fen);
          previousFenRef.current = evt.fen;

          const moveSquares = getLastMoveSquares(oldFen, evt.fen);
          if (moveSquares) {
            setLastMove(moveSquares);
          }

          const parts = (evt.fen || "").split(" ");
          if (parts[1] === "w" || parts[1] === "b") {
            turnRef.current = parts[1];
            lastUpdateRef.current = Date.now();
          }
        }
      }

      process();
    }

    process();
  }

  useEffect(() => {
    loadRandomGameForSpeed(speed);
    return () => {
      try {
        abortRef.current?.abort();
      } catch (e) { }
    };
  }, [speed]);

  const customSquareStyles = React.useMemo(() => {
    if (!lastMove) return {};
    return {
      [lastMove.from]: {
        backgroundColor: 'rgba(15, 240, 252, 0.25)',
        boxShadow: 'inset 0 0 20px rgba(15, 240, 252, 0.3)'
      },
      [lastMove.to]: {
        backgroundColor: 'rgba(15, 240, 252, 0.35)',
        boxShadow: 'inset 0 0 25px rgba(15, 240, 252, 0.4)'
      }
    };
  }, [lastMove]);

  const chessboardOptions = { position: fen };

  return (
    <div className="live-card">
      <div className="card-top">
        <div className="player-info">
          <span className="player-name">{black.name} ({black.elo})</span>
        </div>
        <div className="player-clock">{formatClock(displayClock.b)}</div>
      </div>

      <div className="card-board">
        <Chessboard
          id={`live-board-${gameId}`}
          options={{
            position: fen,
            arePiecesDraggable: false,
            boardOrientation: 'white',
            arrows: arrows,
            arrowOptions: {
              color: arrowColor,
              opacity: 0.65
            },
            animationDurationInMs: animationSpeed,
            darkSquareStyle: { backgroundColor: darkSquareColor },
            lightSquareStyle: { backgroundColor: lightSquareColor },
            customPieces: getCustomPieces(pieceSet)
          }}
          boardWidth={300}
          customSquareStyles={customSquareStyles}
          customBoardStyle={{
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        />
      </div>

      <div className="card-bottom">
        <div className="player-info">
          <span className="player-name">{white.name} ({white.elo})</span>
        </div>
        <div className="player-clock">{formatClock(displayClock.w)}</div>
      </div>

      <div className="card-footer">
        {error ? (
          <span className="error-badge">{error}</span>
        ) : (
          <a
            className="lichess-link"
            href={gameId ? `https://lichess.org/${gameId}` : "#"}
            target="_blank"
            rel="noreferrer"
          >
            {gameId ? `${speed.toUpperCase()}` : "loading…"}
          </a>
        )}
      </div>
    </div>
  );
});
