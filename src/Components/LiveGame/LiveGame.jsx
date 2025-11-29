import React, { useEffect, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import "./livegame.css";


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

function LiveGameCard({ speed, cardId }) {
  const [fen, setFen] = useState(new Chess().fen());
  const [white, setWhite] = useState({ name: "-", elo: "-" });
  const [black, setBlack] = useState({ name: "-", elo: "-" });
  const [displayClock, setDisplayClock] = useState({ w: 0, b: 0 });
  const [gameId, setGameId] = useState(null);

  const abortRef = useRef(null);
  const baseClockRef = useRef({ w: 0, b: 0 });
  const lastUpdateRef = useRef(Date.now());
  const turnRef = useRef("w");

  const boardWidth = 200;

  const formatClock = (t) => {
    if (typeof t !== "number" || Number.isNaN(t)) return "--:--";
    const total = Math.max(0, Math.floor(t));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s < 10 ? "0" + s : s}`;
  };

  const calcDisplayClock = () => {
    const now = Date.now();
    const elapsed = (now - lastUpdateRef.current) / 1000;
    let w = baseClockRef.current.w;
    let b = baseClockRef.current.b;
    if (turnRef.current === "w") w = Math.max(0, w - elapsed);
    else b = Math.max(0, b - elapsed);
    return { w, b };
  };

  useEffect(() => {
    const id = setInterval(() => {
      setDisplayClock(calcDisplayClock());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  async function loadRandomGameForSpeed(selectedSpeed) {
    try {
      const res = await fetch(`https://lichess.org/api/tv/${selectedSpeed}`);
      const text = await res.text();
      const id = text.match(/\[Site "https:\/\/lichess\.org\/([^"]+)"/)?.[1];
      if (!id) {
        console.warn(
          "LiveGameCard: could not extract game id for speed",
          selectedSpeed
        );
        return;
      }
      setGameId(id);
      startStream(id);
    } catch (err) {
      console.error("LiveGameCard loadRandomGame error", err);
    }
  }

  async function startStream(id) {
    try {
      abortRef.current?.abort();
    } catch (e) {}
    const controller = new AbortController();
    abortRef.current = controller;

    const url = `https://lichess.org/api/stream/game/${id}`;
    let response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } catch (err) {
      console.error("LiveGameCard startStream fetch failed", err);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    let buffer = "";

    const tmpChess = new Chess();
    setFen(tmpChess.fen());
    setWhite({ name: "-", elo: "-" });
    setBlack({ name: "-", elo: "-" });
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
          setWhite({
            name: evt.players.white?.name ?? "-",
            elo: evt.players.white?.rating ?? "-",
          });
          setBlack({
            name: evt.players.black?.name ?? "-",
            elo: evt.players.black?.rating ?? "-",
          });
        }

        if (typeof evt.wc === "number" && typeof evt.bc === "number") {
          baseClockRef.current = { w: evt.wc, b: evt.bc };
          lastUpdateRef.current = Date.now();
          setDisplayClock(calcDisplayClock());
        }

        if (evt.fen) {
          setFen(evt.fen);
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
      } catch (e) {}
    };
  }, [speed]);

  const chessboardOptions = { position: fen };

  return (
    <div className="live-card">
      <div className="card-top">
        <div className="player-top">
          <span className="player-top-name">⚫ {black.name}</span>
          <span className="player-top-elo">({black.elo})</span>
        </div>
        <div className="player-top-clock">{formatClock(displayClock.b)}</div>
      </div>

      <div className="card-board">
        <Chessboard
          id={`live-board-${cardId}`}
          options={chessboardOptions}
          boardWidth={boardWidth}
          arePiecesDraggable={false}
          animationDuration={260}
          customLightSquareStyle={{ backgroundColor: "#f0efe8" }}
          customDarkSquareStyle={{ backgroundColor: "#7a9b57" }}
        />
      </div>

      <div className="card-bottom">
        <div className="player-bottom">
          <span className="player-bottom-name">⚪ {white.name}</span>
          <span className="player-bottom-elo">({white.elo})</span>
        </div>
        <div className="player-bottom-clock">{formatClock(displayClock.w)}</div>
      </div>

      <div className="card-footer">
        <a
          className="lichess-link"
          href={gameId ? `https://lichess.org/${gameId}` : "#"}
          target="_blank"
          rel="noreferrer"
        >
          {gameId ? `${speed.toUpperCase()}` : "loading…"}
        </a>
      </div>
    </div>
  );
}
