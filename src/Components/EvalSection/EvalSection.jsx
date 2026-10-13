import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import "./evalsection.css";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { getStockfishService } from "../../services/stockfishService";
import { greatestGames } from "../../data/greatestGames";
import { useBoardCustomization } from "../../contexts/BoardCustomizationContext";
import { getCustomPieces } from "../../utils/pieceSets";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Activity,
  Terminal,
  Code2,
} from "lucide-react";

function parsePGN(pgn) {
  const tags = {};
  const tagRegex = /\[([A-Za-z0-9_+\-]+)\s+"([^"]*)"\]/g;
  let m;
  while ((m = tagRegex.exec(pgn))) {
    tags[m[1]] = m[2];
  }

  const movesText = pgn
    .replace(tagRegex, "")
    .replace(/\{[^}]*\}/g, " ")
    .replace(/\([^\)]*\)/g, " ")
    .trim();

  const cleaned = movesText
    .replace(/\d+\.+/g, " ")
    .replace(/\$\d+/g, "")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = cleaned
    .split(" ")
    .filter((t) => t.length > 0 && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(t));

  return { tags, moves: tokens };
}

export default function EvalSection() {
  const [pgn, setPgn] = useState("");
  const [tags, setTags] = useState({});
  const [moves, setMoves] = useState([]);
  const startFen = new Chess().fen();
  const [fenList, setFenList] = useState([startFen]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [evaluation, setEvaluation] = useState(0.35);
  const [fillHeight, setFillHeight] = useState("53%");
  const [playing, setPlaying] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [activePreset, setActivePreset] = useState(0);
  const [showPgnDrawer, setShowPgnDrawer] = useState(false);

  const playRef = useRef(null);
  const chessRef = useRef(null);
  const engineRef = useRef(null);
  const { darkSquareColor, lightSquareColor, showNotation, pieceSet } =
    useBoardCustomization();

  const evaluateCurrentPosition = useCallback(async (fen) => {
    setIsEvaluating(true);
    try {
      const engine = engineRef.current || (engineRef.current = await getStockfishService());
      const score = await engine.evaluatePosition(fen, 12);
      return score;
    } catch (error) {
      console.error("Evaluation error:", error);
      return 0;
    } finally {
      setIsEvaluating(false);
    }
  }, []);

  function evalToPercent(evalNum) {
    if (typeof evalNum !== 'number' || isNaN(evalNum)) return "50%";
    if (evalNum >= 99) return "100%";
    if (evalNum <= -99) return "0%";
    // Realistic sigmoid curve (Lichess/Chess.com standard win probability)
    const winProb = 50 + 50 * (2 / (1 + Math.exp(-0.35 * evalNum)) - 1);
    const clamped = Math.max(3, Math.min(97, winProb));
    return `${clamped.toFixed(1)}%`;
  }

  const buildFenListFromMoves = (movesArray) => {
    const g = new Chess();
    const list = [g.fen()];
    for (const mv of movesArray) {
      if (!mv || typeof mv !== "string") continue;
      const moved = g.move(mv, { sloppy: true });
      if (!moved) break;
      list.push(g.fen());
    }
    return list;
  };

  const handleEvaluate = useCallback(
    async (pgnOverride = null, initialMoveIdx = null) => {
      const textToParse = typeof pgnOverride === "string" ? pgnOverride : pgn;

      if (typeof pgnOverride === "string") {
        setPgn(pgnOverride);
      }

      const parsed = parsePGN(textToParse);
      setTags(parsed.tags);

      let moveArray = [];
      try {
        const chess = new Chess();
        let loaded = false;
        if (typeof chess.loadPgn === "function") {
          loaded = chess.loadPgn(textToParse);
        } else if (typeof chess.load_pgn === "function") {
          loaded = chess.load_pgn(textToParse);
        }
        if (loaded) {
          moveArray = chess.history();
        } else {
          moveArray = parsed.moves;
        }
      } catch {
        moveArray = parsed.moves;
      }

      const fenArr = buildFenListFromMoves(moveArray);
      if (!fenArr || fenArr.length === 0) fenArr.push(new Chess().fen());
      setFenList(fenArr);

      try {
        const g2 = new Chess();
        if (typeof g2.loadPgn === "function") g2.loadPgn(textToParse);
        else if (typeof g2.load_pgn === "function") g2.load_pgn(textToParse);
        chessRef.current = g2;
      } catch {
        chessRef.current = null;
      }

      setMoves(moveArray);
      const targetIdx =
        typeof initialMoveIdx === "number"
          ? Math.min(initialMoveIdx, fenArr.length - 1)
          : Math.min(24, fenArr.length - 1);
      setCurrentIndex(targetIdx >= 0 ? targetIdx : 0);

      const targetFen = fenArr[targetIdx] || fenArr[fenArr.length - 1];
      const evalNum = await evaluateCurrentPosition(targetFen);
      setEvaluation(evalNum);
      setFillHeight(evalToPercent(evalNum));
    },
    [pgn, evaluateCurrentPosition]
  );

  useEffect(() => {
    const initEngine = async () => {
      try {
        engineRef.current = await getStockfishService();
      } catch (error) {
        console.error("Failed to initialize Stockfish:", error);
      }
      if (greatestGames && greatestGames[0]) {
        handleEvaluate(greatestGames[0].pgn, 24);
      }
    };
    initEngine();

    return () => {
      if (playRef.current) clearInterval(playRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPresetGame = (index) => {
    setActivePreset(index);
    if (greatestGames && greatestGames[index]) {
      handleEvaluate(greatestGames[index].pgn, 22);
    }
  };

  const loadRandomGame = () => {
    const randIdx = Math.floor(Math.random() * greatestGames.length);
    setActivePreset(randIdx);
    handleEvaluate(greatestGames[randIdx].pgn, 20);
  };

  useEffect(() => {
    if (!fenList || fenList.length === 0) return;

    const fen = fenList[currentIndex];
    if (!fen) return;

    const doEval = async () => {
      const evalNum = await evaluateCurrentPosition(fen);
      setEvaluation(evalNum);
      setFillHeight(evalToPercent(evalNum));
    };
    doEval();
  }, [currentIndex, fenList, evaluateCurrentPosition]);

  const gotoIndex = (i) => {
    const clamped = Math.max(0, Math.min(fenList.length - 1, i));
    setCurrentIndex(clamped);
  };

  const gotoStart = () => gotoIndex(0);
  const gotoEnd = () => gotoIndex(fenList.length - 1);
  const prevMove = () => gotoIndex(currentIndex - 1);
  const nextMove = () => gotoIndex(currentIndex + 1);

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      if (playRef.current) {
        clearInterval(playRef.current);
        playRef.current = null;
      }
    } else {
      setPlaying(true);
      playRef.current = setInterval(() => {
        setCurrentIndex((ci) => {
          const next = ci + 1;
          if (next >= fenList.length) {
            clearInterval(playRef.current);
            playRef.current = null;
            setPlaying(false);
            return ci;
          }
          return next;
        });
      }, 700);
    }
  };

  // Group moves into pairs for a real FIDE 2-column scoresheet
  const movePairs = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < moves.length; i += 2) {
      pairs.push({
        moveNumber: Math.floor(i / 2) + 1,
        white: { san: moves[i], index: i + 1 },
        black: moves[i + 1] ? { san: moves[i + 1], index: i + 2 } : null,
      });
    }
    return pairs;
  }, [moves]);

  const position = fenList[currentIndex] || new Chess().fen();

  const formattedEval =
    evaluation >= 99
      ? "+M"
      : evaluation <= -99
      ? "-M"
      : evaluation !== null
      ? (evaluation >= 0 ? "+" : "") + evaluation.toFixed(2)
      : "+0.00";

  return (
    <section className="cp-studio-section eval-section-wrapper">
      <div className="cp-studio-container">
        {/* Lumora Editorial Chapter Header */}
        <div className="cp-chapter-header">
          <div className="cp-chapter-meta">
            <span className="cp-chapter-index">
              <span className="cp-chapter-index-dot" />
              01 // ENGINE WORKSTATION
            </span>
            <span className="cp-chapter-subtag">STOCKFISH 17 WASM · NNUE</span>
          </div>
          <div className="cp-chapter-main">
            <h2 className="cp-chapter-title">
              Interactive Centipawn{" "}
              <span className="cp-chapter-title-accent">Telemetry Cockpit</span>
            </h2>
            <p className="cp-chapter-desc">
              Step through immortal grandmaster games or inject custom PGN notation to compute real-time WebAssembly engine evaluations.
            </p>
          </div>
          <div className="cp-chapter-actions">
            <Link to="/analysis" className="eval-workstation-cta">
              <span>Launch Full Depth-22 Lab</span>
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>

        {/* Unified Studio Console Window */}
        <div className="cp-console-window eval-console">
          {/* Window Top Chrome Bar */}
          <div className="cp-window-topbar">
            <div className="eval-chrome-left">
              <div className="cp-window-dots">
                <span className="cp-window-dot red" />
                <span className="cp-window-dot amber" />
                <span className="cp-window-dot green" />
              </div>
              <span className="cp-window-title">
                <Terminal size={13} />
                <span>stockfish-17-nnue.wasm — {isEvaluating ? "computing vectors..." : "ready"}</span>
              </span>
            </div>

            {/* Integrated Masterpiece Preset Tabs */}
            <div className="eval-preset-tabs">
              <button
                type="button"
                className={`eval-tab-btn ${activePreset === 0 ? "active" : ""}`}
                onClick={() => loadPresetGame(0)}
              >
                Kasparov vs Topalov &apos;99
              </button>
              <button
                type="button"
                className={`eval-tab-btn ${activePreset === 2 ? "active" : ""}`}
                onClick={() => loadPresetGame(2)}
              >
                Fischer &apos;56 Game of Century
              </button>
              <button
                type="button"
                className={`eval-tab-btn ${activePreset === 1 ? "active" : ""}`}
                onClick={() => loadPresetGame(1)}
              >
                Morphy Opera 1858
              </button>
              <button
                type="button"
                className="eval-tab-btn tab-random"
                onClick={loadRandomGame}
              >
                <Sparkles size={12} />
                <span>Random GM</span>
              </button>
              <button
                type="button"
                className={`eval-tab-btn tab-pgn-toggle ${showPgnDrawer ? "active" : ""}`}
                onClick={() => setShowPgnDrawer((v) => !v)}
              >
                <Code2 size={13} />
                <span>{showPgnDrawer ? "Hide PGN" : "Paste PGN"}</span>
              </button>
            </div>
          </div>

          {/* Collapsible Custom PGN Input Drawer */}
          {showPgnDrawer && (
            <div className="eval-pgn-drawer">
              <div className="pgn-drawer-inner">
                <textarea
                  className="eval-textarea"
                  placeholder='[Event "FIDE World Championship"]&#10;1. e4 e5 2. Nf3 Nc6 3. Bb5 a6...'
                  value={pgn}
                  onChange={(e) => setPgn(e.target.value)}
                  rows={3}
                />
                <div className="pgn-drawer-actions">
                  <button
                    type="button"
                    className="eval-btn-primary"
                    onClick={() => {
                      handleEvaluate(null, 0);
                      setShowPgnDrawer(false);
                    }}
                  >
                    Evaluate Custom PGN
                  </button>
                  <button
                    type="button"
                    className="eval-btn-ghost"
                    onClick={() => setPgn("")}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Dual-Pane Cockpit Body */}
          <div className="eval-cockpit-grid">
            {/* Left Pane: Vertical Eval Bar + Interactive Board + Transport Dock */}
            <div className="eval-board-pane">
              <div className="eval-board-stage">
                {/* Vertical Broadcast Evaluation Gauge */}
                <div className="eval-vertical-gauge" aria-label="Centipawn evaluation bar">
                  <div
                    className="eval-vertical-fill"
                    style={{ height: fillHeight }}
                  />
                  <div className="eval-vertical-midline" />
                  <span className="eval-vertical-readout">{formattedEval}</span>
                </div>

                {/* Chessboard */}
                <div className="eval-board-frame">
                  <Chessboard
                    id="eval-workstation-board"
                    options={{
                      position,
                      arePiecesDraggable: false,
                      showNotation,
                      darkSquareStyle: { backgroundColor: darkSquareColor },
                      lightSquareStyle: { backgroundColor: lightSquareColor },
                      pieces: getCustomPieces(pieceSet),
                      customPieces: getCustomPieces(pieceSet),
                    }}
                  />
                </div>
              </div>

              {/* Transport Controls Dock */}
              <div className="eval-transport-dock">
                <div className="transport-ply-counter">
                  <span>PLY</span>
                  <strong>
                    {Math.max(0, currentIndex)} / {moves.length}
                  </strong>
                </div>

                <div className="board-playback-controls">
                  <button
                    type="button"
                    onClick={gotoStart}
                    className="playback-btn"
                    title="Start"
                  >
                    <SkipBack size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={prevMove}
                    className="playback-btn"
                    title="Previous move"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="playback-btn playback-play-btn"
                    title={playing ? "Pause" : "Auto-play"}
                  >
                    {playing ? <Pause size={15} /> : <Play size={15} />}
                  </button>
                  <button
                    type="button"
                    onClick={nextMove}
                    className="playback-btn"
                    title="Next move"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={gotoEnd}
                    className="playback-btn"
                    title="End"
                  >
                    <SkipForward size={15} />
                  </button>
                </div>

                <div className="transport-active-move">
                  <span>MOVE:</span>
                  <strong>{currentIndex > 0 ? moves[currentIndex - 1] : "Start"}</strong>
                </div>
              </div>
            </div>

            {/* Right Pane: Telemetry HUD + Match Header + 2-Column FIDE Scoresheet */}
            <div className="eval-telemetry-pane">
              {/* Top Telemetry Scorebug */}
              <div className="eval-telemetry-hud">
                <div className="hud-metric-row">
                  <div className="hud-status">
                    <Activity size={15} className="hud-icon" />
                    <span className="hud-status-text">
                      {isEvaluating
                        ? "COMPUTING NNUE VECTORS..."
                        : "STOCKFISH 17 CENTIPAWN ADVANTAGE"}
                    </span>
                  </div>
                  <div className="hud-eval-value">{formattedEval}</div>
                </div>

                <div className="hud-eval-track" aria-hidden="true">
                  <div
                    className="hud-eval-fill"
                    style={{ width: fillHeight }}
                  />
                  <div className="hud-center-marker" />
                </div>

                {/* Match Players & Metadata Strip */}
                <div className="eval-match-banner">
                  <div className="eval-match-players">
                    <div className="eval-player-chip">
                      <span className="stone-dot white" />
                      <span className="eval-p-name">{tags.White || "Garry Kasparov"}</span>
                    </div>
                    <span className="eval-vs-sep">VS</span>
                    <div className="eval-player-chip">
                      <span className="stone-dot black" />
                      <span className="eval-p-name">{tags.Black || "Veselin Topalov"}</span>
                    </div>
                  </div>
                  <div className="eval-match-tags">
                    <span className="eval-meta-badge">{tags.Event || "Wijk aan Zee"}</span>
                    <span className="eval-meta-badge">ECO {tags.ECO || "B07"}</span>
                    <span className="eval-meta-badge accent">{tags.Result || "1-0"}</span>
                  </div>
                </div>
              </div>

              {/* 2-Column Tabular FIDE Scoresheet */}
              <div className="eval-scoresheet">
                <div className="scoresheet-header">
                  <span>#</span>
                  <span>WHITE</span>
                  <span>BLACK</span>
                </div>

                <div className="scoresheet-body">
                  {movePairs.length === 0 ? (
                    <div className="eval-moves-empty">
                      Select a masterpiece above or paste PGN to inspect the move tree.
                    </div>
                  ) : (
                    movePairs.map((pair) => (
                      <div key={pair.moveNumber} className="scoresheet-row">
                        <span className="scoresheet-num">{pair.moveNumber}.</span>
                        <button
                          type="button"
                          className={`scoresheet-ply ${
                            currentIndex === pair.white.index ? "active" : ""
                          }`}
                          onClick={() => gotoIndex(pair.white.index)}
                        >
                          {pair.white.san}
                        </button>
                        {pair.black ? (
                          <button
                            type="button"
                            className={`scoresheet-ply ${
                              currentIndex === pair.black.index ? "active" : ""
                            }`}
                            onClick={() => gotoIndex(pair.black.index)}
                          >
                            {pair.black.san}
                          </button>
                        ) : (
                          <span className="scoresheet-ply empty">—</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
