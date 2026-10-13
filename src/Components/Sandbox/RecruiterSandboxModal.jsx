import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Chess } from 'chess.js';
import {
  X,
  Play,
  UploadCloud,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  FileCode2,
  Clock,
  Swords,
  Copy,
  Check,
  Zap,
  Shield,
  Activity,
  Terminal,
  Database
} from 'lucide-react';
import './RecruiterSandboxModal.css';

const PRESET_SCENARIOS = [
  {
    id: 'kasparov',
    title: 'Deep Blue vs. Garry Kasparov (1997)',
    subtitle: 'Game 6 — Historic AI Breakthrough & Sacrificial King Hunt',
    event: 'IBM Man-Machine Summit, New York 1997',
    white: 'Deep Blue (IBM AI)',
    black: 'Garry Kasparov (2785)',
    result: '1-0',
    ply: 37,
    moves: [
      'e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Nd7', 'Ng5', 'Ngf6',
      'Bd3', 'e6', 'N1f3', 'h6', 'Nxe6', 'Qe7', 'O-O', 'fxe6', 'Bg6+', 'Kd8',
      'Bf4', 'b5', 'a4', 'Bb7', 'Re1', 'Nd5', 'Bg3', 'Kc8', 'axb5', 'cxb5',
      'Qd3', 'Bc6', 'Bf5', 'exf5', 'Rxe7', 'Bxe7', 'c4'
    ],
    highlight: 'Deep Blue played 8. Nxe6!! shocking the World Champion with a brutal tactical sacrifice that broke human dominance.',
    badgeColor: 'violet'
  },
  {
    id: 'fischer',
    title: 'The Game of the Century (Fischer vs. Byrne 1956)',
    subtitle: '13-Year-Old Fischer — Legendary Queen Sacrifice 17...Be6!!',
    event: 'Rosenwald Memorial, New York 1956',
    white: 'Donald Byrne',
    black: 'Bobby Fischer (13 yo)',
    result: '0-1',
    ply: 68,
    moves: [
      'Nf3', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'd4', 'O-O', 'Bf4', 'd5',
      'Qb3', 'dxc4', 'Qxc4', 'c6', 'e4', 'Nbd7', 'Rd1', 'Nb6', 'Qc5', 'Bg4',
      'Bg5', 'Na4', 'Qa3', 'Nxc3', 'bxc3', 'Nxe4', 'Bxe7', 'Qb6', 'Bc4', 'Nxc3',
      'Bc5', 'Rfe8+', 'Kf1', 'Be6', 'Bxb6', 'Bxc4+', 'Kg1', 'Ne2+', 'Kf1', 'Nxd4+',
      'Kg1', 'Ne2+', 'Kf1', 'Nc3+', 'Kg1', 'axb6', 'Qb4', 'Ra4', 'Qxb6', 'Nxd1',
      'h3', 'Rxa2', 'Kh2', 'Nxf2', 'Re1', 'Rxe1', 'Qd8+', 'Bf8', 'Nxe1', 'Bd5',
      'Nf3', 'Ne4', 'Qb8', 'b5', 'Ne5', 'Kg7', 'Nd7', 'Bd6+'
    ],
    highlight: '13-year-old Bobby Fischer sacrificed his Queen on move 17 with ...Be6!! to launch an immortal minor-piece windmill assault.',
    badgeColor: 'gold'
  },
  {
    id: 'immortal',
    title: 'The Immortal Game (Anderssen vs. Kieseritzky 1851)',
    subtitle: 'Romantic Era — Queen & Double Rook Sacrifice Checkmate',
    event: 'The Great Exhibition Tournament, London 1851',
    white: 'Adolf Anderssen',
    black: 'Lionel Kieseritzky',
    result: '1-0',
    ply: 45,
    moves: [
      'e4', 'e5', 'f4', 'exf4', 'Bc4', 'Qh4+', 'Kf1', 'b5', 'Bxb5', 'Nf6',
      'Nf3', 'Qh6', 'd3', 'Nh5', 'Nh4', 'Qg5', 'Nf5', 'c6', 'g4', 'Nf6',
      'Rg1', 'cxb5', 'h4', 'Qg6', 'h5', 'Qg5', 'Qf3', 'Ng8', 'Bxf4', 'Qf6',
      'Nc3', 'Bc5', 'Nd5', 'Qxb2', 'Bd6', 'Bxg1', 'e5', 'Qxa1+', 'Ke2', 'Na6',
      'Nxg7+', 'Kd8', 'Qf6+', 'Nxf6', 'Be7#'
    ],
    highlight: 'Anderssen gave up both rooks and his queen to deliver a checkmate using only three minor pieces in the romantic style.',
    badgeColor: 'emerald'
  },
  {
    id: 'carlsen',
    title: 'Magnus Carlsen vs. Ian Nepomniachtchi (2021)',
    subtitle: 'WCC Game 6 — 136-Move Historical Marathon & Masterclass',
    event: 'FIDE World Chess Championship, Dubai 2021',
    white: 'Magnus Carlsen (2855)',
    black: 'Ian Nepomniachtchi (2782)',
    result: '1-0',
    ply: 40,
    moves: [
      'd4', 'Nf6', 'Nf3', 'd5', 'g3', 'e6', 'Bg2', 'Be7', 'O-O', 'O-O',
      'b3', 'c5', 'dxc5', 'Bxc5', 'c4', 'dxc4', 'Qc2', 'Qe7', 'Nbd2', 'Nc6',
      'Nxc4', 'b5', 'Nce5', 'Nb4', 'Qb2', 'Bb7', 'a3', 'Nc6', 'Nd3', 'Bb6',
      'Bg5', 'Rfd8', 'Bxf6', 'gxf6', 'Rac1', 'Nd4', 'Nxd4', 'Bxd4', 'Qa2', 'Bxg2'
    ],
    highlight: 'A technical grinder where Carlsen extracted minute dynamic imbalances with sub-millipawn precision to break the world championship tie.',
    badgeColor: 'cyan'
  }
];

