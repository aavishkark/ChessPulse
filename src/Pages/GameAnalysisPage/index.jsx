import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { getStockfishService } from '../../services/stockfishService';
import { useBoardCustomization } from '../../contexts/BoardCustomizationContext';
import { getCustomPieces } from '../../utils/pieceSets';
import PageHeader, { PageAmbient } from '../../Components/UI/PageHeader';
import {
  Cpu,
  SkipBack,
  ChevronLeft,
  ChevronRight,
  SkipForward,
  Play,
  Pause,
  RotateCw,
  Copy,
  Check,
  Code2,
  Activity,
  Sparkles,
  GitBranch,
} from 'lucide-react';
import './gameAnalysis.css';

// Pre-bundled legendary games for instant review if no prior game is passed
const SHOWCASE_GAMES = {
  kasparov: {
    id: 'kasparov',
    label: 'Deep Blue vs Kasparov (1997)',
    white: 'Deep Blue (IBM AI)',
    black: 'Garry Kasparov (2785)',
    playerColor: 'white',
    result: '1-0',
    moves: [
      'e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Nd7', 'Ng5', 'Ngf6',
      'Bd3', 'e6', 'N1f3', 'h6', 'Nxe6', 'Qe7', 'O-O', 'fxe6', 'Bg6+', 'Kd8',
      'Bf4', 'b5', 'a4', 'Bb7', 'Re1', 'Nd5', 'Bg3', 'Kc8', 'axb5', 'cxb5',
      'Qd3', 'Bc6', 'Bf5', 'exf5', 'Rxe7', 'Bxe7', 'c4'
    ]
  },
  carlsen: {
    id: 'carlsen',
    label: 'Carlsen vs Nepo (WCC G6)',
    white: 'Magnus Carlsen (2855)',
    black: 'Ian Nepomniachtchi (2782)',
    playerColor: 'white',
    result: '1-0',
    moves: [
      'd4', 'Nf6', 'Nf3', 'd5', 'g3', 'e6', 'Bg2', 'Be7', 'O-O', 'O-O',
      'b3', 'c5', 'dxc5', 'Bxc5', 'c4', 'dxc4', 'Qc2', 'Qe7', 'Nbd2', 'Nc6',
      'Nxc4', 'b5', 'Nce5', 'Nb4', 'Qb2', 'Bb7', 'a3', 'Nc6', 'Nd3', 'Bb6',
      'Bg5', 'Rfd8', 'Bxf6', 'gxf6', 'Rac1', 'Nd4', 'Nxd4', 'Bxd4', 'Qa2', 'Bxg2'
    ]
  },
  immortal: {
    id: 'immortal',
    label: 'Kasparov vs Topalov (1999)',
    white: 'Garry Kasparov (2812)',
    black: 'Veselin Topalov (2700)',
    playerColor: 'white',
    result: '1-0',
    moves: [
      'e4', 'd6', 'd4', 'Nf6', 'Nc3', 'g6', 'Be3', 'Bg7', 'Qd2', 'c6',
      'f3', 'b5', 'Nge2', 'Nbd7', 'Bh6', 'Bxh6', 'Qxh6', 'Bb7', 'a3', 'e5',
      'O-O-O', 'Qe7', 'Kb1', 'a6', 'Nc1', 'O-O-O', 'Nb3', 'exd4', 'Rxd4', 'c5',
      'Rd1', 'Nb6', 'g3', 'Kb8', 'Na5', 'Ba8', 'Bh3', 'd5', 'Qf4+', 'Ka7',
      'Rhe1', 'd4', 'Nd5', 'Nbxd5', 'exd5', 'Qd6', 'Rxd4', 'cxd4', 'Re7+', 'Kb6',
      'Qxd4+', 'Kxa5', 'b4+', 'Ka4', 'Qc3', 'Qxd5', 'Ra7', 'Bb7', 'Rxb7', 'Qc4'
    ]
  }
};

function classifyMove(cpLoss) {
  if (cpLoss <= 0) return { name: 'Best', symbol: '★', color: '#10b981' };
  if (cpLoss <= 15) return { name: 'Excellent', symbol: '✓', color: '#06b6d4' };
  if (cpLoss <= 35) return { name: 'Good', symbol: '○', color: '#8b5cf6' };
  if (cpLoss <= 90) return { name: 'Inaccuracy', symbol: '?!', color: '#f59e0b' };
  if (cpLoss <= 250) return { name: 'Mistake', symbol: '?', color: '#f97316' };
  return { name: 'Blunder', symbol: '??', color: '#ef4444' };
}

