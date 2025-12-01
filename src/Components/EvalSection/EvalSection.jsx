import { useState, useRef, useEffect } from "react";
import "./evalsection.css";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

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
    .filter(
      (t) => t.length > 0 && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(t)
    );

  return { tags, moves: tokens };
}

export default function EvalSection() {
  const [pgn, setPgn] = useState("");
  const [tags, setTags] = useState({});
  const [moves, setMoves] = useState([]);
  const startFen = new Chess().fen();
  const [fenList, setFenList] = useState([startFen]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [evaluation, setEvaluation] = useState(null);
  const [fillWidth, setFillWidth] = useState("50%");
  const [playing, setPlaying] = useState(false);
  const playRef = useRef(null);
  const chessRef = useRef(null);

  useEffect(() => {
    return () => {
      if (playRef.current) clearInterval(playRef.current);
    };
  }, []);

  function computeEvalForIndex(idx, movesArray, tagsObj) {
    if (!movesArray || movesArray.length === 0) {
      if (tagsObj && tagsObj.Result) {
        if (tagsObj.Result === "1-0") return 2.0;
        if (tagsObj.Result === "0-1") return -2.0;
        if (tagsObj.Result === "1/2-1/2") return 0.0;
      }
      return 0.0;
    }
    const n = idx;
    const raw = Math.sin(n * 0.45) * 1.75 + (n / Math.max(1, movesArray.length)) * 0.6;
    const clamped = Math.max(-2, Math.min(2, raw));
    return Math.round(clamped * 10) / 10;
  }

  function evalToWidth(evalNum) {
    const clamped = Math.max(-2, Math.min(2, evalNum));
    const pct = ((clamped + 2) / 4) * 100;
    return `${pct}%`;
  }

  const buildFenListFromMoves = (movesArray) => {
    const g = new Chess();
    const list = [g.fen()];
    const badMoves = [];
    for (const mv of movesArray) {
      if (!mv || typeof mv !== "string") continue;
      const moved = g.move(mv, { sloppy: true });
      if (!moved) {
        console.error("Failed to apply SAN move:", mv);
        badMoves.push(mv);
        break;
      }
      list.push(g.fen());
    }
    if (badMoves.length) {
    }
    return list;
  };

  const handleEvaluate = () => {
    const parsed = parsePGN(pgn);
    setTags(parsed.tags);

    let chess;
    let moveArray = [];

    try {
      chess = new Chess();
      let loaded = false;
      if (typeof chess.loadPgn === "function") {
        loaded = chess.loadPgn(pgn);
      } else if (typeof chess.load_pgn === "function") {
        loaded = chess.load_pgn(pgn);
      }
      if (loaded) {
        moveArray = chess.history();
      } else {
        moveArray = parsed.moves;
      }
    } catch (err) {
      moveArray = parsed.moves;
    }

    const fenArr = buildFenListFromMoves(moveArray);
    if (!fenArr || fenArr.length === 0) fenArr.push(new Chess().fen());
    setFenList(fenArr);

    try {
      const g2 = new Chess();
      if (typeof g2.loadPgn === "function") g2.loadPgn(pgn);
      else if (typeof g2.load_pgn === "function") g2.load_pgn(pgn);
      chessRef.current = g2;
    } catch (err) {
      chessRef.current = null;
    }

    setMoves(moveArray);
    const idx = fenArr.length - 1;
    setCurrentIndex(idx >= 0 ? idx : 0);

    const evalNum = computeEvalForIndex(idx, moveArray, parsed.tags);
    setEvaluation(evalNum);
    setFillWidth(evalToWidth(evalNum));
  };

  useEffect(() => {
    if (!moves) return;
    const evalNum = computeEvalForIndex(currentIndex, moves, tags);
    setEvaluation(evalNum);
    setFillWidth(evalToWidth(evalNum));
  }, [currentIndex, moves, tags]);

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

  const position = fenList[currentIndex] || new Chess().fen();
  const game = {position}

  const boardWidth = (typeof window !== "undefined")
    ? Math.min(520, Math.max(260, Math.floor(window.innerWidth * 0.34)))
    : 360;

  return (
    <section className="eval-section-wrapper">
      <div className="eval-section card">
        <div className="eval-left">
          <h2 className="eval-title">PGN → Evaluation Bar</h2>

          <textarea
            className="eval-input"
            placeholder="Paste PGN here"
            value={pgn}
            onChange={(e) => setPgn(e.target.value)}
            rows={8}
          />

          <div className="eval-controls">
            <button className="eval-btn" onClick={handleEvaluate}>
              Load & Evaluate
            </button>
            <button
              className="eval-clear"
              onClick={() => {
                setPgn("");
                setTags({});
                setMoves([]);
                setFenList([new Chess().fen()]);
                setCurrentIndex(0);
                setEvaluation(null);
                setFillWidth("50%");
                setPlaying(false);
                if (playRef.current) {
                  clearInterval(playRef.current);
                  playRef.current = null;
                }
              }}
            >
              Clear
            </button>
          </div>

          {evaluation !== null && (
            <div className="eval-result">
              <div className="eval-score-row">
                <div className="eval-score-label">Eval</div>
                <div className="eval-score-value">
                  {(evaluation >= 0 ? "+" : "") + evaluation.toFixed(1)}
                </div>
                <div className="eval-current-move">Move {Math.max(0, currentIndex)}</div>
              </div>

              <div className="eval-bar" aria-hidden>
                <div
                  className="eval-bar-fill"
                  style={{ width: fillWidth }}
                />
                <div className="eval-bar-value">
                  {(evaluation >= 0 ? "+" : "") + evaluation.toFixed(1)}
                </div>
              </div>

              <div className="eval-meta-line">
                <div className="meta-pill">moves: {moves.length}</div>
                <div className="meta-pill">result: {tags.Result || "—"}</div>
                <div className="meta-pill">event: {tags.Event || "—"}</div>
              </div>
            </div>
          )}
        </div>

        <aside className="eval-right">
          <div className="board-area">
            <div className="board-top-row">
              <h3 className="right-title">Board & Controls</h3>
              <div className="board-controls">
                <button onClick={gotoStart} className="ctrl-btn">⏮</button>
                <button onClick={prevMove} className="ctrl-btn">◀</button>
                <button onClick={togglePlay} className="ctrl-btn">{playing ? "⏸" : "▶"}</button>
                <button onClick={nextMove} className="ctrl-btn">▶</button>
                <button onClick={gotoEnd} className="ctrl-btn">⏭</button>
              </div>
            </div>

            <div className="chessboard-container">
              <Chessboard
                id="eval-chessboard"
                options={game}
                arePiecesDraggable={false}
                boardWidth={boardWidth}
              />
            </div>

            <div className="moves-area">
              <div className="moves-head">Moves</div>
              {moves.length === 0 ? (
                <div className="moves-empty">No moves parsed yet</div>
              ) : (
                <ol className="moves-list">
                  {moves.map((m, i) => {
                    const isActive = i === currentIndex - 1;
                    return (
                      <li
                        key={i}
                        className={`move-item ${isActive ? "active-move" : ""}`}
                        onClick={() => { gotoIndex(i + 1); }}
                      >
                        <span className="move-index">{i + 1}.</span> <span className="move-san">{m}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>

          <div className="right-footer">
            <h4 className="details-title">Game Details</h4>
            <div className="tag-grid">
              <div className="tag-row"><span className="tag-key">Event</span><span className="tag-val">{tags.Event || "—"}</span></div>
              <div className="tag-row"><span className="tag-key">Site</span><span className="tag-val">{tags.Site || "—"}</span></div>
              <div className="tag-row"><span className="tag-key">Date</span><span className="tag-val">{tags.Date || "—"}</span></div>
              <div className="tag-row"><span className="tag-key">White</span><span className="tag-val">{tags.White || "—"}</span></div>
              <div className="tag-row"><span className="tag-key">Black</span><span className="tag-val">{tags.Black || "—"}</span></div>
              <div className="tag-row"><span className="tag-key">Result</span><span className="tag-val">{tags.Result || "—"}</span></div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