const PIPELINE_STAGES = [
  { id: 1, name: 'PGN Ingest & SAN Parse', desc: 'Validating move tree, ply coordinates, and legal transitions' },
  { id: 2, name: 'Stockfish 17 WASM Multi-Thread Boot', desc: 'Initializing neural NNUE evaluation worker thread' },
  { id: 3, name: 'Centipawn Vector & Blunder Vectorization', desc: 'Classifying inaccuracies, blunders, and brilliant moves' },
  { id: 4, name: 'Studio Hydration & Evaluation Graphs', desc: 'Synthesizing interactive evaluation bar & telemetry timeline' }
];

const SAMPLE_PGNS = [
  {
    label: 'Opera Game (Morphy 1858)',
    pgn: '1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxf6 gxf6 16. Bxd7+ Qxd7 17. Rxd7 Kxd7 18. Qxf7+'
  },
  {
    label: 'Tal vs. Botvinnik (1960 WCC)',
    pgn: '1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Bf5 5. Ng3 Bg6 6. N1e2 Nf6 7. h4 h6 8. Nf4 Bh7 9. Bc4 e6 10. O-O Bd6 11. Re1 O-O 12. c3 Qc7 13. Qf3 Nbd7'
  },
  {
    label: 'Kasparov Immortal (1999)',
    pgn: '1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 7. Nge2 Nbd7 8. Bh6 Bxh6 9. Qxh6 Bb7 10. a3 e5 11. O-O-O Qe7 12. Kb1 a6'
  }
];

