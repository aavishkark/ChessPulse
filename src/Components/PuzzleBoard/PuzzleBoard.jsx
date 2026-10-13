import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { useBoardCustomization } from '../../contexts/BoardCustomizationContext';
import { getCustomPieces } from '../../utils/pieceSets';
import { playSound, getMoveSound } from '../../utils/sounds';
import { Chess } from 'chess.js';
import {
  Sparkles,
  Lightbulb,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import './PuzzleBoard.css';

const PuzzleBoard = ({
  puzzle,
  onSolve,
  onFail,
  onMoveAttempt,
  showControls = true,
  autoAdvance = false,
  allowRetry = true
}) => {
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [status, setStatus] = useState('playing'); // 'playing' | 'solved' | 'failed' | 'showing'
  const [orientation, setOrientation] = useState('white');
  const [lastMove, setLastMove] = useState(null);
  const [hintSquare, setHintSquare] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [playedSanMoves, setPlayedSanMoves] = useState([]);
  const solutionTimerRef = useRef(null);

  const {
    darkSquareColor,
    lightSquareColor,
    showNotation,
    pieceSet,
    animationSpeed,
    highlightColor,
    soundEnabled,
    soundTheme
  } = useBoardCustomization();

  const makeUciMove = useCallback((chessGame, uciMove) => {
    if (!uciMove || uciMove.length < 4 || !chessGame) return null;
    const from = uciMove.substring(0, 2);
    const to = uciMove.substring(2, 4);
    const promotion = uciMove.length > 4 ? uciMove[4] : undefined;

    try {
      return chessGame.move({ from, to, promotion });
    } catch {
      return null;
    }
  }, []);

  // Initialize or reset puzzle
  useEffect(() => {
    if (solutionTimerRef.current) {
      clearTimeout(solutionTimerRef.current);
    }

    if (!puzzle || !puzzle.fen) return;

    const newGame = new Chess(puzzle.fen);
    const setupTurn = newGame.turn();
    // In puzzles, opponent makes the setup move (moves[0])
    // The player plays as the OPPOSITE of the setup turn
    const playerOrientation = setupTurn === 'w' ? 'black' : 'white';
    setOrientation(playerOrientation);

    const initialSans = [];

    if (puzzle.moves && puzzle.moves.length > 0) {
      const firstMove = puzzle.moves[0];
      const moveResult = makeUciMove(newGame, firstMove);
      if (moveResult) {
        setLastMove({
          from: firstMove.substring(0, 2),
          to: firstMove.substring(2, 4)
        });
        initialSans.push(moveResult.san);
        setCurrentMoveIndex(1);

        // Play initial setup move sound
        const soundType = getMoveSound(
          moveResult,
          !!moveResult.captured,
          newGame.isCheck(),
          moveResult.san.includes('O-'),
          !!moveResult.promotion
        );
        playSound(soundType, soundTheme, soundEnabled);
      } else {
        setCurrentMoveIndex(0);
        setLastMove(null);
      }
    } else {
      setCurrentMoveIndex(0);
      setLastMove(null);
    }

    setGame(newGame);
    setStatus('playing');
    setHintSquare(null);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setPlayedSanMoves(initialSans);

    return () => {
      if (solutionTimerRef.current) clearTimeout(solutionTimerRef.current);
    };
  }, [puzzle, makeUciMove, soundTheme, soundEnabled]);

  // Attempt move logic shared by drag-and-drop and click-to-move
  const attemptMove = useCallback(
    (sourceSquare, targetSquare, piece) => {
      if (status !== 'playing' || !game || !puzzle) return false;

      if (!sourceSquare || !targetSquare || sourceSquare === targetSquare) {
        return false;
      }

      const expectedMove = puzzle.moves?.[currentMoveIndex];
      if (!expectedMove) return false;

      const moveStr = sourceSquare + targetSquare;
      const isPawn =
        piece?.toLowerCase?.().includes('p') ||
        String(piece)?.toLowerCase?.().includes('p') ||
        game.get(sourceSquare)?.type === 'p';
      const isPromotion =
        isPawn && (targetSquare[1] === '8' || targetSquare[1] === '1');
      const promotion = isPromotion ? 'q' : undefined;

      const expectedMoveStr = expectedMove.substring(0, 4);
      const playerMoveWithPromo = promotion ? moveStr + promotion : moveStr;

      if (moveStr === expectedMoveStr || playerMoveWithPromo === expectedMove) {
        try {
          const move = game.move({
            from: sourceSquare,
            to: targetSquare,
            promotion: promotion || expectedMove[4]
          });

          if (!move) return false;

          // Sound effect
          const soundType = getMoveSound(
            move,
            !!move.captured,
            game.isCheck(),
            move.san.includes('O-'),
            !!move.promotion
          );
          playSound(soundType, soundTheme, soundEnabled);

          const updatedGame = new Chess(game.fen());
          setGame(updatedGame);
          setLastMove({ from: sourceSquare, to: targetSquare });
          setHintSquare(null);
          setPlayedSanMoves((prev) => [...prev, move.san]);

          const nextMoveIndex = currentMoveIndex + 1;
          setCurrentMoveIndex(nextMoveIndex);

          if (onMoveAttempt) onMoveAttempt(true);

          // Check if sequence is complete
          if (nextMoveIndex >= puzzle.moves.length) {
            setStatus('solved');
            playSound('gameEnd', soundTheme, soundEnabled);
            if (onSolve) onSolve();
            return true;
          }

          // Opponent replies
          solutionTimerRef.current = setTimeout(() => {
            const opponentMove = puzzle.moves[nextMoveIndex];
            if (opponentMove) {
              const moveResult = makeUciMove(updatedGame, opponentMove);
              if (moveResult) {
                const afterOpponent = new Chess(updatedGame.fen());
                setGame(afterOpponent);
                setCurrentMoveIndex(nextMoveIndex + 1);
                setLastMove({
                  from: opponentMove.substring(0, 2),
                  to: opponentMove.substring(2, 4)
                });
                setPlayedSanMoves((prev) => [...prev, moveResult.san]);

                const oppSound = getMoveSound(
                  moveResult,
                  !!moveResult.captured,
                  afterOpponent.isCheck(),
                  moveResult.san.includes('O-'),
                  !!moveResult.promotion
                );
                playSound(oppSound, soundTheme, soundEnabled);
              }
            }
          }, 320);

          return true;
        } catch {
          return false;
        }
      } else {
        // Wrong move
        setStatus('failed');
        if (onMoveAttempt) onMoveAttempt(false);
        if (onFail) onFail();
        return false;
      }
    },
    [
      status,
      game,
      puzzle,
      currentMoveIndex,
      makeUciMove,
      soundTheme,
      soundEnabled,
      onMoveAttempt,
      onSolve,
      onFail
    ]
  );

  // Drag and drop callback
  const onDrop = useCallback(
    (moveData) => {
      const sourceSquare = moveData?.sourceSquare || moveData?.from;
      const targetSquare = moveData?.targetSquare || moveData?.to;
      const piece = moveData?.piece;
      setSelectedSquare(null);
      setPossibleMoves([]);
      return attemptMove(sourceSquare, targetSquare, piece);
    },
    [attemptMove]
  );

  // Click-to-move callback
  const onSquareClick = useCallback(
    (square) => {
      if (status !== 'playing' || !game || !puzzle) return;

      // If no piece is selected yet
      if (!selectedSquare) {
        const piece = game.get(square);
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
          const legalMoves = game.moves({ square, verbose: true });
          setPossibleMoves(legalMoves.map((m) => m.to));
        }
        return;
      }

      // If clicked the same square, deselect
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setPossibleMoves([]);
        return;
      }

      // If clicked another piece of the current turn, switch selection
      const clickedPiece = game.get(square);
      if (clickedPiece && clickedPiece.color === game.turn()) {
        setSelectedSquare(square);
        const legalMoves = game.moves({ square, verbose: true });
        setPossibleMoves(legalMoves.map((m) => m.to));
        return;
      }

      // Otherwise attempt move from selectedSquare to square
      const from = selectedSquare;
      setSelectedSquare(null);
      setPossibleMoves([]);
      attemptMove(from, square);
    },
    [status, game, puzzle, selectedSquare, attemptMove]
  );

  // Show Solution Walkthrough
  const showSolution = useCallback(() => {
    if (!puzzle || !puzzle.fen) return;
    setStatus('showing');
    setSelectedSquare(null);
    setPossibleMoves([]);
    setHintSquare(null);

    const replayGame = new Chess(puzzle.fen);
    let step = 0;
    const replayMoves = puzzle.moves || [];
    const sans = [];

    const playStep = () => {
      if (step >= replayMoves.length) {
        setStatus('solved');
        return;
      }

      const uci = replayMoves[step];
      const result = makeUciMove(replayGame, uci);
      if (result) {
        const newFenGame = new Chess(replayGame.fen());
        setGame(newFenGame);
        setLastMove({
          from: uci.substring(0, 2),
          to: uci.substring(2, 4)
        });
        sans.push(result.san);
        setPlayedSanMoves([...sans]);

        const soundType = getMoveSound(
          result,
          !!result.captured,
          newFenGame.isCheck(),
          result.san.includes('O-'),
          !!result.promotion
        );
        playSound(soundType, soundTheme, soundEnabled);

        step++;
        solutionTimerRef.current = setTimeout(playStep, 680);
      }
    };

    playStep();
  }, [puzzle, makeUciMove, soundTheme, soundEnabled]);

  // Retry Puzzle
  const retryPuzzle = useCallback(() => {
    if (!puzzle || !puzzle.fen) return;
    if (solutionTimerRef.current) clearTimeout(solutionTimerRef.current);

    const resetGame = new Chess(puzzle.fen);
    const initialSans = [];

    if (puzzle.moves && puzzle.moves.length > 0) {
      const firstMove = puzzle.moves[0];
      const moveResult = makeUciMove(resetGame, firstMove);
      if (moveResult) {
        setLastMove({
          from: firstMove.substring(0, 2),
          to: firstMove.substring(2, 4)
        });
        initialSans.push(moveResult.san);
        setCurrentMoveIndex(1);
      }
    }

    setGame(resetGame);
    setStatus('playing');
    setHintSquare(null);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setPlayedSanMoves(initialSans);
  }, [puzzle, makeUciMove]);

  // Give Tactical Hint
  const handleHint = useCallback(() => {
    if (status !== 'playing' || !puzzle?.moves?.[currentMoveIndex]) return;
    const nextExpected = puzzle.moves[currentMoveIndex];
    const fromSquare = nextExpected.substring(0, 2);
    setHintSquare(fromSquare);
  }, [status, puzzle, currentMoveIndex]);

  // Navigate to Analysis Studio
  const handleAnalyzeInStudio = useCallback(() => {
    if (!puzzle?.fen) return;
    navigate('/analysis', {
      state: {
        fen: puzzle.fen,
        moves: puzzle.moves,
        playerColor: orientation,
        white: orientation === 'white' ? `Tactical Puzzle (${puzzle.rating || '—'})` : 'Opponent',
        black: orientation === 'black' ? `Tactical Puzzle (${puzzle.rating || '—'})` : 'Opponent',
        whiteName: orientation === 'white' ? 'Tactical Puzzle' : 'Opponent',
        blackName: orientation === 'black' ? 'Tactical Puzzle' : 'Opponent',
        event: `Puzzle ${puzzle.id ? '#' + puzzle.id : ''} (Rating ${puzzle.rating || '—'})`,
        source: 'puzzle',
        initialIndex:
          typeof currentMoveIndex === 'number' && currentMoveIndex > 0
            ? currentMoveIndex
            : puzzle.moves && puzzle.moves.length > 0
            ? 1
            : 0
      }
    });
  }, [puzzle, orientation, currentMoveIndex, navigate]);

  // Dynamic Square Styles (lastMove, selectedSquare, hint, legal moves)
  const highlightedSquares = useMemo(() => {
    const styles = {};

    if (lastMove) {
      styles[lastMove.from] = {
        backgroundColor: highlightColor || 'rgba(255, 215, 0, 0.35)'
      };
      styles[lastMove.to] = {
        backgroundColor: highlightColor || 'rgba(255, 215, 0, 0.35)'
      };
    }

    if (selectedSquare) {
      styles[selectedSquare] = {
        ...styles[selectedSquare],
        boxShadow: 'inset 0 0 0 3px #fbbf24',
        backgroundColor: 'rgba(251, 191, 36, 0.4)'
      };
    }

    if (hintSquare) {
      styles[hintSquare] = {
        ...styles[hintSquare],
        boxShadow: 'inset 0 0 0 4px #10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.35)'
      };
    }

    possibleMoves.forEach((sq) => {
      styles[sq] = {
        ...styles[sq],
        background:
          'radial-gradient(circle, rgba(251, 191, 36, 0.8) 22%, transparent 26%)'
      };
    });

    return styles;
  }, [lastMove, selectedSquare, hintSquare, possibleMoves, highlightColor]);

  if (!game) {
    return (
      <div className="puzzle-board-loading">
        <div className="loading-spinner" />
        <p>Initializing tactical combination...</p>
      </div>
    );
  }

  const playerColor = orientation === 'white' ? 'White' : 'Black';

  return (
    <div className="puzzle-board-container">
      {/* Top Telemetry Info Header */}
      <div className="puzzle-turn-strip">
        <div className="turn-indicator">
          <span className={`turn-stone ${orientation}`} />
          <span className="turn-text">
            {status === 'playing'
              ? `${playerColor} to play`
              : status === 'solved'
              ? 'Combination Complete'
              : status === 'failed'
              ? 'Tactical Blunder'
              : 'Demonstrating Solution'}
          </span>
        </div>

        {puzzle.themes && puzzle.themes.length > 0 && (
          <div className="puzzle-themes-chips">
            {puzzle.themes.slice(0, 3).map((theme) => (
              <span key={theme} className="puzzle-theme-tag">
                {theme}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Chessboard Stage with Overlays */}
      <div className={`puzzle-board ${status}`}>
        <Chessboard
          id={`puzzle-board-${puzzle.id || 'active'}`}
          options={{
            position: game.fen(),
            onPieceDrop: onDrop,
            onSquareClick: onSquareClick,
            animationDurationInMs: animationSpeed,
            boardOrientation: orientation,
            arePremovesAllowed: false,
            squareStyles: highlightedSquares,
            showNotation,
            darkSquareStyle: { backgroundColor: darkSquareColor || '#334155' },
            lightSquareStyle: { backgroundColor: lightSquareColor || '#cbd5e1' },
            pieces: getCustomPieces(pieceSet),
            customPieces: getCustomPieces(pieceSet)
          }}
        />

        {status === 'solved' && (
          <div className="puzzle-overlay success">
            <CheckCircle2 size={46} className="overlay-icon success" />
            <div className="overlay-text">Sequence Solved</div>
            <span className="overlay-sub">Tactical precision confirmed</span>
          </div>
        )}

        {status === 'failed' && (
          <div className="puzzle-overlay failed">
            <XCircle size={46} className="overlay-icon failed" />
            <div className="overlay-text">Incorrect Move</div>
            <span className="overlay-sub">The defense refuted your line</span>
          </div>
        )}
      </div>

      {/* Played Algebraic Move Ribbon */}
      {playedSanMoves.length > 0 && (
        <div className="puzzle-moves-ribbon">
          <span className="moves-ribbon-label">LINE:</span>
          <div className="moves-chips-list">
            {playedSanMoves.map((san, idx) => (
              <span key={idx} className="move-san-chip">
                {san}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tactical Controls & Recovery Bar */}
      {showControls && (
        <div className="puzzle-controls-bar">
          {status === 'playing' && (
            <>
              <button
                type="button"
                className="puzzle-ctrl-btn hint-btn"
                onClick={handleHint}
              >
                <Lightbulb size={14} />
                <span>Hint</span>
              </button>

              <button
                type="button"
                className="puzzle-ctrl-btn solution-btn"
                onClick={showSolution}
              >
                <Play size={14} />
                <span>Show Solution</span>
              </button>
            </>
          )}

          {status === 'failed' && allowRetry && (
            <>
              <button
                type="button"
                className="puzzle-ctrl-btn retry-btn primary"
                onClick={retryPuzzle}
              >
                <RotateCcw size={14} />
                <span>Retry Move</span>
              </button>

              <button
                type="button"
                className="puzzle-ctrl-btn solution-btn"
                onClick={showSolution}
              >
                <Play size={14} />
                <span>Show Solution</span>
              </button>
            </>
          )}

          {status === 'solved' && (
            <div className="puzzle-solved-indicator">
              <Sparkles size={15} />
              <span>Great calculation! Ready for next puzzle.</span>
            </div>
          )}

          <button
            type="button"
            className="puzzle-ctrl-btn studio-btn"
            onClick={handleAnalyzeInStudio}
            title="Open position in Stockfish Analysis Studio"
          >
            <ExternalLink size={14} />
            <span>Analyze in Studio</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PuzzleBoard;
