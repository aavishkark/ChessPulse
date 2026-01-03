import { useState, useEffect, useCallback, useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import './PuzzleBoard.css';

const PuzzleBoard = ({
    puzzle,
    onSolve,
    onFail,
    onMoveAttempt,
    showHint = false
}) => {
    const [game, setGame] = useState(null);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [status, setStatus] = useState('playing');
    const [orientation, setOrientation] = useState('white');
    const [lastMove, setLastMove] = useState(null);
    const [showTurnOverlay, setShowTurnOverlay] = useState(false);

    useEffect(() => {
        if (!puzzle || !puzzle.fen) return;

        console.log('Puzzle FEN:', puzzle.fen);
        console.log('Current turn:', puzzle.fen.split(' ')[1]);
        console.log('Solution moves:', puzzle.moves);

        const newGame = new Chess(puzzle.fen);

        if (puzzle.moves && puzzle.moves.length > 0) {
            const firstMove = puzzle.moves[0];
            const moveResult = makeUciMove(newGame, firstMove);
            if (moveResult) {
                console.log('Auto-played opponent setup move:', firstMove);
                setLastMove({ from: firstMove.substring(0, 2), to: firstMove.substring(2, 4) });
                setCurrentMoveIndex(1);
            } else {
                console.error('Failed to auto-play setup move:', firstMove);
                setCurrentMoveIndex(0);
                setLastMove(null);
            }
        } else {
            setCurrentMoveIndex(0);
            setLastMove(null);
        }

        setGame(newGame);
        setStatus('playing');

        const setupTurn = new Chess(puzzle.fen).turn();
        setOrientation(setupTurn === 'w' ? 'black' : 'white');

        setShowTurnOverlay(true);
        const timer = setTimeout(() => setShowTurnOverlay(false), 1500);
        return () => clearTimeout(timer);
    }, [puzzle]);

    const makeUciMove = (chessGame, uciMove) => {
        if (!uciMove || uciMove.length < 4) return null;
        const from = uciMove.substring(0, 2);
        const to = uciMove.substring(2, 4);
        const promotion = uciMove.length > 4 ? uciMove[4] : undefined;

        return chessGame.move({ from, to, promotion });
    };

    const parseMove = (moveStr) => {
        if (!moveStr || moveStr.length < 4) return null;
        return {
            from: moveStr.substring(0, 2),
            to: moveStr.substring(2, 4)
        };
    };

    const onDrop = useCallback((moveData) => {
        if (status !== 'playing' || !game || !puzzle) return false;

        const sourceSquare = moveData?.sourceSquare || moveData?.from;
        const targetSquare = moveData?.targetSquare || moveData?.to;
        const piece = moveData?.piece;

        console.log('onDrop received:', moveData);
        console.log('Extracted: from=', sourceSquare, 'to=', targetSquare);

        if (!sourceSquare || !targetSquare) {
            console.error('Invalid move data:', moveData);
            return false;
        }

        if (sourceSquare === targetSquare) {
            return false;
        }

        const expectedMove = puzzle.moves[currentMoveIndex];
        if (!expectedMove) return false;

        const moveStr = sourceSquare + targetSquare;
        const isPawn = piece?.toLowerCase?.().includes('p') || String(piece)?.toLowerCase?.().includes('p');
        const isPromotion = isPawn && (targetSquare[1] === '8' || targetSquare[1] === '1');
        const promotion = isPromotion ? 'q' : undefined;

        const expectedMoveStr = expectedMove.substring(0, 4);
        const playerMoveWithPromo = promotion ? moveStr + promotion : moveStr;

        console.log('Player move:', moveStr, 'Expected:', expectedMoveStr, 'Full expected:', expectedMove);

        if (moveStr === expectedMoveStr || playerMoveWithPromo === expectedMove) {
            try {
                const move = game.move({
                    from: sourceSquare,
                    to: targetSquare,
                    promotion: promotion || expectedMove[4]
                });

                if (!move) {
                    console.log('chess.js rejected the move');
                    return false;
                }

                console.log('Move accepted!');
                setGame(new Chess(game.fen()));
                setLastMove({ from: sourceSquare, to: targetSquare });

                const nextMoveIndex = currentMoveIndex + 1;
                setCurrentMoveIndex(nextMoveIndex);

                if (onMoveAttempt) onMoveAttempt(true);

                if (nextMoveIndex >= puzzle.moves.length) {
                    setStatus('solved');
                    if (onSolve) onSolve();
                    return true;
                }

                setTimeout(() => {
                    const opponentMove = puzzle.moves[nextMoveIndex];
                    if (opponentMove) {
                        const moveResult = makeUciMove(game, opponentMove);
                        if (moveResult) {
                            setGame(new Chess(game.fen()));
                            setCurrentMoveIndex(nextMoveIndex + 1);
                            setLastMove({ from: opponentMove.substring(0, 2), to: opponentMove.substring(2, 4) });
                        }
                    }
                }, 300);

                return true;
            } catch (err) {
                console.error('Invalid move:', err);
                return false;
            }
        } else {
            console.log('Move mismatch! You played:', moveStr, 'but expected:', expectedMoveStr);
            setStatus('failed');
            if (onMoveAttempt) onMoveAttempt(false);
            if (onFail) onFail();
            return false;
        }
    }, [game, puzzle, currentMoveIndex, status, onSolve, onFail, onMoveAttempt]);

    const showSolution = useCallback(() => {
        if (!game || !puzzle) return;

        let currentGame = new Chess(puzzle.fen);
        let i = 0;

        const playNextMove = () => {
            if (i >= puzzle.moves.length) {
                setStatus('solved');
                return;
            }

            const move = puzzle.moves[i];
            const result = makeUciMove(currentGame, move);
            if (result) {
                setGame(new Chess(currentGame.fen()));
                setLastMove({ from: move.substring(0, 2), to: move.substring(2, 4) });
                i++;
                setTimeout(playNextMove, 800);
            }
        };

        setStatus('showing');
        playNextMove();
    }, [game, puzzle]);

    const retryPuzzle = useCallback(() => {
        if (!puzzle) return;
        const newGame = new Chess(puzzle.fen);

        if (puzzle.moves && puzzle.moves.length > 0) {
            const firstMove = puzzle.moves[0];
            const moveResult = makeUciMove(newGame, firstMove);
            if (moveResult) {
                setLastMove({ from: firstMove.substring(0, 2), to: firstMove.substring(2, 4) });
                setCurrentMoveIndex(1);
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
    }, [puzzle]);

    const customSquareStyles = useMemo(() => {
        const styles = {};

        if (lastMove) {
            styles[lastMove.from] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
            styles[lastMove.to] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
        }

        if (showHint && puzzle?.moves?.[currentMoveIndex]) {
            const hintMove = puzzle.moves[currentMoveIndex];
            const from = hintMove.substring(0, 2);
            styles[from] = {
                ...styles[from],
                boxShadow: 'inset 0 0 0 3px rgba(0, 255, 0, 0.7)'
            };
        }

        return styles;
    }, [lastMove, showHint, puzzle, currentMoveIndex]);

    const playerColor = orientation === 'white' ? 'White' : 'Black';
    const movesRemaining = puzzle ? puzzle.moves.length - currentMoveIndex : 0;
    const totalMoves = puzzle ? Math.ceil(puzzle.moves.length / 2) : 0;
    const currentPlayerMove = Math.ceil((currentMoveIndex + 1) / 2);

    if (!game) {
        return (
            <div className="puzzle-board-loading">
                <div className="loading-spinner"></div>
                <p>Loading puzzle...</p>
            </div>
        );
    }

    return (
        <div className="puzzle-board-container">
            <div className={`puzzle-board ${status}`}>
                <Chessboard
                    id="puzzle-board"
                    options={{
                        position: game.fen(),
                        allowDragging: status === 'playing',
                        onPieceDrop: onDrop,
                        animationDurationInMs: 200,
                        boardOrientation: orientation,
                        squareStyles: customSquareStyles,
                        showNotation: true
                    }}
                />

                {showTurnOverlay && status === 'playing' && (
                    <div className="puzzle-overlay turn">
                        <div className={`turn-dot-large ${orientation}`}></div>
                        <div className="overlay-text">{playerColor} to play</div>
                    </div>
                )}

                {status === 'solved' && (
                    <div className="puzzle-overlay success">
                        <div className="overlay-icon">✓</div>
                        <div className="overlay-text">Puzzle Solved!</div>
                    </div>
                )}

                {status === 'failed' && (
                    <div className="puzzle-overlay failed">
                        <div className="overlay-icon">✗</div>
                        <div className="overlay-text">Wrong Move</div>
                    </div>
                )}
            </div>

            <div className="puzzle-controls">
                {status === 'playing' && (
                    <>
                        <button
                            className="puzzle-btn hint-btn"
                            onClick={() => {
                                const expectedMove = puzzle.moves[currentMoveIndex];
                                if (expectedMove) {
                                    const from = expectedMove.substring(0, 2);
                                    setLastMove({ from, to: from });
                                }
                            }}
                        >
                            Hint
                        </button>
                        <button className="puzzle-btn give-up-btn" onClick={showSolution}>
                            Show Solution
                        </button>
                    </>
                )}

                {(status === 'failed' || status === 'solved') && (
                    <button className="puzzle-btn retry-btn" onClick={retryPuzzle}>
                        Try Again
                    </button>
                )}
            </div>
        </div>
    );
};

export default PuzzleBoard;