function calculateAccuracy(cpLoss) {
  const accuracy = 103.1668 * Math.exp(-0.04354 * Math.abs(cpLoss)) - 3.1668;
  return Math.max(0, Math.min(100, Math.round(accuracy)));
}

export default function GameAnalysisPage() {
  const location = useLocation();

  const rawGameData = location.state;
  const [selectedPreset, setSelectedPreset] = useState(() => {
    if (rawGameData && (rawGameData.fen || (rawGameData.moves && rawGameData.moves.length > 0))) {
      return 'imported';
    }
    return 'kasparov';
  });
  const [customGameData, setCustomGameData] = useState(null);
  const [showPgnImporter, setShowPgnImporter] = useState(false);
  const [pgnInput, setPgnInput] = useState('');

  const gameData = useMemo(() => {
    if (customGameData) return customGameData;
    if (selectedPreset === 'imported' && rawGameData) {
      return rawGameData;
    }
    if (selectedPreset && SHOWCASE_GAMES[selectedPreset]) {
      return SHOWCASE_GAMES[selectedPreset];
    }
    if (rawGameData && (rawGameData.fen || (rawGameData.moves && rawGameData.moves.length > 0))) {
      return rawGameData;
    }
    return SHOWCASE_GAMES.kasparov;
  }, [customGameData, rawGameData, selectedPreset]);

  const [moves, setMoves] = useState([]);
  const [moveDetails, setMoveDetails] = useState([]);
  const [fens, setFens] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [game, setGame] = useState(new Chess());

  const [analysisMode, setAnalysisMode] = useState('stockfish');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [moveAnalysis, setMoveAnalysis] = useState([]);
  const [evalHistory, setEvalHistory] = useState([]);
  const [accuracy, setAccuracy] = useState({ white: 94, black: 81 });

  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef(null);

  const [boardOrientation, setBoardOrientation] = useState(gameData?.playerColor || 'white');
  const [copiedLabel, setCopiedLabel] = useState(null);

  // Synchronize board orientation when gameData updates
  useEffect(() => {
    if (gameData?.playerColor) {
      setBoardOrientation(gameData.playerColor);
    }
  }, [gameData]);

  const [variationMoves, setVariationMoves] = useState([]);
  const [inVariation, setInVariation] = useState(false);
  const [variationEval, setVariationEval] = useState(null);
  const [manualEval, setManualEval] = useState(null);

  const engineRef = useRef(null);
  const fensRef = useRef([]);
  const analysisRunIdRef = useRef(0);
  const {
    darkSquareColor,
    lightSquareColor,
    showNotation,
    pieceSet,
    animationSpeed,
    highlightColor
  } = useBoardCustomization();

  const currentFen = inVariation
    ? game.fen()
    : fens[currentIndex] || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  const currentEval = inVariation && variationEval !== null
    ? variationEval
    : evalHistory[currentIndex] !== undefined
    ? evalHistory[currentIndex]
    : manualEval !== null
    ? manualEval
    : 0;

  useEffect(() => {
    if (!gameData) return;

    // Invalidate running analysis when game data changes
    analysisRunIdRef.current++;
    setIsAnalyzing(false);
    setAnalysisComplete(false);
    setAnalysisProgress(0);
    setEvalHistory([]);
    setMoveAnalysis([]);
    setManualEval(null);

    const initialFen = gameData.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    let chess;
    try {
      chess = new Chess(initialFen);
    } catch (e) {
      console.warn('Failed to initialize chess with FEN:', initialFen, e);
      chess = new Chess();
    }

    const fenList = [chess.fen()];
    const moveList = [];
    const detailsList = [];

    if (Array.isArray(gameData.moves)) {
      for (const move of gameData.moves) {
        try {
          let result = null;
          if (typeof move === 'string') {
            try {
              result = chess.move(move);
            } catch {
              if (move.length >= 4) {
                const from = move.substring(0, 2);
                const to = move.substring(2, 4);
                const promotion = move.length > 4 ? move[4] : undefined;
                result = chess.move({ from, to, promotion });
              }
            }
          } else if (typeof move === 'object' && move !== null) {
            result = chess.move(move);
          }

          if (result) {
            moveList.push(result.san);
            fenList.push(chess.fen());
            detailsList.push({
              san: result.san,
              from: result.from,
              to: result.to,
              color: result.color
            });
          }
        } catch (e) {
          console.warn('Failed to parse move:', move, e.message);
        }
      }
    }

    setMoves(moveList);
    setMoveDetails(detailsList);
    setFens(fenList);
    fensRef.current = fenList;

    let startIdx = 0;
    if (typeof gameData.initialIndex === 'number') {
      startIdx = Math.max(0, Math.min(gameData.initialIndex, fenList.length - 1));
    } else if (gameData.fen && moveList.length > 0) {
      // In puzzles, move 0 is the opponent setup move, so puzzle position is at index 1
      startIdx = Math.min(1, fenList.length - 1);
    }

    setCurrentIndex(startIdx);
    setInVariation(false);
    setVariationMoves([]);
    setVariationEval(null);
    setGame(new Chess(fenList[startIdx] || fenList[0]));
  }, [gameData]);

  useEffect(() => {
    if (analysisMode === 'stockfish' && fens.length > 1 && moves.length > 0 && !isAnalyzing && !analysisComplete) {
      startAnalysis(fens, moves);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisMode, fens, moves, analysisComplete]);

  // Immediately evaluate currently active position so eval bar updates instantly
  useEffect(() => {
    let isCancelled = false;
    const evaluateCurrent = async () => {
      if (!currentFen) return;
      try {
        const engine = engineRef.current || (engineRef.current = await getStockfishService());
        const ev = await engine.evaluatePosition(currentFen, 12);
        if (!isCancelled) {
          if (inVariation) {
            setVariationEval(ev);
          } else {
            setManualEval(ev);
            // If evalHistory for currentIndex is not yet computed, update it immediately
            setEvalHistory(prev => {
              if (prev[currentIndex] === undefined) {
                const next = [...prev];
                next[currentIndex] = ev;
                return next;
              }
              return prev;
            });
          }
        }
      } catch (error) {
        console.error('Active position eval error:', error);
      }
    };
    evaluateCurrent();
    return () => { isCancelled = true; };
  }, [currentFen, inVariation, currentIndex]);

  const startAnalysis = async (fenList, moveList) => {
    const runId = ++analysisRunIdRef.current;
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    let engine = engineRef.current;
    try {
      if (!engine) {
        engine = await getStockfishService();
        engineRef.current = engine;
      }
    } catch (error) {
      console.warn('Stockfish init error:', error);
    }

    const evals = [];
    const analysis = [];
    let whiteAccuracySum = 0, blackAccuracySum = 0;
    let whiteMoveCount = 0, blackMoveCount = 0;

    for (let i = 0; i < fenList.length; i++) {
      if (analysisRunIdRef.current !== runId) return; // Stale run aborted

      try {
        const ev = engine ? await engine.evaluatePosition(fenList[i], 11) : 0;
        evals.push(ev);
      } catch {
        evals.push(0);
      }

      if (i > 0) {
        const evalBefore = evals[i - 1];
        const evalAfter = evals[i];
        const isWhiteMove = fenList[i - 1]?.split(' ')[1] === 'w';

        const cpLoss = Math.max(0, isWhiteMove
          ? (evalBefore - evalAfter) * 100
          : (evalAfter - evalBefore) * 100);

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

      // Stream updates to UI incrementally every move or every 2 moves
      setEvalHistory([...evals]);
      setMoveAnalysis([...analysis]);
      setAnalysisProgress(Math.round(((i + 1) / fenList.length) * 100));
    }

    if (analysisRunIdRef.current === runId) {
      setAccuracy({
        white: whiteMoveCount > 0 ? Math.round(whiteAccuracySum / whiteMoveCount) : 92,
        black: blackMoveCount > 0 ? Math.round(blackAccuracySum / blackMoveCount) : 80
      });
      setIsAnalyzing(false);
      setAnalysisComplete(true);
    }
  };

  const handleLoadCustomPgn = () => {
    if (!pgnInput.trim()) return;
    try {
      const chess = new Chess();
      const whiteMatch = pgnInput.match(/\[White\s+"([^"]+)"\]/);
      const blackMatch = pgnInput.match(/\[Black\s+"([^"]+)"\]/);

      let moveList = [];
      if (typeof chess.loadPgn === 'function') {
        chess.loadPgn(pgnInput);
        moveList = chess.history();
      }
      if (moveList.length === 0) {
        const cleaned = pgnInput
          .replace(/\[[^\]]*\]/g, ' ')
          .replace(/\{[^}]*\}/g, ' ')
          .replace(/\d+\.+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const tokens = cleaned.split(' ').filter((t) => t && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(t));
        const g2 = new Chess();
        for (const tk of tokens) {
          try {
            const m = g2.move(tk, { sloppy: true });
            if (m) moveList.push(m.san);
          } catch {
            break;
          }
        }
      }

      if (moveList.length > 0) {
        setAnalysisComplete(false);
        setCustomGameData({
          id: 'custom',
          label: 'Custom PGN Analysis',
          white: whiteMatch?.[1] || 'White Player',
          black: blackMatch?.[1] || 'Black Player',
          playerColor: 'white',
          result: '*',
          moves: moveList,
        });
        setShowPgnImporter(false);
      }
    } catch (e) {
      console.error('Custom PGN parse error:', e);
    }
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
    setGame(new Chess(currentFens[clamped]));
  }, [inVariation]);

  const gotoStart = useCallback(() => gotoMove(0), [gotoMove]);
  const gotoEnd = useCallback(() => gotoMove(fensRef.current.length - 1), [gotoMove]);
  const prevMove = useCallback(() => gotoMove(currentIndex - 1), [currentIndex, gotoMove]);
  const nextMove = useCallback(() => gotoMove(currentIndex + 1), [currentIndex, gotoMove]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      clearInterval(playIntervalRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      playIntervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          const currentFens = fensRef.current;
          if (prev >= currentFens.length - 1) {
            clearInterval(playIntervalRef.current);
            setIsPlaying(false);
            return prev;
          }
          const nextIdx = prev + 1;
          setGame(new Chess(currentFens[nextIdx]));
          return nextIdx;
        });
      }, 800);
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, []);

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
        setVariationMoves((prev) => [...prev, move.san]);
        setGame(gameCopy);
        analyzeVariation(gameCopy.fen());
        return true;
      }
    } catch {
      // ignore invalid drop
    }
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
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
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
  }, [prevMove, nextMove, gotoStart, gotoEnd, togglePlay]);

  const evalToHeight = (evalNum) => {
    if (typeof evalNum !== 'number' || isNaN(evalNum)) return "50%";
    if (evalNum >= 99) return boardOrientation === 'black' ? "0%" : "100%";
    if (evalNum <= -99) return boardOrientation === 'black' ? "100%" : "0%";
    const winProb = 50 + 50 * (2 / (1 + Math.exp(-0.35 * evalNum)) - 1);
    const oriented = boardOrientation === 'black' ? (100 - winProb) : winProb;
    const clamped = Math.max(3, Math.min(97, oriented));
    return `${clamped.toFixed(1)}%`;
  };

  const copyText = (txt, label) => {
    navigator.clipboard.writeText(txt);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  const currentMoveAnalysis = currentIndex > 0 ? moveAnalysis[currentIndex - 1] : null;
  const opponentName = gameData.opponentName || gameData.botName || gameData.black || gameData.blackName || 'Garry Kasparov (2785)';
  const playerName = gameData.playerName || gameData.white || gameData.whiteName || 'Deep Blue (IBM AI)';

  // Dynamic square highlights for move from/to squares
  const customSquareStyles = useMemo(() => {
    const styles = {};
    if (currentIndex > 0 && moveDetails[currentIndex - 1]) {
      const { from, to } = moveDetails[currentIndex - 1];
      if (from && to) {
        styles[from] = { backgroundColor: highlightColor || 'rgba(255, 215, 0, 0.35)' };
        styles[to] = { backgroundColor: highlightColor || 'rgba(255, 215, 0, 0.35)' };
      }
    }
    return styles;
  }, [currentIndex, moveDetails, highlightColor]);

  // Group moves into pairs for 2-Column FIDE Scoresheet
  const movePairs = useMemo(() => {
    const pairs = [];
    if (moves.length === 0) return pairs;

    const initialTurn = fens[0] ? fens[0].split(' ')[1] : 'w';
    let moveIdx = 0;
    let moveNum = 1;

    // If game/puzzle started on Black's turn
    if (initialTurn === 'b') {
      pairs.push({
        moveNumber: moveNum++,
        white: null,
        black: {
          san: moves[0],
          index: 1,
          analysis: moveAnalysis[0] || null
        }
      });
      moveIdx = 1;
    }

    for (; moveIdx < moves.length; moveIdx += 2) {
      pairs.push({
        moveNumber: moveNum++,
        white: {
          san: moves[moveIdx],
          index: moveIdx + 1,
          analysis: moveAnalysis[moveIdx] || null,
        },
        black: moves[moveIdx + 1]
          ? {
              san: moves[moveIdx + 1],
              index: moveIdx + 2,
              analysis: moveAnalysis[moveIdx + 1] || null,
            }
          : null,
      });
    }
    return pairs;
  }, [moves, fens, moveAnalysis]);

  // Compute Move Classification Breakdown Matrix (White vs Black)
  const classificationCounts = useMemo(() => {
    const categories = [
      { key: 'Best', color: '#10b981', symbol: '★' },
      { key: 'Excellent', color: '#06b6d4', symbol: '✓' },
      { key: 'Good', color: '#8b5cf6', symbol: '○' },
      { key: 'Inaccuracy', color: '#f59e0b', symbol: '?!' },
      { key: 'Mistake', color: '#f97316', symbol: '?' },
      { key: 'Blunder', color: '#ef4444', symbol: '??' },
    ];
    const counts = {};
    categories.forEach((c) => {
      counts[c.key] = { white: 0, black: 0, ...c };
    });
    moveAnalysis.forEach((ma) => {
      const cat = ma?.classification?.name;
      if (cat && counts[cat]) {
        if (ma.isWhiteMove) counts[cat].white += 1;
        else counts[cat].black += 1;
      }
    });
    return categories.map((c) => counts[c.key]);
  }, [moveAnalysis]);

  const formattedEval =
    currentEval >= 99
      ? '+M'
      : currentEval <= -99
      ? '-M'
      : (currentEval >= 0 ? '+' : '') + currentEval.toFixed(2);

  return (
    <div className="game-analysis-page cp-subpage">
      <PageAmbient watermark="STOCKFISH" theme="classic" />

      <PageHeader
        badge={
          gameData?.source === 'puzzle'
            ? 'TACTICAL PUZZLE ANALYSIS // DEPTH 18 NNUE'
            : 'STOCKFISH 17 NNUE · DEPTH 18 CENTIPAWN WORKSTATION'
        }
        title={gameData?.source === 'puzzle' ? 'Tactical Puzzle' : 'Grandmaster'}
        accent={gameData?.source === 'puzzle' ? 'Studio' : 'Telemetry Lab'}
        subtitle={
          gameData?.source === 'puzzle'
            ? 'Analyzing tactical solution line, defensive responses, and alternative variations.'
            : 'Inspect centipawn loss, move classification matrices, interactive board variations, and engine evaluation curves.'
        }
        theme="classic"
        backTo={
          gameData?.source === 'puzzle'
            ? '/puzzles'
            : gameData?.source === 'online'
            ? '/play/online'
            : gameData?.source === 'bot' || gameData?.botName
            ? '/bots'
            : '/tournaments'
        }
        backLabel={
          gameData?.source === 'puzzle'
            ? 'Puzzles'
            : gameData?.source === 'online'
            ? 'Online Arena'
            : gameData?.source === 'bot' || gameData?.botName
            ? 'Neural Bots'
            : 'Tournaments'
        }
        rightElement={
          <div className="analysis-header-controls">
            <div className="analysis-mode-selector">
              <button
                type="button"
                className={`mode-btn ${analysisMode === 'manual' ? 'active' : ''}`}
                onClick={() => setAnalysisMode('manual')}
              >
                Manual Eval
              </button>
              <button
                type="button"
                className={`mode-btn ${analysisMode === 'stockfish' ? 'active' : ''}`}
                onClick={() => setAnalysisMode('stockfish')}
              >
                <Cpu size={13} />
                <span>Stockfish 17</span>
              </button>
            </div>
            <Link to="/customize" className="analysis-studio-link">
              Board Studio →
            </Link>
          </div>
        }
      />

      <div className="analysis-studio-wrap">
        {/* Top 4-Cell Telemetry Monolith Ribbon */}
        <div className="cp-console-window analysis-hud-ribbon">
          <div className="analysis-hud-cell">
            <span className="a-hud-code">SYS-01 // WHITE PRECISION</span>
            <div className="a-hud-val-row">
              <span className="a-hud-val emerald">{accuracy.white}%</span>
              <span className="a-hud-chip">CAPS</span>
            </div>
            <span className="a-hud-lbl">{playerName}</span>
          </div>

          <div className="analysis-hud-cell">
            <span className="a-hud-code">SYS-02 // BLACK PRECISION</span>
            <div className="a-hud-val-row">
              <span className="a-hud-val violet">{accuracy.black}%</span>
              <span className="a-hud-chip">CAPS</span>
            </div>
            <span className="a-hud-lbl">{opponentName}</span>
          </div>

          <div className="analysis-hud-cell">
            <span className="a-hud-code">SYS-03 // VECTOR EVALUATION</span>
            <div className="a-hud-val-row">
              <span className="a-hud-val cyan">{formattedEval}</span>
              {currentMoveAnalysis && (
                <span
                  className="a-hud-move-badge"
                  style={{
                    color: currentMoveAnalysis.classification.color,
                    borderColor: currentMoveAnalysis.classification.color,
                  }}
                >
                  {currentMoveAnalysis.classification.symbol} {currentMoveAnalysis.classification.name}
                </span>
              )}
            </div>
            <span className="a-hud-lbl">
              Ply {currentIndex} of {moves.length} · {currentIndex > 0 ? moves[currentIndex - 1] : 'Opening Position'}
            </span>
          </div>

          <div className="analysis-hud-cell">
            <span className="a-hud-code">SYS-04 // ENGINE HORIZON</span>
            <div className="a-hud-val-row">
              <span className="a-hud-val gold">
                {isAnalyzing ? `${analysisProgress}%` : 'DEPTH 18'}
              </span>
              <span className="a-hud-chip">WASM</span>
            </div>
            <span className="a-hud-lbl">
              {isAnalyzing ? 'Computing game tree...' : 'NNUE Evaluation Ready'}
            </span>
          </div>
        </div>

        {/* Dual-Console Workstation Grid */}
        <div className="analysis-content">
          {/* LEFT CONSOLE: Interactive Chessboard + Vertical Eval Bar + Transport Dock */}
          <div className="cp-console-window analysis-board-console">
            <div className="cp-window-topbar">
              <div className="analysis-window-left">
                <div className="cp-window-dots">
                  <span className="cp-window-dot red" />
                  <span className="cp-window-dot amber" />
                  <span className="cp-window-dot green" />
                </div>
                <span className="cp-window-title">
                  <span>POSITION VIEWER // DRAG PIECES TO EXPLORE VARIATIONS</span>
                </span>
              </div>

              <div className="analysis-preset-pills">
                {rawGameData && (
                  <button
                    type="button"
                    className={`preset-game-btn ${selectedPreset === 'imported' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedPreset('imported');
                      setCustomGameData(null);
                      setAnalysisComplete(false);
                    }}
                  >
                    <Sparkles size={11} />
                    <span>
                      {rawGameData.source === 'puzzle'
                        ? 'Tactical Puzzle'
                        : rawGameData.event || 'Imported Game'}
                    </span>
                  </button>
                )}
                {Object.values(SHOWCASE_GAMES).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`preset-game-btn ${
                      !customGameData && selectedPreset === preset.id ? 'active' : ''
                    }`}
                    onClick={() => {
                      setCustomGameData(null);
                      setAnalysisComplete(false);
                      setSelectedPreset(preset.id);
                    }}
                  >
                    <Sparkles size={11} />
                    <span>{preset.label}</span>
                  </button>
                ))}
                <button
                  type="button"
                  className={`preset-game-btn import-btn ${showPgnImporter ? 'active' : ''}`}
                  onClick={() => setShowPgnImporter((v) => !v)}
                >
                  <Code2 size={12} />
                  <span>{showPgnImporter ? 'Close PGN' : 'Import PGN'}</span>
                </button>
              </div>
            </div>

            {showPgnImporter && (
              <div className="analysis-pgn-drawer">
                <textarea
                  className="analysis-pgn-textarea"
                  rows={3}
                  placeholder='Paste PGN here (e.g. 1. e4 e5 2. Nf3 Nc6 3. Bb5 a6...)'
                  value={pgnInput}
                  onChange={(e) => setPgnInput(e.target.value)}
                />
                <div className="analysis-pgn-drawer-actions">
                  <button type="button" className="pgn-load-btn" onClick={handleLoadCustomPgn}>
                    Analyze PGN
                  </button>
                  <button type="button" className="pgn-clear-btn" onClick={() => setPgnInput('')}>
                    Clear
                  </button>
                </div>
              </div>
            )}

            <div className="analysis-board-stage-wrap">
              {/* Top Player Scorebug */}
              <div className="analysis-player-strip">
                <div className="ap-left">
                  <span
                    className={`ap-stone ${
                      boardOrientation === 'white' ? 'black' : 'white'
                    }`}
                  />
                  <span className="ap-name">
                    {boardOrientation === 'white' ? opponentName : playerName}
                  </span>
                </div>
                <span className="ap-acc-pill">
                  {boardOrientation === 'white' ? accuracy.black : accuracy.white}% ACCURACY
                </span>
              </div>

              {/* Board + Vertical Centipawn Bar */}
              <div className="board-with-eval">
                <div className="analysis-eval-bar">
                  <div className="eval-bar-fill" style={{ height: evalToHeight(currentEval) }} />
                  <div className="eval-bar-midline" />
                  <span className="eval-value">{formattedEval}</span>
                </div>

                <div className="analysis-board-container">
                  <Chessboard
                    key={`board-${currentIndex}-${inVariation}-${boardOrientation}`}
                    id="analysis-board"
                    options={{
                      position: currentFen,
                      onPieceDrop: onDrop,
                      animationDurationInMs: animationSpeed,
                      boardOrientation: boardOrientation,
                      allowDragging: true,
                      showNotation,
                      darkSquareStyle: { backgroundColor: darkSquareColor || '#334155' },
                      lightSquareStyle: { backgroundColor: lightSquareColor || '#cbd5e1' },
                      customSquareStyles,
                      pieces: getCustomPieces(pieceSet),
                      customPieces: getCustomPieces(pieceSet)
                    }}
                  />
                  {inVariation && (
                    <div className="variation-indicator">
                      <span className="var-label">
                        <GitBranch size={14} />
                        <span>Variation branch: {variationMoves.join(' ')}</span>
                      </span>
                      <button type="button" onClick={resetVariation}>
                        Return to Mainline
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Player Scorebug */}
              <div className="analysis-player-strip">
                <div className="ap-left">
                  <span
                    className={`ap-stone ${
                      boardOrientation === 'white' ? 'white' : 'black'
                    }`}
                  />
                  <span className="ap-name">
                    {boardOrientation === 'white' ? playerName : opponentName}
                  </span>
                </div>
                <span className="ap-acc-pill">
                  {boardOrientation === 'white' ? accuracy.white : accuracy.black}% ACCURACY
                </span>
              </div>

              {/* Transport & Orientation Dock */}
              <div className="analysis-transport-bar">
                <div className="analysis-controls">
                  <button type="button" onClick={gotoStart} title="Start (Home)">
                    <SkipBack size={16} />
                  </button>
                  <button type="button" onClick={prevMove} title="Previous (Left)">
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    className="play-toggle-btn"
                    onClick={togglePlay}
                    title="Play/Pause (Space)"
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button type="button" onClick={nextMove} title="Next (Right)">
                    <ChevronRight size={18} />
                  </button>
                  <button type="button" onClick={gotoEnd} title="End (End)">
                    <SkipForward size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setBoardOrientation((prev) => (prev === 'white' ? 'black' : 'white'))
                    }
                    title="Flip Board Orientation"
                  >
                    <RotateCw size={15} />
                  </button>
                </div>

                <div className="analysis-copy-group">
                  <button
                    type="button"
                    className="copy-chip-btn"
                    onClick={() => copyText(currentFen, 'FEN')}
                  >
                    {copiedLabel === 'FEN' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedLabel === 'FEN' ? 'FEN Copied' : 'FEN'}</span>
                  </button>
                  <button
                    type="button"
                    className="copy-chip-btn"
                    onClick={() => copyText(moves.join(' '), 'PGN')}
                  >
                    {copiedLabel === 'PGN' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedLabel === 'PGN' ? 'PGN Copied' : 'PGN'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT CONSOLE: Telemetry Curve, Move Quality Matrix, & 2-Column FIDE Scoresheet */}
          <div className="cp-console-window analysis-telemetry-console">
            <div className="cp-window-topbar">
              <span className="cp-window-title">
                <Activity size={14} />
                <span>TELEMETRY & FIDE SCORESHEET ({moves.length} PLIES)</span>
              </span>
              <span className="result-tag-pill">{gameData.result || '1-0'} · VERIFIED</span>
            </div>

            <div className="analysis-telemetry-body">
              {/* 1. Engine Centipawn Flow Curve */}
              {evalHistory.length > 0 && (
                <div className="eval-graph-container">
                  <div className="subpanel-head">
                    <span>CENTIPAWN ADVANTAGE CURVE</span>
                    <span className="subpanel-hint">Click curve to jump</span>
                  </div>
                  <div className="eval-graph-wrapper" style={{ width: '100%', height: 135 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={evalHistory.map((ev, i) => ({
                          move: i,
                          eval: Math.max(-10, Math.min(10, ev)),
                        }))}
                        margin={{ top: 8, right: 4, left: -24, bottom: 0 }}
                        onClick={(data) => {
                          if (data && data.activeLabel !== undefined) {
                            gotoMove(data.activeLabel);
                          }
                        }}
                      >
                        <defs>
                          <linearGradient id="evalGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.65} />
                            <stop offset="50%" stopColor="#06b6d4" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#a855f7" stopOpacity={0.5} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="move" hide />
                        <YAxis domain={[-10, 10]} hide />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const val = payload[0].value;
                              return (
                                <div className="analysis-chart-tooltip">
                                  <span>Ply {label}</span>
                                  <strong style={{ color: val >= 0 ? '#10b981' : '#ef4444' }}>
                                    {val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                                  </strong>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine y={0} stroke="rgba(255,255,255,0.22)" strokeDasharray="3 3" />
                        <Area
                          type="monotone"
                          dataKey="eval"
                          stroke="#10b981"
                          fill="url(#evalGrad)"
                          strokeWidth={2}
                          activeDot={{ r: 4, stroke: '#fff' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* 2. Move Classification Breakdown Matrix */}
              <div className="classification-matrix">
                <div className="subpanel-head">
                  <span>WHITE</span>
                  <span>MOVE CLASSIFICATION</span>
                  <span>BLACK</span>
                </div>
                <div className="classification-rows">
                  {classificationCounts.map((item) => (
                    <div key={item.key} className="class-matrix-row">
                      <span className="class-count white-count">{item.white}</span>
                      <div className="class-center-label" style={{ color: item.color }}>
                        <span className="class-sym">{item.symbol}</span>
                        <span>{item.key}</span>
                      </div>
                      <span className="class-count black-count">{item.black}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Paired 2-Column FIDE Scoresheet */}
              <div className="analysis-scoresheet">
                <div className="a-scoresheet-head">
                  <span>#</span>
                  <span>WHITE MOVE</span>
                  <span>BLACK MOVE</span>
                </div>
                <div className="a-scoresheet-body">
                  {movePairs.map((pair) => {
                    const wActive =
                      pair.white && currentIndex === pair.white.index && !inVariation;
                    const bActive =
                      pair.black && currentIndex === pair.black.index && !inVariation;

                    return (
                      <div key={pair.moveNumber} className="a-scoresheet-row">
                        <span className="a-move-num">{pair.moveNumber}.</span>

                        {pair.white ? (
                          <button
                            type="button"
                            className={`a-ply-btn ${wActive ? 'active' : ''}`}
                            onClick={() => gotoMove(pair.white.index)}
                          >
                            <span className="a-ply-san">{pair.white.san}</span>
                            {pair.white.analysis && (
                              <span
                                className="a-ply-badge"
                                style={{ color: pair.white.analysis.classification.color }}
                                title={`${pair.white.analysis.classification.name}`}
                              >
                                {pair.white.analysis.classification.symbol}
                              </span>
                            )}
                          </button>
                        ) : (
                          <span className="a-ply-empty">...</span>
                        )}

                        {pair.black ? (
                          <button
                            type="button"
                            className={`a-ply-btn ${bActive ? 'active' : ''}`}
                            onClick={() => gotoMove(pair.black.index)}
                          >
                            <span className="a-ply-san">{pair.black.san}</span>
                            {pair.black.analysis && (
                              <span
                                className="a-ply-badge"
                                style={{ color: pair.black.analysis.classification.color }}
                                title={`${pair.black.analysis.classification.name}`}
                              >
                                {pair.black.analysis.classification.symbol}
                              </span>
                            )}
                          </button>
                        ) : (
                          <span className="a-ply-empty">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Compact FEN String Readout */}
              <div className="analysis-fen-strip">
                <span className="fen-strip-kicker">FEN</span>
                <code className="fen-strip-code">{currentFen}</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
