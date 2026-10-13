import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Chessboard } from "react-chessboard";
import { getCustomPieces } from "../../utils/pieceSets";
import { useBoardCustomization } from "../../contexts/BoardCustomizationContext";
import { Chess } from "chess.js";
import { Radio, ExternalLink, Zap, Clock, ArrowUpRight, RefreshCw } from "lucide-react";
import "./livegame.css";

const FIXED_SPEEDS = [
  {
    speed: "bullet",
    channel: "CH-01 // BULLET",
    title: "Bullet Division",
    timeControl: "1+0 · 2+1",
    accent: "#06b6d4",
    icon: Zap,
  },
  {
    speed: "blitz",
    channel: "CH-02 // BLITZ",
    title: "Blitz Division",
    timeControl: "3+0 · 3+2",
    accent: "#a855f7",
    icon: Radio,
  },
  {
    speed: "rapid",
    channel: "CH-03 // RAPID",
    title: "Rapid Division",
    timeControl: "10+0 · 15+10",
    accent: "#10b981",
    icon: Clock,
  },
];

export default function LiveGame() {
  return (
    <section className="cp-studio-section live-row-wrapper">
      <div className="cp-studio-container">
        {/* Lumora Editorial Chapter Header */}
        <div className="cp-chapter-header">
          <div className="cp-chapter-meta">
            <span className="cp-chapter-index">
              <span className="cp-chapter-index-dot" />
              02 // LIVE ARENA STREAMS
            </span>
            <span className="cp-chapter-subtag">WEBSOCKET NDJSON PIPELINE</span>
          </div>
          <div className="cp-chapter-main">
            <h2 className="cp-chapter-title">
              Grandmaster{" "}
              <span className="cp-chapter-title-accent">Broadcast TV</span>
            </h2>
            <p className="cp-chapter-desc">
              Synchronized sub-second board telemetry from live high-Elo arena battles across Bullet, Blitz, and Rapid divisions.
            </p>
          </div>
          <div className="cp-chapter-actions">
            <Link to="/tournaments" className="live-tournaments-cta">
              <span>Official FIDE Broadcasts</span>
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>

        <div className="live-boards-grid">
          {FIXED_SPEEDS.map((item, i) => (
            <LiveGameCard
              key={item.speed}
              speed={item.speed}
              channel={item.channel}
              cardTitle={item.title}
              timeControl={item.timeControl}
              accent={item.accent}
              Icon={item.icon}
              cardId={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

const LiveGameCard = React.memo(function LiveGameCard({
  speed,
  channel,
  cardTitle,
  timeControl,
  accent,
  Icon,
  cardId,
}) {
  const [fen, setFen] = useState(new Chess().fen());
  const [white, setWhite] = useState({ name: "Grandmaster", elo: "2740" });
  const [black, setBlack] = useState({ name: "Grandmaster", elo: "2725" });
  const [displayClock, setDisplayClock] = useState({ w: 180, b: 180 });
  const [activeTurn, setActiveTurn] = useState("w");
  const [gameId, setGameId] = useState(null);
  const { darkSquareColor, lightSquareColor, showNotation, pieceSet, animationSpeed, arrowColor } =
    useBoardCustomization();
  const [error, setError] = useState(null);
  const [lastMove, setLastMove] = useState(null);

  const abortRef = useRef(null);
  const baseClockRef = useRef({ w: 180, b: 180 });
  const lastUpdateRef = useRef(Date.now());
  const turnRef = useRef("w");
  const previousFenRef = useRef(null);

  const formatClock = useCallback((t) => {
    if (typeof t !== "number" || Number.isNaN(t)) return "--:--";
    const total = Math.max(0, Math.floor(t));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s < 10 ? "0" + s : s}`;
  }, []);

  const calcDisplayClock = useCallback(() => {
    const now = Date.now();
    const elapsed = (now - lastUpdateRef.current) / 1000;
    let w = baseClockRef.current.w;
    let b = baseClockRef.current.b;
    if (turnRef.current === "w") w = Math.max(0, w - elapsed);
    else b = Math.max(0, b - elapsed);
    return { w, b };
  }, []);

  const getLastMoveSquares = useCallback((oldFen, newFen) => {
    if (!oldFen || !newFen || oldFen === newFen) return null;
    try {
      const newChess = new Chess(newFen);
      const history = newChess.history({ verbose: true });
      if (history.length === 0) return null;
      const last = history[history.length - 1];
      return { from: last.from, to: last.to, san: last.san };
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

  const startStream = useCallback(
    async (id) => {
      try {
        abortRef.current?.abort();
      } catch {
        // ignore abort error
      }
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
          setError(`Stream ${response.status}`);
          return;
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setError("Stream standby");
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
            if (evt.players.white?.user?.name || evt.players.white?.name) {
              setWhite({
                name: evt.players.white.user?.name || evt.players.white.name,
                elo: evt.players.white.rating ?? "—",
              });
            }
            if (evt.players.black?.user?.name || evt.players.black?.name) {
              setBlack({
                name: evt.players.black.user?.name || evt.players.black.name,
                elo: evt.players.black.rating ?? "—",
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
              setActiveTurn(parts[1]);
              lastUpdateRef.current = Date.now();
            }
          }
        }

        process();
      }

      process();
    },
    [calcDisplayClock, getLastMoveSquares]
  );

  const loadRandomGameForSpeed = useCallback(
    async (selectedSpeed) => {
      try {
        setError(null);
        const res = await fetch(`https://lichess.org/api/tv/${selectedSpeed}`);

        if (res.status === 429) {
          setError("Rate limited");
          return;
        }

        const text = await res.text();

        const whiteName = text.match(/\[White "([^"]+)"\]/)?.[1] || "Grandmaster";
        const blackName = text.match(/\[Black "([^"]+)"\]/)?.[1] || "Grandmaster";
        const whiteElo = text.match(/\[WhiteElo "([^"]+)"\]/)?.[1] || "—";
        const blackElo = text.match(/\[BlackElo "([^"]+)"\]/)?.[1] || "—";

        setWhite({ name: whiteName, elo: whiteElo });
        setBlack({ name: blackName, elo: blackElo });

        const id = text.match(/\[Site "https:\/\/lichess\.org\/([^"]+)"\]/)?.[1];
        if (!id) {
          setError("Channel standby");
          return;
        }
        setGameId(id);
        startStream(id);
      } catch {
        setError("Channel standby");
      }
    },
    [startStream]
  );

  useEffect(() => {
    loadRandomGameForSpeed(speed);
    return () => {
      try {
        abortRef.current?.abort();
      } catch {
        // ignore
      }
    };
  }, [speed, loadRandomGameForSpeed]);

  const customSquareStyles = useMemo(() => {
    if (!lastMove) return {};
    return {
      [lastMove.from]: {
        backgroundColor: "rgba(6, 182, 212, 0.28)",
        boxShadow: "inset 0 0 16px rgba(6, 182, 212, 0.35)",
      },
      [lastMove.to]: {
        backgroundColor: "rgba(168, 85, 247, 0.35)",
        boxShadow: "inset 0 0 20px rgba(168, 85, 247, 0.45)",
      },
    };
  }, [lastMove]);

  return (
    <div className="live-stream-card" style={{ "--div-accent": accent }}>
      {/* Broadcast Monitor Header */}
      <div className="stream-card-header">
        <div className="stream-type-pill">
          <div className="stream-icon-badge">
            <Icon size={15} />
          </div>
          <div>
            <span className="stream-channel-code">{channel}</span>
            <h3 className="stream-type-title">{cardTitle}</h3>
          </div>
        </div>
        <div className="stream-header-right">
          <span className="stream-time-control">{timeControl}</span>
          <button
            type="button"
            className="stream-refresh-btn"
            onClick={() => loadRandomGameForSpeed(speed)}
            title="Switch live board"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Top Player Scorebug (Black) */}
      <div className={`player-strip black-strip ${activeTurn === "b" ? "active-turn" : ""}`}>
        <div className="player-meta-info">
          <span className="player-piece-indicator black-indicator" />
          <span className="player-handle">{black.name}</span>
          <span className="player-rating">{black.elo}</span>
        </div>
        <div className={`digital-clock ${activeTurn === "b" ? "clock-live" : ""}`}>
          {formatClock(displayClock.b)}
        </div>
      </div>

      {/* Chessboard Area */}
      <div className="stream-board-container">
        <div className="stream-board-inner">
          <Chessboard
            id={`live-board-${gameId || cardId}`}
            options={{
              position: fen,
              arePiecesDraggable: false,
              boardOrientation: "white",
              showNotation,
              animationDurationInMs: animationSpeed,
              squareStyles: customSquareStyles,
              darkSquareStyle: { backgroundColor: darkSquareColor },
              lightSquareStyle: { backgroundColor: lightSquareColor },
              arrowOptions: {
                color: arrowColor,
                opacity: 0.65,
              },
              pieces: getCustomPieces(pieceSet),
              customPieces: getCustomPieces(pieceSet),
            }}
          />
        </div>
      </div>

      {/* Bottom Player Scorebug (White) */}
      <div className={`player-strip white-strip ${activeTurn === "w" ? "active-turn" : ""}`}>
        <div className="player-meta-info">
          <span className="player-piece-indicator white-indicator" />
          <span className="player-handle">{white.name}</span>
          <span className="player-rating">{white.elo}</span>
        </div>
        <div className={`digital-clock ${activeTurn === "w" ? "clock-live" : ""}`}>
          {formatClock(displayClock.w)}
        </div>
      </div>

      {/* Broadcast Telemetry Bar */}
      <div className="stream-card-footer">
        <div className="stream-last-move">
          <span className="stream-live-dot" />
          <span>
            {error
              ? error
              : lastMove
              ? `LAST: ${lastMove.from.toUpperCase()} → ${lastMove.to.toUpperCase()}`
              : "LIVE STREAM"}
          </span>
        </div>

        <a
          className="stream-watch-link"
          href={gameId ? `https://lichess.org/${gameId}` : "https://lichess.org/tv"}
          target="_blank"
          rel="noreferrer"
        >
          <span>Spectate</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
});