export default function RecruiterSandboxModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('scenarios'); // 'scenarios' | 'custom' | 'architecture'
  const [selectedScenario, setSelectedScenario] = useState(PRESET_SCENARIOS[0]);
  const [customPgn, setCustomPgn] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [copiedId, setCopiedId] = useState(null);

  // Keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isExecuting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isExecuting, onClose]);

  if (!isOpen) return null;

  const handleSimulate = async (scenario) => {
    setIsExecuting(true);
    setCurrentStage(1);

    for (let step = 1; step <= 4; step++) {
      setCurrentStage(step);
      await new Promise((res) => setTimeout(res, 480));
    }

    setTimeout(() => {
      setIsExecuting(false);
      onClose();
      navigate('/analysis', {
        state: {
          moves: scenario.moves,
          white: scenario.white,
          black: scenario.black,
          event: scenario.event,
          result: scenario.result,
          source: 'sandbox'
        }
      });
    }, 400);
  };

  const handleCustomUpload = async () => {
    if (!customPgn.trim()) return;

    try {
      const chess = new Chess();
      chess.loadPgn(customPgn);
      const history = chess.history();

      if (history.length === 0) {
        alert('Invalid PGN: No legal moves parsed. Please check format or try a preset scenario.');
        return;
      }

      setIsExecuting(true);
      for (let step = 1; step <= 4; step++) {
        setCurrentStage(step);
        await new Promise((res) => setTimeout(res, 440));
      }

      setIsExecuting(false);
      onClose();
      navigate('/analysis', {
        state: {
          moves: history,
          white: chess.header()?.White || 'White',
          black: chess.header()?.Black || 'Black',
          event: chess.header()?.Event || 'Custom PGN Ingestion',
          result: chess.header()?.Result || '*',
          source: 'custom_pgn'
        }
      });
    } catch (e) {
      alert('Could not parse PGN: ' + e.message);
      setIsExecuting(false);
    }
  };

  const handleCopySample = (scenario) => {
    navigator.clipboard.writeText(scenario.moves.join(' '));
    setCopiedId(scenario.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Compute parsed moves in custom PGN
  const parsedMoveCount = (() => {
    if (!customPgn.trim()) return 0;
    try {
      const c = new Chess();
      c.loadPgn(customPgn);
      return c.history().length;
    } catch {
      return 0;
    }
  })();

  return (
    <div className="sandbox-modal-backdrop" onClick={isExecuting ? undefined : onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', damping: 25, stiffness: 320 }}
        className="sandbox-modal-window"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ====================================================================
            MODAL HEADER
            ==================================================================== */}
        <div className="sandbox-modal-header">
          <div className="sandbox-header-left">
            <div className="sandbox-spark-icon">
              <Sparkles size={18} />
            </div>
            <div className="sandbox-title-col">
              <div className="sandbox-title-row">
                <h2 className="sandbox-title">Recruiter & Evaluation Sandbox</h2>
                <span className="sandbox-badge">PROD SIMULATION</span>
              </div>
              <p className="sandbox-subtitle">
                Zero friction evaluation: Instant pre-bundled Grandmaster games & pipeline stepper
              </p>
            </div>
          </div>

          {!isExecuting && (
            <button type="button" onClick={onClose} className="sandbox-close-btn" title="Close [ESC]">
              <X size={16} />
            </button>
          )}
        </div>

        {/* ====================================================================
            TOP TELEMETRY HUD RIBBON
            ==================================================================== */}
        <div className="sandbox-hud-strip">
          <div className="sandbox-hud-cell">
            <span className="sandbox-hud-code">SYS-01 // CLIENT ENGINE</span>
            <span className="sandbox-hud-val violet">Stockfish 17 NNUE</span>
          </div>
          <div className="sandbox-hud-cell">
            <span className="sandbox-hud-code">SYS-02 // SCENARIOS</span>
            <span className="sandbox-hud-val cyan">4 Grandmaster Classics</span>
          </div>
          <div className="sandbox-hud-cell">
            <span className="sandbox-hud-code">SYS-03 // ANALYSIS PIPELINE</span>
            <span className="sandbox-hud-val emerald">4-Stage Centipawn</span>
          </div>
          <div className="sandbox-hud-cell">
            <span className="sandbox-hud-code">SYS-04 // LATENCY</span>
            <span className="sandbox-hud-val gold">0ms Client WASM</span>
          </div>
        </div>

        {/* ====================================================================
            MODAL CONTENT BODY
            ==================================================================== */}
        <div className="sandbox-modal-body">
          {/* SIMULATION ACTIVE: LIVE PIPELINE STEPPER */}
          {isExecuting ? (
            <div className="simulation-stage-view">
              <div className="simulation-spinner-pod">
                <Cpu size={32} />
              </div>

              <div className="simulation-head">
                <h3>Executing ChessPulse Intelligence Pipeline</h3>
                <p>Running Stockfish 17 Multi-Threaded Neural Engine on WebAssembly...</p>
              </div>

              {/* 4-Stage Live Stepper */}
              <div className="stepper-pipeline-track">
                {PIPELINE_STAGES.map((stage) => {
                  const isDone = currentStage > stage.id;
                  const isRunning = currentStage === stage.id;

                  return (
                    <div
                      key={stage.id}
                      className={`stepper-item-row ${isDone ? 'done' : isRunning ? 'running' : ''}`}
                    >
                      <div className="stepper-num-orb">
                        {isDone ? <CheckCircle2 size={14} /> : stage.id}
                      </div>

                      <div className="stepper-text-col">
                        <div className="stepper-name-line">
                          <span className="stepper-title">{stage.name}</span>
                          {isRunning && (
                            <span className="stepper-status-tag active">RUNNING...</span>
                          )}
                          {isDone && (
                            <span className="stepper-status-tag done">COMPLETED</span>
                          )}
                        </div>
                        <span className="stepper-desc">{stage.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* MODE NAVIGATION TABS */}
              <div className="sandbox-mode-tabs">
                <button
                  type="button"
                  className={`sandbox-tab-pill ${activeTab === 'scenarios' ? 'active' : ''}`}
                  onClick={() => setActiveTab('scenarios')}
                >
                  <Swords size={13} />
                  <span>Grandmaster Matches (Instant)</span>
                </button>
                <button
                  type="button"
                  className={`sandbox-tab-pill ${activeTab === 'custom' ? 'active' : ''}`}
                  onClick={() => setActiveTab('custom')}
                >
                  <FileCode2 size={13} />
                  <span>Custom PGN Terminal</span>
                </button>
                <button
                  type="button"
                  className={`sandbox-tab-pill ${activeTab === 'architecture' ? 'active' : ''}`}
                  onClick={() => setActiveTab('architecture')}
                >
                  <Cpu size={13} />
                  <span>Engine Architecture</span>
                </button>
              </div>

              {/* TAB 1: GRANDMASTER SCENARIOS */}
              {activeTab === 'scenarios' && (
                <>
                  <div className="scenarios-grid">
                    {PRESET_SCENARIOS.map((scenario) => {
                      const isSelected = selectedScenario.id === scenario.id;

                      return (
                        <div
                          key={scenario.id}
                          className={`scenario-card ${isSelected ? 'active' : ''}`}
                          onClick={() => setSelectedScenario(scenario)}
                        >
                          <div className="scenario-card-top">
                            <span className="scenario-result-pill">{scenario.result}</span>
                            <span className="scenario-plies-count">{scenario.ply} plies</span>
                          </div>

                          <div>
                            <h4 className="scenario-title">{scenario.title}</h4>
                            <p className="scenario-sub">{scenario.subtitle}</p>
                          </div>

                          <div className="scenario-moves-preview">
                            {scenario.moves.slice(0, 10).join(' ')}...
                          </div>

                          <div className="scenario-actions-row">
                            <button
                              type="button"
                              className="copy-moves-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopySample(scenario);
                              }}
                              title="Copy moves"
                            >
                              {copiedId === scenario.id ? (
                                <>
                                  <Check size={12} color="#10b981" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={12} />
                                  <span>Copy PGN</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              className="simulate-quick-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSimulate(scenario);
                              }}
                            >
                              <Play size={11} fill="currentColor" />
                              <span>Simulate</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Selected Scenario Spotlight Box */}
                  {selectedScenario && (
                    <div className="scenario-spotlight-box">
                      <div className="spotlight-info-col">
                        <span className="spotlight-header-tag">
                          SPOTLIGHT // {selectedScenario.white.toUpperCase()} VS {selectedScenario.black.toUpperCase()}
                        </span>
                        <p className="spotlight-quote">&ldquo;{selectedScenario.highlight}&rdquo;</p>
                        <span className="spotlight-event-meta">{selectedScenario.event}</span>
                      </div>

                      <button
                        type="button"
                        className="spotlight-cta-btn"
                        onClick={() => handleSimulate(selectedScenario)}
                      >
                        <span>LAUNCH PIPELINE ON {selectedScenario.id.toUpperCase()}</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* TAB 2: CUSTOM PGN TERMINAL */}
              {activeTab === 'custom' && (
                <div className="custom-pgn-terminal-wrap">
                  <div className="sample-pgn-chips-row">
                    <span className="sample-chip-label">QUICK LOAD SAMPLES:</span>
                    {SAMPLE_PGNS.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        className="sample-pgn-chip"
                        onClick={() => setCustomPgn(item.pgn)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="pgn-editor-box">
                    <textarea
                      rows={5}
                      value={customPgn}
                      onChange={(e) => setCustomPgn(e.target.value)}
                      placeholder="Paste standard PGN text or SAN moves (e.g. 1. e4 e5 2. Nf3 Nc6 3. Bb5 a6...)"
                      className="pgn-editor-textarea"
                    />

                    <div className="pgn-editor-footer">
                      <span className="pgn-status-pill">
                        {parsedMoveCount > 0 ? (
                          <span className="pgn-status-validated">✓ Validated: {parsedMoveCount} Plies</span>
                        ) : (
                          <span>Awaiting PGN input...</span>
                        )}
                      </span>

                      <button
                        type="button"
                        className="spotlight-cta-btn"
                        disabled={parsedMoveCount === 0}
                        onClick={handleCustomUpload}
                        style={{ opacity: parsedMoveCount === 0 ? 0.4 : 1 }}
                      >
                        <UploadCloud size={14} />
                        <span>ANALYZE CUSTOM PGN ({parsedMoveCount} PLIES)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ARCHITECTURE SPECS */}
              {activeTab === 'architecture' && (
                <div className="arch-specs-grid">
                  <div className="arch-spec-card">
                    <div className="arch-icon-pod pod-cyan">
                      <Cpu size={18} />
                    </div>
                    <div className="arch-text-col">
                      <h4 className="arch-card-title">Client-Side Stockfish 17 WASM</h4>
                      <p className="arch-card-desc">
                        Runs multi-threaded WebAssembly directly in the browser via dedicated Web Workers with NNUE neural network support, achieving 0ms server latency.
                      </p>
                    </div>
                  </div>

                  <div className="arch-spec-card">
                    <div className="arch-icon-pod pod-purple">
                      <Activity size={18} />
                    </div>
                    <div className="arch-text-col">
                      <h4 className="arch-card-title">Centipawn & Blunder Metric</h4>
                      <p className="arch-card-desc">
                        Calculates precision vectors, win probability curves, accuracy percentages, and flags inaccuracies, blunders, and brilliant moves in real-time.
                      </p>
                    </div>
                  </div>

                  <div className="arch-spec-card">
                    <div className="arch-icon-pod pod-emerald">
                      <Database size={18} />
                    </div>
                    <div className="arch-text-col">
                      <h4 className="arch-card-title">PGN Stream & Tree Parser</h4>
                      <p className="arch-card-desc">
                        Custom high-throughput PGN tokenizer supporting nested variations, FIDE time comments, move annotations ($1-$6), and header metadata.
                      </p>
                    </div>
                  </div>

                  <div className="arch-spec-card">
                    <div className="arch-icon-pod pod-gold">
                      <Shield size={18} />
                    </div>
                    <div className="arch-text-col">
                      <h4 className="arch-card-title">Zero-Server Offline Guarantee</h4>
                      <p className="arch-card-desc">
                        100% of game analysis and puzzle solving runs in-browser without sending private moves to external cloud servers, ensuring strict privacy.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ====================================================================
            MODAL FOOTER
            ==================================================================== */}
        <div className="sandbox-modal-footer">
          <div className="footer-status-tag">
            <span className="footer-pulse-dot" />
            <span>STOCKFISH WASM MULTI-THREAD ENGINE ACTIVE</span>
          </div>
          <span>ZERO-SETUP RECRUITER VERIFIED · PRESS [ESC] TO CLOSE</span>
        </div>
      </motion.div>
    </div>
  );
}
