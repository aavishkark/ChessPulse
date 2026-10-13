import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useBoardCustomization } from '../../contexts/BoardCustomizationContext';
import { getCustomPieces } from '../../utils/pieceSets';
import { playSound, getMoveSound } from '../../utils/sounds';
import socketService from '../../services/socketService';
import { useAuth } from '../../contexts/AuthContext';
import PromotionDialog from '../../Components/PromotionDialog/PromotionDialog';
import PageHeader, { PageAmbient } from '../../Components/UI/PageHeader';
import {
  Zap,
  Flame,
  Clock,
  Radio,
  Trophy,
  Users,
  Activity,
  ArrowRight,
  RotateCcw,
  Flag,
  MessageSquare,
  ScrollText,
  BarChart2,
  ExternalLink,
  Shield,
  Bot,
  Compass,
  Copy,
  Check,
  Send,
  Sparkles,
  Wifi,
  Globe,
  AlertTriangle,
  Sliders,
  Plus,
  Minus,
  CheckCircle2
} from 'lucide-react';
import './onlineGame.css';

// Curated Time Controls categorized by speed archetype
const TIME_CONTROLS_DATA = [
  // BULLET
  {
    tc: '1+0',
    category: 'bullet',
    name: 'Bullet Lightning',
    tag: 'Sudden Death',
    mins: 1,
    inc: 0,
    estDuration: '~2 min',
    desc: 'Pure high-speed instinct and reflex sprint',
    icon: Zap,
    color: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.25)',
    popular: true
  },
  {
    tc: '1+1',
    category: 'bullet',
    name: 'Bullet Pro',
    tag: '+1s Increment',
    mins: 1,
    inc: 1,
    estDuration: '~2.5 min',
    desc: 'Clutch bullet speed with incremental buffer',
    icon: Zap,
    color: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.25)'
  },
  {
    tc: '2+1',
    category: 'bullet',
    name: 'Quick-Fire',
    tag: 'Dynamic Bullet',
    mins: 2,
    inc: 1,
    estDuration: '~3.5 min',
    desc: 'Fast paced bullet with space for tactics',
    icon: Zap,
    color: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.25)'
  },

  // BLITZ
  {
    tc: '3+0',
    category: 'blitz',
    name: 'Blitz Arena',
    tag: 'Arena Standard',
    mins: 3,
    inc: 0,
    estDuration: '~5 min',
    desc: 'The global benchmark cadence for online competition',
    icon: Flame,
    color: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.25)',
    popular: true
  },
  {
    tc: '3+2',
    category: 'blitz',
    name: 'FIDE Blitz',
    tag: '+2s FIDE Pace',
    mins: 3,
    inc: 2,
    estDuration: '~7 min',
    desc: 'World Championship standard tournament cadence',
    icon: Flame,
    color: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.25)',
    popular: true
  },
  {
    tc: '5+0',
    category: 'blitz',
    name: 'Tactical Blitz',
    tag: '5m Pure Clock',
    mins: 5,
    inc: 0,
    estDuration: '~8 min',
    desc: 'Calculated tactical strikes under persistent clock pressure',
    icon: Flame,
    color: '#c084fc',
    glow: 'rgba(192, 132, 252, 0.25)'
  },
  {
    tc: '5+3',
    category: 'blitz',
    name: 'Marathon Blitz',
    tag: '+3s Increment',
    mins: 5,
    inc: 3,
    estDuration: '~10 min',
    desc: 'Complex dynamic maneuvering with endgame increment bonus',
    icon: Flame,
    color: '#c084fc',
    glow: 'rgba(192, 132, 252, 0.25)'
  },

  // RAPID
  {
    tc: '10+0',
    category: 'rapid',
    name: 'Classical Rapid',
    tag: 'Standard Rapid',
    mins: 10,
    inc: 0,
    estDuration: '~15 min',
    desc: 'Strategic study with adequate time for deep evaluation',
    icon: Clock,
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.25)',
    popular: true
  },
  {
    tc: '15+10',
    category: 'rapid',
    name: 'Tournament Rapid',
    tag: '+10s Precision',
    mins: 15,
    inc: 10,
    estDuration: '~25 min',
    desc: 'Championship standard with generous increment per move',
    icon: Clock,
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.25)'
  },
  {
    tc: '30+0',
    category: 'rapid',
    name: 'Deep Classical',
    tag: 'Endurance Study',
    mins: 30,
    inc: 0,
    estDuration: '~45 min',
    desc: 'Maximum depth, patient positional maneuvering and strategy',
    icon: Clock,
    color: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.25)'
  }
];

// Quick calibrator presets for the custom clock engine
const CUSTOM_PRESETS = [
  { label: '1+0', tag: 'Bullet Sprint', mins: 1, inc: 0 },
  { label: '3+2', tag: 'Blitz FIDE', mins: 3, inc: 2 },
  { label: '5+3', tag: 'Blitz Dynamic', mins: 5, inc: 3 },
  { label: '10+5', tag: 'Rapid Balanced', mins: 10, inc: 5 },
  { label: '15+10', tag: 'Rapid Tourney', mins: 15, inc: 10 },
  { label: '30+0', tag: 'Classical Deep', mins: 30, inc: 0 }
];

// Quick in-game communication presets
const QUICK_CHAT_PRESETS = [
  'Good luck! 👋',
  'Nice move! 🎯',
  'Well played! 🤝',
  'Rematch? ⚡',
  'Thanks for the game! ⏱️'
];

// Helper to compute captured pieces and material score
function getCapturedPieces(fen) {
  if (!fen) return { capturedByWhite: [], capturedByBlack: [], whiteAdvantage: 0, blackAdvantage: 0 };
  const initial = {
    w: { p: 8, n: 2, b: 2, r: 2, q: 1 },
    b: { p: 8, n: 2, b: 2, r: 2, q: 1 }
  };
  const current = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0 }
  };

  const piecePlacement = fen.split(' ')[0] || '';
  for (const char of piecePlacement) {
    if (char >= '1' && char <= '8') continue;
    if (char === '/') continue;
    const color = char === char.toUpperCase() ? 'w' : 'b';
    const type = char.toLowerCase();
    if (current[color] && current[color][type] !== undefined) {
      current[color][type]++;
    }
  }

  const capturedByWhite = [];
  let whiteMaterialVal = 0;
  let blackMaterialVal = 0;
  const values = { p: 1, n: 3, b: 3, r: 5, q: 9 };

  ['q', 'r', 'b', 'n', 'p'].forEach((type) => {
    const diff = initial.b[type] - current.b[type];
    for (let i = 0; i < diff; i++) {
      capturedByWhite.push({ type, color: 'b' });
    }
    blackMaterialVal += current.b[type] * values[type];
    whiteMaterialVal += current.w[type] * values[type];
  });

  const capturedByBlack = [];
  ['q', 'r', 'b', 'n', 'p'].forEach((type) => {
    const diff = initial.w[type] - current.w[type];
    for (let i = 0; i < diff; i++) {
      capturedByBlack.push({ type, color: 'w' });
    }
  });

  const diffWhite = whiteMaterialVal - blackMaterialVal;
  const diffBlack = blackMaterialVal - whiteMaterialVal;

  return {
    capturedByWhite,
    capturedByBlack,
    whiteAdvantage: diffWhite > 0 ? diffWhite : 0,
    blackAdvantage: diffBlack > 0 ? diffBlack : 0
  };
}

export default function OnlineGamePage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const {
    darkSquareColor,
    lightSquareColor,
    showNotation: showNotationFromCustomization,
    pieceSet,
    animationSpeed,
    highlightColor,
    soundEnabled,
    soundTheme
  } = useBoardCustomization();

  const [gameState, setGameState] = useState('idle'); // 'idle' | 'searching' | 'playing' | 'game_over'
  const [game, setGame] = useState(new Chess());
  const [playerColor, setPlayerColor] = useState(null);
  const [boardOrientation, setBoardOrientation] = useState('white');
  const [opponent, setOpponent] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [showPromotion, setShowPromotion] = useState(false);
  const [pendingMove, setPendingMove] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [selectedTimeControl, setSelectedTimeControl] = useState('10+0');
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('5');
  const [customIncrement, setCustomIncrement] = useState('0');
  const [challenges, setChallenges] = useState([]);
  const [myChallenge, setMyChallenge] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [myRating, setMyRating] = useState(1200);
  const [activeTab, setActiveTab] = useState('moves'); // 'moves' | 'chat' | 'telemetry'
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);
  const [showResignModal, setShowResignModal] = useState(false);
  const [showDrawOfferBubble, setShowDrawOfferBubble] = useState(false);
  const [drawOffered, setDrawOffered] = useState(false);
  const [gameNotification, setGameNotification] = useState(null);
  const [chatBubble, setChatBubble] = useState(null);
  const [searchSeconds, setSearchSeconds] = useState(0);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Matrix Category Archetype Filter: 'all' | 'bullet' | 'blitz' | 'rapid' | 'custom'
  const [matrixCategoryFilter, setMatrixCategoryFilter] = useState('all');

  // Click-to-move state
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);

  // Category Ratings extraction
  const categoryRatings = useMemo(() => ({
    bullet: user?.ratings?.bullet?.rating || 1200,
    blitz: user?.ratings?.blitz?.rating || 1200,
    rapid: user?.ratings?.rapid?.rating || 1200
  }), [user]);

  // Robust rating category inference
  const getRatingCategory = useCallback((timeControl) => {
    if (!timeControl) return 'rapid';
    if (timeControl === 'custom') {
      const mins = parseInt(customMinutes, 10) || 5;
      const inc = parseInt(customIncrement, 10) || 0;
      const estimatedTime = mins + (inc * 40) / 60;
      if (estimatedTime < 3) return 'bullet';
      if (estimatedTime < 10) return 'blitz';
      return 'rapid';
    }
    const [minutes = 10, increment = 0] = String(timeControl).split('+').map(Number);
    const estimatedTime = (minutes || 0) + ((increment || 0) * 40) / 60;
    if (estimatedTime < 3) return 'bullet';
    if (estimatedTime < 10) return 'blitz';
    return 'rapid';
  }, [customMinutes, customIncrement]);

  // Live custom cadence calculation
  const customEstDurationMinutes = useMemo(() => {
    const mins = parseInt(customMinutes, 10) || 5;
    const inc = parseInt(customIncrement, 10) || 0;
    return (mins + (inc * 40) / 60).toFixed(1);
  }, [customMinutes, customIncrement]);

  const customCategory = useMemo(() => {
    const est = parseFloat(customEstDurationMinutes);
    if (est < 3) return 'bullet';
    if (est < 10) return 'blitz';
    return 'rapid';
  }, [customEstDurationMinutes]);

  // Active Time Control presentation telemetry
  const activeTcLabel = useMemo(() => {
    if (selectedTimeControl === 'custom') {
      return `${customMinutes}+${customIncrement}`;
    }
    return selectedTimeControl;
  }, [selectedTimeControl, customMinutes, customIncrement]);

  const activeTcMeta = useMemo(() => {
    if (selectedTimeControl === 'custom') {
      return {
        tc: activeTcLabel,
        category: customCategory,
        name: `Custom Clock (${customMinutes}m + ${customIncrement}s)`,
        tag: `${customCategory.toUpperCase()} CLASS`,
        estDuration: `~${customEstDurationMinutes} min`,
        desc: 'Custom player-defined clock configuration',
        color: customCategory === 'bullet' ? '#06b6d4' : customCategory === 'blitz' ? '#a855f7' : '#f59e0b',
        glow: customCategory === 'bullet' ? 'rgba(6, 182, 212, 0.25)' : customCategory === 'blitz' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(245, 158, 11, 0.25)',
        mins: parseInt(customMinutes, 10) || 5,
        inc: parseInt(customIncrement, 10) || 0
      };
    }
    const found = TIME_CONTROLS_DATA.find((c) => c.tc === selectedTimeControl);
    if (found) return found;
    const cat = getRatingCategory(selectedTimeControl);
    return {
      tc: selectedTimeControl,
      category: cat,
      name: `${cat.toUpperCase()} MATCH`,
      tag: 'Arena Rated',
      estDuration: '~10 min',
      desc: 'Rated competitive ladder match',
      color: cat === 'bullet' ? '#06b6d4' : cat === 'blitz' ? '#a855f7' : '#f59e0b',
      glow: 'rgba(16, 185, 129, 0.25)',
      mins: parseInt(String(selectedTimeControl).split('+')[0], 10) || 10,
      inc: parseInt(String(selectedTimeControl).split('+')[1], 10) || 0
    };
  }, [selectedTimeControl, activeTcLabel, customCategory, customMinutes, customIncrement, customEstDurationMinutes, getRatingCategory]);

  useEffect(() => {
    if (refreshUser) refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (user && selectedTimeControl) {
      const category = getRatingCategory(selectedTimeControl);
      const userRating = user.ratings?.[category]?.rating;
      if (userRating) {
        setMyRating(userRating);
      } else {
        setMyRating(1200);
      }
    }
  }, [user, selectedTimeControl, getRatingCategory]);

  // Synchronize board orientation when player color assigned
  useEffect(() => {
    if (playerColor) setBoardOrientation(playerColor);
  }, [playerColor]);

  const gameRef = useRef(new Chess());
  const timerRef = useRef(null);
  const searchTimerRef = useRef(null);

  // Search timer
  useEffect(() => {
    if (gameState === 'searching') {
      setSearchSeconds(0);
      searchTimerRef.current = setInterval(() => {
        setSearchSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    }
    return () => {
      if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    };
  }, [gameState]);

  // Copy to clipboard helper
  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Socket Connection & Listeners
  useEffect(() => {
    socketService.connect();

    const checkRejoin = () => {
      const savedSession = localStorage.getItem('chess_session');
      if (savedSession) {
        try {
          const { roomId: savedRoomId, playerId, timestamp } = JSON.parse(savedSession);
          if (Date.now() - timestamp < 300000) {
            socketService.emit('rejoin_game', { roomId: savedRoomId, playerId });
          } else {
            localStorage.removeItem('chess_session');
          }
        } catch {
          localStorage.removeItem('chess_session');
        }
      }
    };

    if (socketService.socket?.connected) {
      socketService.emit('get_challenges');
      checkRejoin();
    }

    socketService.on('connect', () => {
      socketService.emit('get_challenges');
      checkRejoin();
    });

    socketService.on('game_start', (data) => {
      setPlayerColor(data.color);
      setBoardOrientation(data.color);
      setOpponent(data.opponent);
      setRoomId(data.roomId);
      setGameState('playing');
      setShowGameOverModal(false);
      setSelectedTimeControl(data.timeControl);
      gameRef.current = new Chess();
      setGame(new Chess());
      setMoveHistory([]);
      setConnectionStatus('connected');

      localStorage.setItem(
        'chess_session',
        JSON.stringify({
          roomId: data.roomId,
          playerId: socketService.socket?.id,
          timestamp: Date.now()
        })
      );

      const [minutes] = data.timeControl.split('+').map(Number);
      const initialTime = minutes * 60;
      setWhiteTime(initialTime);
      setBlackTime(initialTime);

      setDrawOffered(false);
      setShowDrawOfferBubble(false);
      setShowResignModal(false);

      // Play start sound
      playSound('gameEnd', soundTheme, soundEnabled);
    });

    socketService.on('game_rejoined', (data) => {
      setPlayerColor(data.color);
      setBoardOrientation(data.color);
      setOpponent(data.opponent);
      setRoomId(data.roomId);
      setMyRating(data.myRating || 1200);
      setGameState('playing');
      setShowGameOverModal(false);
      setSelectedTimeControl(data.timeControl);
      setConnectionStatus('connected');

      const newGame = new Chess();
      data.moves.forEach((move) => {
        newGame.move(move);
      });
      gameRef.current = newGame;
      setGame(new Chess(newGame.fen()));
      setMoveHistory(data.moves);
      setChatMessages(data.chatHistory || []);

      const history = newGame.history({ verbose: true });
      if (history.length > 0) {
        const lastMoveData = history[history.length - 1];
        setLastMove({ from: lastMoveData.from, to: lastMoveData.to });
      }

      setWhiteTime(data.whiteTime);
      setBlackTime(data.blackTime);

      localStorage.setItem(
        'chess_session',
        JSON.stringify({
          roomId: data.roomId,
          playerId: socketService.socket?.id,
          timestamp: Date.now()
        })
      );
    });

    socketService.on('receive_chat', (message) => {
      setChatMessages((prev) => {
        const isDuplicate = prev.some(
          (m) =>
            m.timestamp === message.timestamp &&
            m.sender === message.sender &&
            m.message === message.message
        );
        if (isDuplicate) return prev;
        return [...prev, message];
      });

      if (message.sender !== (user?.username || 'Guest')) {
        setChatBubble(message.message);
        setTimeout(() => setChatBubble(null), 3500);
      }
    });

    socketService.on('opponent_disconnected', () => {
      setConnectionStatus('opponent_disconnected');
    });

    socketService.on('opponent_reconnected', () => {
      setConnectionStatus('connected');
    });

    socketService.on('opponent_move', ({ move, from, to }) => {
      try {
        gameRef.current.move(move);
        setGame(new Chess(gameRef.current.fen()));

        if (from && to) {
          setLastMove({ from, to });
        } else {
          const history = gameRef.current.history({ verbose: true });
          if (history.length > 0) {
            const lastMoveData = history[history.length - 1];
            setLastMove({ from: lastMoveData.from, to: lastMoveData.to });
          }
        }

        setMoveHistory((prev) => [...prev, move]);

        // Trigger Move Audio
        const isCheck = gameRef.current.isCheck();
        const isCapture = move.includes('x');
        const isCastle = move.includes('O-');
        const isPromotion = move.includes('=');
        const soundType = isCheck
          ? 'check'
          : isPromotion
          ? 'promote'
          : isCastle
          ? 'castle'
          : isCapture
          ? 'capture'
          : 'move';
        playSound(soundType, soundTheme, soundEnabled);

        const [, increment = 0] = selectedTimeControl.split('+').map(Number);
        if (increment > 0) {
          setWhiteTime((prev) => (playerColor === 'black' ? prev + increment : prev));
          setBlackTime((prev) => (playerColor === 'white' ? prev + increment : prev));
        }
      } catch (error) {
        console.error('Opponent move sync error:', error);
      }
    });

    socketService.on('game_ended', ({ result, reason, ratingChanges }) => {
      setGameResult({ result, reason, ratingChanges });
      setGameState('game_over');
      setShowGameOverModal(true);

      // Play outcome audio
      const isWin = result === playerColor;
      const isDraw = result === 'draw';
      const outcomeSound = isWin ? 'victory' : isDraw ? 'draw' : 'defeat';
      playSound(outcomeSound, soundTheme, soundEnabled);

      localStorage.removeItem('chess_session');
      if (refreshUser) refreshUser();
    });

    socketService.on('error', ({ message }) => {
      alert(message);
    });

    socketService.on('challenge_list_updated', (challengeList) => {
      const myId = socketService.socket?.id;
      const myOwn = challengeList.find((c) => c.playerId === myId);

      if (myOwn) {
        setMyChallenge(myOwn);
        setGameState('searching');
      } else {
        setMyChallenge(null);
        setGameState((prev) => (prev === 'searching' ? 'idle' : prev));
      }

      setChallenges(challengeList.filter((c) => c.playerId !== myId));
    });

    socketService.on('challenge_created', ({ challengeId, challenge }) => {
      setMyChallenge({ id: challengeId, ...challenge });
    });

    socketService.on('challenge_cancelled', () => {
      setMyChallenge(null);
    });

    socketService.on('draw_offered', () => {
      setShowDrawOfferBubble(true);
    });

    socketService.on('draw_declined', () => {
      setDrawOffered(false);
      setShowDrawOfferBubble(false);
      setGameNotification('Draw Declined');
      setTimeout(() => setGameNotification(null), 3000);
    });

    return () => {
      socketService.off('connect');
      socketService.off('game_start');
      socketService.off('game_rejoined');
      socketService.off('rejoin_error');
      socketService.off('opponent_disconnected');
      socketService.off('opponent_reconnected');
      socketService.off('opponent_move');
      socketService.off('receive_chat');
      socketService.off('game_ended');
      socketService.off('error');
      socketService.off('challenge_list_updated');
      socketService.off('challenge_created');
      socketService.off('challenge_cancelled');
      socketService.off('draw_offered');
      socketService.off('draw_declined');
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selectedTimeControl, playerColor, soundTheme, soundEnabled, refreshUser, user]);

  // Chess Clock Interval
  useEffect(() => {
    if (gameState !== 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      const turn = gameRef.current.turn();
      const isWhiteTurn = turn === 'w';

      if (isWhiteTurn) {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            socketService.emit('game_over', {
              roomId,
              result: 'black',
              reason: 'White ran out of time'
            });
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            socketService.emit('game_over', {
              roomId,
              result: 'white',
              reason: 'Black ran out of time'
            });
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, roomId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeTab]);

  const sendChat = (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    socketService.emit('send_chat', { roomId, message: chatInput.trim() });
    setChatInput('');
  };

  const sendQuickChat = (message) => {
    if (!roomId) return;
    socketService.emit('send_chat', { roomId, message });
  };

  const findGame = () => {
    setGameState('searching');

    let timeControl = selectedTimeControl;
    if (selectedTimeControl === 'custom') {
      const mins = parseInt(customMinutes, 10) || 5;
      const inc = parseInt(customIncrement, 10) || 0;
      timeControl = `${mins}+${inc}`;
    }

    const ratingCategory = getRatingCategory(timeControl);
    const userRating = user?.ratings?.[ratingCategory]?.rating || 1200;
    setMyRating(userRating);

    socketService.emit('find_game', {
      username: user?.username || 'Guest',
      rating: userRating,
      avatar: user?.avatar,
      timeControl
    });
  };

  const cancelSearch = () => {
    socketService.emit('cancel_find_game');
    setGameState('idle');
  };

  const createChallenge = () => {
    let timeControl = selectedTimeControl;
    if (selectedTimeControl === 'custom') {
      const mins = parseInt(customMinutes, 10) || 5;
      const inc = parseInt(customIncrement, 10) || 0;
      timeControl = `${mins}+${inc}`;
    }

    const ratingCategory = getRatingCategory(timeControl);
    const userRating = user?.ratings?.[ratingCategory]?.rating || 1200;
    setMyRating(userRating);

    socketService.emit('create_challenge', {
      username: user?.username || 'Guest',
      rating: userRating,
      avatar: user?.avatar,
      timeControl
    });
  };

  const acceptChallenge = (challenge) => {
    const ratingCategory = getRatingCategory(challenge.timeControl);
    const userRating = user?.ratings?.[ratingCategory]?.rating || 1200;
    setMyRating(userRating);

    socketService.emit('accept_challenge', {
      challengeId: challenge.id,
      username: user?.username || 'Guest',
      rating: userRating,
      avatar: user?.avatar
    });
  };

  const cancelChallenge = () => {
    if (myChallenge) {
      socketService.emit('cancel_challenge', { challengeId: myChallenge.id });
    }
  };

  // Move Execution logic shared by drop and click
  const makeMove = useCallback(
    (sourceSquare, targetSquare, promotion = 'q') => {
      try {
        const move = gameRef.current.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: promotion
        });

        if (move === null) return false;

        // Sound effect
        const soundType = getMoveSound(
          move,
          !!move.captured,
          gameRef.current.isCheck(),
          move.san.includes('O-'),
          !!move.promotion
        );
        playSound(soundType, soundTheme, soundEnabled);

        setGame(new Chess(gameRef.current.fen()));
        setLastMove({ from: sourceSquare, to: targetSquare });
        setMoveHistory((prev) => [...prev, move.san]);

        const [, increment = 0] = selectedTimeControl.split('+').map(Number);
        if (increment > 0) {
          if (playerColor === 'white') {
            setWhiteTime((prev) => prev + increment);
          } else {
            setBlackTime((prev) => prev + increment);
          }
        }

        socketService.emit('make_move', {
          roomId,
          move: move.san,
          fen: gameRef.current.fen(),
          from: sourceSquare,
          to: targetSquare
        });

        if (gameRef.current.isCheckmate()) {
          const winner = gameRef.current.turn() === 'w' ? 'black' : 'white';
          socketService.emit('game_over', {
            roomId,
            result: winner,
            reason: 'checkmate'
          });
        } else if (gameRef.current.isStalemate()) {
          socketService.emit('game_over', {
            roomId,
            result: 'draw',
            reason: 'stalemate'
          });
        } else if (gameRef.current.isDraw()) {
          let reason = 'draw';
          if (gameRef.current.isInsufficientMaterial()) reason = 'insufficient material';
          else if (gameRef.current.isThreefoldRepetition()) reason = 'threefold repetition';
          socketService.emit('game_over', { roomId, result: 'draw', reason });
        }

        setShowDrawOfferBubble(false);
        return true;
      } catch {
        return false;
      }
    },
    [roomId, selectedTimeControl, playerColor, soundTheme, soundEnabled]
  );

  // Drag-and-drop piece drop
  const onDrop = (dropArg1, dropArg2) => {
    if (gameState !== 'playing') return false;
    const turn = gameRef.current.turn();
    const isPlayerTurn =
      (turn === 'w' && playerColor === 'white') ||
      (turn === 'b' && playerColor === 'black');

    if (!isPlayerTurn) return false;

    let sourceSquare, targetSquare;
    if (typeof dropArg1 === 'object' && dropArg1 !== null) {
      sourceSquare = dropArg1.sourceSquare || dropArg1.from;
      targetSquare = dropArg1.targetSquare || dropArg1.to;
    } else {
      sourceSquare = dropArg1;
      targetSquare = dropArg2;
    }

    if (!sourceSquare || !targetSquare) return false;

    setSelectedSquare(null);
    setPossibleMoves([]);

    const piece = gameRef.current.get(sourceSquare);
    const isPromotion =
      piece?.type === 'p' &&
      ((piece.color === 'w' && targetSquare[1] === '8') ||
        (piece.color === 'b' && targetSquare[1] === '1'));

    if (isPromotion) {
      setPendingMove({ sourceSquare, targetSquare });
      setShowPromotion(true);
      return true;
    }

    return makeMove(sourceSquare, targetSquare);
  };

  // Click-to-move piece selection
  const onSquareClick = (square) => {
    if (gameState !== 'playing') return;
    const turn = gameRef.current.turn();
    const isPlayerTurn =
      (turn === 'w' && playerColor === 'white') ||
      (turn === 'b' && playerColor === 'black');

    if (!isPlayerTurn) return;

    if (!selectedSquare) {
      const piece = gameRef.current.get(square);
      if (piece && piece.color === turn) {
        setSelectedSquare(square);
        const legal = gameRef.current.moves({ square, verbose: true });
        setPossibleMoves(legal.map((m) => m.to));
      }
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      setPossibleMoves([]);
      return;
    }

    const clickedPiece = gameRef.current.get(square);
    if (clickedPiece && clickedPiece.color === turn) {
      setSelectedSquare(square);
      const legal = gameRef.current.moves({ square, verbose: true });
      setPossibleMoves(legal.map((m) => m.to));
      return;
    }

    // Attempt move
    const from = selectedSquare;
    setSelectedSquare(null);
    setPossibleMoves([]);

    const movingPiece = gameRef.current.get(from);
    const isPromotion =
      movingPiece?.type === 'p' &&
      ((movingPiece.color === 'w' && square[1] === '8') ||
        (movingPiece.color === 'b' && square[1] === '1'));

    if (isPromotion) {
      setPendingMove({ sourceSquare: from, targetSquare: square });
      setShowPromotion(true);
      return;
    }

    makeMove(from, square);
  };

  const handlePromotionSelect = (piece) => {
    setShowPromotion(false);
    if (pendingMove) {
      makeMove(pendingMove.sourceSquare, pendingMove.targetSquare, piece);
      setPendingMove(null);
    }
  };

  const resign = () => {
    setShowResignModal(true);
  };

  const confirmResign = () => {
    socketService.emit('resign', { roomId });
    setShowResignModal(false);
  };

  const handleOfferDraw = () => {
    socketService.emit('offer_draw', { roomId });
    setDrawOffered(true);
  };

  const handleAcceptDraw = () => {
    socketService.emit('accept_draw', { roomId });
    setShowDrawOfferBubble(false);
  };

  const handleDeclineDraw = () => {
    socketService.emit('decline_draw', { roomId });
    setShowDrawOfferBubble(false);
  };

  const playAgain = () => {
    setGameState('idle');
    setGame(new Chess());
    setPlayerColor(null);
    setOpponent(null);
    setRoomId(null);
    setGameResult(null);
    setMyChallenge(null);
    setShowGameOverModal(false);
    gameRef.current = new Chess();
  };

  const formatTime = (seconds) => {
    const val = Number(seconds);
    if (isNaN(val)) return '0:00';
    const totalSeconds = Math.max(0, Math.floor(val));
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Captured material calculation
  const materialData = useMemo(() => {
    return getCapturedPieces(game.fen());
  }, [game]);

  // Dynamic square highlights
  const customSquareStyles = useMemo(() => {
    const styles = {};

    if (lastMove) {
      styles[lastMove.from] = { backgroundColor: highlightColor || 'rgba(255, 215, 0, 0.4)' };
      styles[lastMove.to] = { backgroundColor: highlightColor || 'rgba(255, 215, 0, 0.4)' };
    }

    if (selectedSquare) {
      styles[selectedSquare] = {
        ...styles[selectedSquare],
        boxShadow: 'inset 0 0 0 3px #10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.35)'
      };
    }

    possibleMoves.forEach((sq) => {
      styles[sq] = {
        ...styles[sq],
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.8) 22%, transparent 26%)'
      };
    });

    return styles;
  }, [lastMove, selectedSquare, possibleMoves, highlightColor]);

  const activeTurn = game.turn();
  const isMyTurn = (activeTurn === 'w' && playerColor === 'white') || (activeTurn === 'b' && playerColor === 'black');

  return (
    <div className="online-game-page cp-subpage">
      <PageAmbient watermark="ARENA" theme="classic" />

      <div className="online-game-container">
        {/* ====================================================================
            1. LOBBY & MATCHMAKING DASHBOARD (IDLE)
            ==================================================================== */}
        {gameState === 'idle' && (
          <div className="online-dashboard">
            <PageHeader
              badge="WEBSOCKET MATCHMAKING · LOW-LATENCY FULL-DUPLEX RELAY"
              title="Multiplayer"
              accent="Arena"
              subtitle="Pair instantaneously across bullet, blitz, and rapid time controls or accept broadcasted challenges from the arena queue."
              theme="classic"
              rightElement={
                <div className="arena-ping-chip">
                  <span className="live-pulse-dot" />
                  <span>WS RELAY: CONNECTED (~22ms)</span>
                </div>
              }
            />

            {/* Top Telemetry Monolith Ribbon */}
            <div className="cp-console-window online-hud-ribbon">
              <div className="online-hud-cell">
                <span className="hud-cell-code">SYS-01 // RATING</span>
                <span className="hud-cell-val emerald">{myRating} ELO</span>
                <span className="hud-cell-lbl">
                  {getRatingCategory(selectedTimeControl).toUpperCase()} CLASS
                </span>
              </div>
              <div className="online-hud-cell">
                <span className="hud-cell-code">SYS-02 // ARENA QUEUE</span>
                <span className="hud-cell-val cyan">{challenges.length} Open</span>
                <span className="hud-cell-lbl">Active Challenges in Lobby</span>
              </div>
              <div className="online-hud-cell">
                <span className="hud-cell-code">SYS-03 // CADENCE</span>
                <span className="hud-cell-val gold">
                  {selectedTimeControl === 'custom'
                    ? `${customMinutes}+${customIncrement}`
                    : selectedTimeControl}
                </span>
                <span className="hud-cell-lbl">Selected Time Control</span>
              </div>
              <div className="online-hud-cell">
                <span className="hud-cell-code">SYS-04 // PROTOCOL</span>
                <span className="hud-cell-val violet">Socket.IO</span>
                <span className="hud-cell-lbl">Full-Duplex Pairing Relay</span>
              </div>
            </div>

            {/* 2-Column Lobby Console */}
            <div className="online-lobby-console-grid">
              {/* Left Column: Time-Control Matrix & Launchpad */}
              <div className="cp-console-window online-matrix-panel">
                <div className="cp-window-topbar">
                  <span className="cp-window-title">
                    <span className="cp-window-dot emerald" />
                    <span>TIME-CONTROL MATRIX // SELECT MATCH SPEED</span>
                  </span>
                  <span
                    className="online-active-tc-badge"
                    style={{
                      borderColor: `${activeTcMeta.color}55`,
                      color: activeTcMeta.color,
                      background: `${activeTcMeta.color}15`
                    }}
                  >
                    <span className="live-pulse-dot" style={{ background: activeTcMeta.color }} />
                    <span>CADENCE: {activeTcMeta.tc} &middot; {activeTcMeta.category.toUpperCase()}</span>
                  </span>
                </div>

                <div className="online-matrix-body">
                  {/* Category Tier Selector Tabs */}
                  <div className="matrix-tier-tabs" role="tablist">
                    {[
                      { id: 'all', label: 'All Cadences', count: '10', icon: Trophy },
                      { id: 'bullet', label: 'Bullet', rating: categoryRatings.bullet, icon: Zap, color: '#06b6d4' },
                      { id: 'blitz', label: 'Blitz', rating: categoryRatings.blitz, icon: Flame, color: '#a855f7' },
                      { id: 'rapid', label: 'Rapid', rating: categoryRatings.rapid, icon: Clock, color: '#f59e0b' },
                      { id: 'custom', label: 'Custom Protocol', tag: 'Config', icon: Sliders, color: '#38bdf8' }
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = matrixCategoryFilter === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          className={`matrix-tier-tab ${isActive ? 'active' : ''}`}
                          style={{ '--tab-accent': tab.color || '#10b981' }}
                          onClick={() => {
                            setMatrixCategoryFilter(tab.id);
                            if (tab.id === 'custom') {
                              setSelectedTimeControl('custom');
                              setShowCustomTime(true);
                            }
                          }}
                        >
                          <Icon size={14} className="tier-tab-icon" />
                          <span className="tier-tab-label">{tab.label}</span>
                          {tab.rating !== undefined ? (
                            <span className="tier-tab-badge rating">{tab.rating} ELO</span>
                          ) : tab.count ? (
                            <span className="tier-tab-badge count">{tab.count}</span>
                          ) : tab.tag ? (
                            <span className="tier-tab-badge tag">{tab.tag}</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>

                  {/* Cadence Cards Grid (when not purely custom tab) */}
                  {matrixCategoryFilter !== 'custom' && (
                    <div className="tc-matrix-cards-grid">
                      {TIME_CONTROLS_DATA
                        .filter((item) => matrixCategoryFilter === 'all' || item.category === matrixCategoryFilter)
                        .map((item) => {
                          const Icon = item.icon;
                          const isSelected = selectedTimeControl === item.tc;
                          return (
                            <button
                              key={item.tc}
                              type="button"
                              className={`tc-cadence-card ${isSelected ? 'active' : ''}`}
                              style={{
                                '--card-accent': item.color,
                                '--card-glow': item.glow
                              }}
                              onClick={() => {
                                setSelectedTimeControl(item.tc);
                                setShowCustomTime(false);
                              }}
                            >
                              <div className="tc-card-header">
                                <span className="tc-time-readout">{item.tc}</span>
                                <div className="tc-header-badges">
                                  {item.popular && (
                                    <span className="tc-popular-chip">
                                      <Sparkles size={10} />
                                      <span>POPULAR</span>
                                    </span>
                                  )}
                                  <span
                                    className="tc-category-pill"
                                    style={{ borderColor: `${item.color}55`, color: item.color }}
                                  >
                                    <Icon size={11} />
                                    <span>{item.category.toUpperCase()}</span>
                                  </span>
                                </div>
                              </div>

                              <div className="tc-card-body">
                                <div className="tc-card-name-row">
                                  <span className="tc-card-name">{item.name}</span>
                                  <span className="tc-tag-pill">{item.tag}</span>
                                </div>
                                <p className="tc-card-desc">{item.desc}</p>
                              </div>

                              <div className="tc-card-footer">
                                <div className="tc-telemetry-specs">
                                  <span className="tc-spec-item">{item.mins}m base</span>
                                  <span className="tc-spec-sep">&middot;</span>
                                  <span className="tc-spec-item">+{item.inc}s / ply</span>
                                  <span className="tc-spec-sep">&middot;</span>
                                  <span className="tc-spec-item duration">{item.estDuration}</span>
                                </div>
                                {isSelected && (
                                  <div className="tc-active-indicator">
                                    <CheckCircle2 size={12} />
                                    <span>ACTIVE</span>
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}

                      {/* Custom Clock Card in 'all' view */}
                      {matrixCategoryFilter === 'all' && (
                        <button
                          type="button"
                          className={`tc-cadence-card tc-custom-toggle-card ${
                            selectedTimeControl === 'custom' ? 'active' : ''
                          }`}
                          style={{
                            '--card-accent': '#38bdf8',
                            '--card-glow': 'rgba(56, 189, 248, 0.25)'
                          }}
                          onClick={() => {
                            setSelectedTimeControl('custom');
                            setShowCustomTime(true);
                          }}
                        >
                          <div className="tc-card-header">
                            <span className="tc-time-readout">CUSTOM</span>
                            <span
                              className="tc-category-pill"
                              style={{ borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}
                            >
                              <Sliders size={11} />
                              <span>CALIBRATE</span>
                            </span>
                          </div>

                          <div className="tc-card-body">
                            <div className="tc-card-name-row">
                              <span className="tc-card-name">Calibrated Clocks</span>
                              <span className="tc-tag-pill">User Defined</span>
                            </div>
                            <p className="tc-card-desc">Configure custom base minutes and increment per ply</p>
                          </div>

                          <div className="tc-card-footer">
                            <div className="tc-telemetry-specs">
                              <span className="tc-spec-item">{customMinutes}m + {customIncrement}s</span>
                              <span className="tc-spec-sep">&middot;</span>
                              <span className="tc-spec-item duration">~{customEstDurationMinutes}m</span>
                            </div>
                            {selectedTimeControl === 'custom' && (
                              <div className="tc-active-indicator">
                                <CheckCircle2 size={12} />
                                <span>ACTIVE</span>
                              </div>
                            )}
                          </div>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Custom Clock Engine Studio (when selected or on custom tab) */}
                  {(showCustomTime || matrixCategoryFilter === 'custom') && (
                    <div className="tc-custom-studio">
                      <div className="tc-custom-header">
                        <div className="tc-custom-title-row">
                          <Sliders size={16} className="tc-custom-icon" />
                          <span className="tc-custom-title">CUSTOM CLOCK ENGINE // CALIBRATOR</span>
                        </div>
                        <div
                          className={`tc-custom-category-badge ${customCategory}`}
                          style={{
                            borderColor:
                              customCategory === 'bullet'
                                ? '#06b6d4'
                                : customCategory === 'blitz'
                                ? '#a855f7'
                                : '#f59e0b',
                            color:
                              customCategory === 'bullet'
                                ? '#06b6d4'
                                : customCategory === 'blitz'
                                ? '#a855f7'
                                : '#f59e0b'
                          }}
                        >
                          <span className="custom-cat-dot" />
                          <span>
                            {customMinutes}+{customIncrement} &middot; {customCategory.toUpperCase()} CLASS (~
                            {customEstDurationMinutes}m est.) &middot; {categoryRatings[customCategory]} ELO
                          </span>
                        </div>
                      </div>

                      {/* Steppers & Sliders 2-Col Layout */}
                      <div className="tc-custom-cols">
                        {/* Col 1: Minutes per Player */}
                        <div className="tc-custom-col">
                          <div className="tc-input-header">
                            <label className="tc-input-lbl">BASE TIME PER PLAYER</label>
                            <span className="tc-input-curr-val">{customMinutes} minutes</span>
                          </div>

                          <div className="tc-stepper-control">
                            <button
                              type="button"
                              className="tc-step-btn"
                              onClick={() => {
                                setSelectedTimeControl('custom');
                                setCustomMinutes(String(Math.max(1, (parseInt(customMinutes, 10) || 5) - 5)));
                              }}
                              title="Subtract 5 minutes"
                            >
                              -5m
                            </button>
                            <button
                              type="button"
                              className="tc-step-btn"
                              onClick={() => {
                                setSelectedTimeControl('custom');
                                setCustomMinutes(String(Math.max(1, (parseInt(customMinutes, 10) || 5) - 1)));
                              }}
                              title="Subtract 1 minute"
                            >
                              <Minus size={14} />
                            </button>
                            <div className="tc-input-number-wrap">
                              <input
                                type="number"
                                min="1"
                                max="180"
                                value={customMinutes}
                                onChange={(e) => {
                                  setSelectedTimeControl('custom');
                                  setCustomMinutes(e.target.value);
                                }}
                                className="tc-stepper-input"
                              />
                              <span className="tc-input-unit">min</span>
                            </div>
                            <button
                              type="button"
                              className="tc-step-btn"
                              onClick={() => {
                                setSelectedTimeControl('custom');
                                setCustomMinutes(String(Math.min(180, (parseInt(customMinutes, 10) || 5) + 1)));
                              }}
                              title="Add 1 minute"
                            >
                              <Plus size={14} />
                            </button>
                            <button
                              type="button"
                              className="tc-step-btn"
                              onClick={() => {
                                setSelectedTimeControl('custom');
                                setCustomMinutes(String(Math.min(180, (parseInt(customMinutes, 10) || 5) + 5)));
                              }}
                              title="Add 5 minutes"
                            >
                              +5m
                            </button>
                          </div>

                          <input
                            type="range"
                            min="1"
                            max="60"
                            value={Math.min(60, parseInt(customMinutes, 10) || 1)}
                            onChange={(e) => {
                              setSelectedTimeControl('custom');
                              setCustomMinutes(e.target.value);
                            }}
                            className="tc-range-slider"
                          />

                          <div className="tc-quick-chips-row">
                            {['1', '2', '3', '5', '10', '15', '30'].map((mins) => (
                              <button
                                key={mins}
                                type="button"
                                className={`tc-chip-btn ${customMinutes === mins ? 'active' : ''}`}
                                onClick={() => {
                                  setSelectedTimeControl('custom');
                                  setCustomMinutes(mins);
                                }}
                              >
                                {mins}m
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Col 2: Increment per Move */}
                        <div className="tc-custom-col">
                          <div className="tc-input-header">
                            <label className="tc-input-lbl">INCREMENT PER MOVE</label>
                            <span className="tc-input-curr-val">+{customIncrement} seconds / ply</span>
                          </div>

                          <div className="tc-stepper-control">
                            <button
                              type="button"
                              className="tc-step-btn"
                              onClick={() => {
                                setSelectedTimeControl('custom');
                                setCustomIncrement(String(Math.max(0, (parseInt(customIncrement, 10) || 0) - 5)));
                              }}
                              title="Subtract 5 seconds"
                            >
                              -5s
                            </button>
                            <button
                              type="button"
                              className="tc-step-btn"
                              onClick={() => {
                                setSelectedTimeControl('custom');
                                setCustomIncrement(String(Math.max(0, (parseInt(customIncrement, 10) || 0) - 1)));
                              }}
                              title="Subtract 1 second"
                            >
                              <Minus size={14} />
                            </button>
                            <div className="tc-input-number-wrap">
                              <input
                                type="number"
                                min="0"
                                max="60"
                                value={customIncrement}
                                onChange={(e) => {
                                  setSelectedTimeControl('custom');
                                  setCustomIncrement(e.target.value);
                                }}
                                className="tc-stepper-input"
                              />
                              <span className="tc-input-unit">sec</span>
                            </div>
                            <button
                              type="button"
                              className="tc-step-btn"
                              onClick={() => {
                                setSelectedTimeControl('custom');
                                setCustomIncrement(String(Math.min(60, (parseInt(customIncrement, 10) || 0) + 1)));
                              }}
                              title="Add 1 second"
                            >
                              <Plus size={14} />
                            </button>
                            <button
                              type="button"
                              className="tc-step-btn"
                              onClick={() => {
                                setSelectedTimeControl('custom');
                                setCustomIncrement(String(Math.min(60, (parseInt(customIncrement, 10) || 0) + 5)));
                              }}
                              title="Add 5 seconds"
                            >
                              +5s
                            </button>
                          </div>

                          <input
                            type="range"
                            min="0"
                            max="30"
                            value={Math.min(30, parseInt(customIncrement, 10) || 0)}
                            onChange={(e) => {
                              setSelectedTimeControl('custom');
                              setCustomIncrement(e.target.value);
                            }}
                            className="tc-range-slider"
                          />

                          <div className="tc-quick-chips-row">
                            {['0', '1', '2', '3', '5', '10', '15'].map((inc) => (
                              <button
                                key={inc}
                                type="button"
                                className={`tc-chip-btn ${customIncrement === inc ? 'active' : ''}`}
                                onClick={() => {
                                  setSelectedTimeControl('custom');
                                  setCustomIncrement(inc);
                                }}
                              >
                                +{inc}s
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Quick Archetype Calibrators */}
                      <div className="tc-custom-presets-wrap">
                        <span className="tc-presets-lbl">QUICK ARCHETYPE CALIBRATORS:</span>
                        <div className="tc-presets-row">
                          {CUSTOM_PRESETS.map((p) => {
                            const isMatch =
                              customMinutes === String(p.mins) && customIncrement === String(p.inc);
                            return (
                              <button
                                key={p.label}
                                type="button"
                                className={`tc-preset-chip ${isMatch ? 'active' : ''}`}
                                onClick={() => {
                                  setSelectedTimeControl('custom');
                                  setCustomMinutes(String(p.mins));
                                  setCustomIncrement(String(p.inc));
                                }}
                              >
                                <span className="tc-preset-name">{p.label}</span>
                                <span className="tc-preset-tag">{p.tag}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Active Selection Telemetry Monolith (HUD Bar) */}
                  <div
                    className="tc-active-summary-monolith"
                    style={{ '--summary-accent': activeTcMeta.color }}
                  >
                    <div className="summary-left">
                      <div
                        className="summary-badge"
                        style={{
                          background: `${activeTcMeta.color}18`,
                          borderColor: `${activeTcMeta.color}50`,
                          color: activeTcMeta.color
                        }}
                      >
                        <span className="summary-pulse-dot" style={{ background: activeTcMeta.color }} />
                        <span className="summary-tc-code">{activeTcMeta.tc}</span>
                        <span className="summary-tc-cat">{activeTcMeta.category.toUpperCase()}</span>
                      </div>
                      <div className="summary-details">
                        <span className="summary-title">{activeTcMeta.name}</span>
                        <span className="summary-meta-desc">
                          {activeTcMeta.mins}m Base &middot; +{activeTcMeta.inc}s Increment &middot; {activeTcMeta.estDuration}
                        </span>
                      </div>
                    </div>

                    <div className="summary-right">
                      <div className="summary-rating-box">
                        <span className="summary-rating-lbl">LADDER RATING</span>
                        <span className="summary-rating-val">{categoryRatings[activeTcMeta.category]} ELO</span>
                      </div>
                      <div className="summary-pool-box">
                        <span className="summary-pool-lbl">ARENA PROTOCOL</span>
                        <span className="summary-pool-val">Rated WebSocket</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="action-bar">
                    <button className="primary-action-btn" onClick={findGame}>
                      <Zap size={18} />
                      <div className="btn-text-stack">
                        <span className="btn-main-text">
                          Initiate Rated Matchmaking ({activeTcMeta.tc})
                        </span>
                        <span className="btn-sub-text">
                          Pair with {categoryRatings[activeTcMeta.category]} &plusmn; 200 ELO opponent
                        </span>
                      </div>
                    </button>
                    <button className="secondary-action-btn" onClick={createChallenge}>
                      <Radio size={16} />
                      <span>Broadcast Open Challenge</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Sonar Radar & Open Challenges Relay */}
              <div className="online-lobby-right-col">
                {/* Live Radar Mini-Scanner */}
                <div className="cp-console-window lobby-mini-radar-card">
                  <div className="cp-window-topbar">
                    <span className="cp-window-title">
                      <span className="cp-window-dot emerald" />
                      <span>ARENA ACTIVITY SONAR // LIVE RELAY</span>
                    </span>
                    <span className="radar-status-text">
                      <Wifi size={12} />
                      <span>ONLINE</span>
                    </span>
                  </div>

                  <div className="lobby-radar-body">
                    <div className="mini-radar-animation">
                      <div className="mini-radar-ring ring-1" />
                      <div className="mini-radar-ring ring-2" />
                      <div className="mini-radar-sweep" />
                      <div className="radar-blip blip-1" />
                      <div className="radar-blip blip-2" />
                      <div className="radar-blip blip-3" />
                      <Activity size={18} className="mini-radar-center-icon" />
                    </div>

                    <div className="mini-radar-meta">
                      <span className="radar-pool-title">GLOBAL RATED MATCH POOL</span>
                      <p className="radar-pool-desc">
                        Full-duplex WebSocket matchmaking automatically connects you to active opponents in your rating window.
                      </p>
                      <div className="radar-pills-row">
                        <span className="radar-metric-pill">~22ms PING</span>
                        <span className="radar-metric-pill">GLOBAL POOL</span>
                        <span className="radar-metric-pill">FIDE CADENCE</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Challenges Feed */}
                <div className="cp-console-window challenges-feed">
                  <div className="cp-window-topbar">
                    <span className="cp-window-title">
                      <span>OPEN CHALLENGES RELAY ({challenges.length})</span>
                    </span>
                    <span className="live-dot" />
                  </div>

                  <div className="challenges-feed-body">
                    {myChallenge && (
                      <div className="my-challenge-card">
                        <div className="pulse-ring" />
                        <div className="my-challenge-text">
                          <strong>Broadcasting your challenge...</strong>
                          <span>Cadence: {myChallenge.timeControl}</span>
                        </div>
                        <button className="cancel-my-c-btn" onClick={cancelChallenge}>
                          Cancel
                        </button>
                      </div>
                    )}

                    <div className="challenges-list">
                      {challenges.length === 0 ? (
                        <div className="empty-feed">
                          <Users size={28} className="empty-feed-icon" />
                          <p>No active open challenges in queue.</p>
                          <span className="sub-text">
                            Click &ldquo;Broadcast Open Challenge&rdquo; to post one to the lobby.
                          </span>
                        </div>
                      ) : (
                        challenges.map((challenge) => (
                          <div key={challenge.id} className="challenge-item">
                            <div className="challenge-info">
                              <span className="c-time">{challenge.timeControl}</span>
                              <span className="c-player">{challenge.username}</span>
                              <span className="c-rating">
                                {challenge.username === 'Guest' ? '' : `(${challenge.rating})`}
                              </span>
                            </div>
                            <button
                              className="accept-challenge-btn"
                              onClick={() => acceptChallenge(challenge)}
                            >
                              <span>Accept</span>
                              <ArrowRight size={13} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Sparring Teaser Card */}
                <div
                  className="cp-console-window bots-teaser"
                  onClick={() => navigate('/bots')}
                >
                  <div className="teaser-content">
                    <span className="teaser-kicker">INSTANT ZERO-WAIT SPARRING //</span>
                    <h3>3D Neural AI Personalities Arena</h3>
                    <p>Rotate through calibrated Stockfish bot personas from 400 to 2400 ELO in full 3D perspective.</p>
                  </div>
                  <div className="teaser-arrow">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            2. SCANNING / MATCHMAKING RADAR (SEARCHING)
            ==================================================================== */}
        {gameState === 'searching' && (
          <div className="searching-container cp-console-window">
            <div className="cp-window-topbar">
              <span className="cp-window-title">
                <span className="cp-window-dot amber" />
                <span>MATCHMAKING SONAR // SCANNING RELAY POOL</span>
              </span>
              <span className="search-elapsed-badge">{searchSeconds}s Elapsed</span>
            </div>

            <div className="searching-body">
              <div className="radar-animation">
                <div className="radar-compass-ring" />
                <div className="radar-circle circle-1" />
                <div className="radar-circle circle-2" />
                <div className="radar-circle circle-3" />
                <div className="radar-sweep" />
                <div className="radar-blip blip-search-1" />
                <div className="radar-blip blip-search-2" />
                <Activity size={26} className="radar-center-icon" />
              </div>

              <h2>Scanning for Opponents</h2>
              <div className="search-meta-line">
                <span className="search-meta-pill">
                  {selectedTimeControl === 'custom' ? `${customMinutes}+${customIncrement}` : selectedTimeControl}
                </span>
                <span className="search-meta-pill">Target: {myRating} ± 150 ELO</span>
                <span className="search-meta-pill">Relay: Global Pool</span>
              </div>

              <p className="search-status-sub">
                Matching you against an active player of comparable tactical strength...
              </p>

              <button className="cancel-search-btn" onClick={cancelSearch}>
                Abort Matchmaking
              </button>
            </div>
          </div>
        )}

        {/* ====================================================================
            3. ACTIVE GAMEPLAY STUDIO (PLAYING & GAME_OVER)
            ==================================================================== */}
        {(gameState === 'playing' || gameState === 'game_over') && (
          <div className="online-studio-stage">
            {/* Left: Main Chessboard Console */}
            <div className={`cp-console-window online-board-window ${isMyTurn ? 'turn-mine' : 'turn-opponent'}`}>
              <div className="cp-window-topbar">
                <div className="cp-window-title">
                  <span className={`cp-window-dot ${isMyTurn ? 'emerald' : 'violet'}`} />
                  <span>
                    ROOM #{roomId ? roomId.substring(0, 8) : 'ARENA'} //{' '}
                    {isMyTurn ? 'YOUR TURN TO MOVE' : "OPPONENT'S TURN"}
                  </span>
                </div>

                <div className="board-topbar-pills">
                  <span className="tc-tag-pill">{selectedTimeControl}</span>
                  <button
                    type="button"
                    className="flip-board-btn"
                    onClick={() =>
                      setBoardOrientation((o) => (o === 'white' ? 'black' : 'white'))
                    }
                    title="Flip Board View"
                  >
                    <Compass size={13} />
                    <span>Flip View</span>
                  </button>
                </div>
              </div>

              <div className="online-board-stage-wrap">
                {/* Opponent Player Scorebug */}
                <div
                  className={`online-scorebug opponent ${
                    (!isMyTurn && gameState === 'playing') ? 'active-turn' : ''
                  }`}
                >
                  <div className="scorebug-left">
                    <img
                      src={
                        opponent?.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${
                          opponent?.username || 'opponent'
                        }`
                      }
                      alt="Opponent"
                      className="scorebug-avatar"
                    />
                    <div className="scorebug-details">
                      <div className="scorebug-name-row">
                        <span className={`scorebug-stone ${playerColor === 'white' ? 'black' : 'white'}`} />
                        <span className="scorebug-name">{opponent?.username || 'Opponent'}</span>
                        {opponent?.username !== 'Guest' && opponent?.rating && (
                          <span className="scorebug-rating">({opponent.rating})</span>
                        )}
                        {connectionStatus === 'opponent_disconnected' && (
                          <span className="disconnect-badge">Reconnecting... (30s)</span>
                        )}
                      </div>

                      {/* Captured Pieces By Opponent */}
                      <div className="captured-pieces-strip">
                        {(playerColor === 'white' ? materialData.capturedByBlack : materialData.capturedByWhite).map((p, idx) => (
                          <span key={idx} className="captured-piece-glyph">
                            {p.type.toUpperCase()}
                          </span>
                        ))}
                        {(playerColor === 'white' ? materialData.blackAdvantage : materialData.whiteAdvantage) > 0 && (
                          <span className="material-adv-pill">
                            +{playerColor === 'white' ? materialData.blackAdvantage : materialData.whiteAdvantage}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Opponent Clock */}
                  <div
                    className={`scorebug-clock ${
                      (playerColor === 'white' ? blackTime : whiteTime) < 20
                        ? 'low-time'
                        : ''
                    }`}
                  >
                    <Clock size={16} />
                    <span>
                      {playerColor === 'white' ? formatTime(blackTime) : formatTime(whiteTime)}
                    </span>
                  </div>

                  {showDrawOfferBubble && (
                    <div className="draw-offer-bubble">
                      <div className="bubble-text">Opponent offered a draw</div>
                      <div className="bubble-actions">
                        <button onClick={handleAcceptDraw} className="bubble-btn accept">
                          Accept
                        </button>
                        <button onClick={handleDeclineDraw} className="bubble-btn decline">
                          Decline
                        </button>
                      </div>
                    </div>
                  )}

                  {gameNotification && (
                    <div className="notification-bubble">{gameNotification}</div>
                  )}

                  {chatBubble && (
                    <div className="chat-bubble-overhead">{chatBubble}</div>
                  )}
                </div>

                {/* Center Chessboard Frame */}
                <div className="online-chessboard-frame">
                  <Chessboard
                    id="online-game-board"
                    options={{
                      position: game.fen(),
                      onPieceDrop: onDrop,
                      onSquareClick: onSquareClick,
                      animationDurationInMs: animationSpeed,
                      showAnimations: animationSpeed > 0,
                      boardOrientation: boardOrientation,
                      allowDragging: gameState === 'playing',
                      showNotation: showNotationFromCustomization,
                      squareStyles: customSquareStyles,
                      darkSquareStyle: { backgroundColor: darkSquareColor || '#334155' },
                      lightSquareStyle: { backgroundColor: lightSquareColor || '#cbd5e1' },
                      pieces: getCustomPieces(pieceSet),
                      customPieces: getCustomPieces(pieceSet)
                    }}
                  />
                </div>

                {/* You (Player) Scorebug */}
                <div
                  className={`online-scorebug mine ${
                    (isMyTurn && gameState === 'playing') ? 'active-turn' : ''
                  }`}
                >
                  <div className="scorebug-left">
                    <img
                      src={
                        user?.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${
                          user?.username || 'guest'
                        }`
                      }
                      alt="You"
                      className="scorebug-avatar"
                    />
                    <div className="scorebug-details">
                      <div className="scorebug-name-row">
                        <span className={`scorebug-stone ${playerColor === 'white' ? 'white' : 'black'}`} />
                        <span className="scorebug-name">{user?.username || 'You'}</span>
                        <span className="scorebug-rating">({myRating})</span>
                      </div>

                      {/* Captured Pieces By You */}
                      <div className="captured-pieces-strip">
                        {(playerColor === 'white' ? materialData.capturedByWhite : materialData.capturedByBlack).map((p, idx) => (
                          <span key={idx} className="captured-piece-glyph">
                            {p.type.toUpperCase()}
                          </span>
                        ))}
                        {(playerColor === 'white' ? materialData.whiteAdvantage : materialData.blackAdvantage) > 0 && (
                          <span className="material-adv-pill">
                            +{playerColor === 'white' ? materialData.whiteAdvantage : materialData.blackAdvantage}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Player Clock */}
                  <div
                    className={`scorebug-clock ${
                      (playerColor === 'white' ? whiteTime : blackTime) < 20
                        ? 'low-time'
                        : ''
                    }`}
                  >
                    <Clock size={16} />
                    <span>
                      {playerColor === 'white' ? formatTime(whiteTime) : formatTime(blackTime)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Sidebar Console (Moves, Chat, Telemetry) */}
            <div className="cp-console-window online-sidebar-window">
              <div className="cp-window-topbar">
                <div className="sidebar-tabs-nav">
                  <button
                    type="button"
                    className={`sidebar-tab-pill ${activeTab === 'moves' ? 'active' : ''}`}
                    onClick={() => setActiveTab('moves')}
                  >
                    <ScrollText size={13} />
                    <span>Moves ({moveHistory.length})</span>
                  </button>
                  <button
                    type="button"
                    className={`sidebar-tab-pill ${activeTab === 'chat' ? 'active' : ''}`}
                    onClick={() => setActiveTab('chat')}
                  >
                    <MessageSquare size={13} />
                    <span>Chat {chatMessages.length > 0 && `(${chatMessages.length})`}</span>
                  </button>
                  <button
                    type="button"
                    className={`sidebar-tab-pill ${activeTab === 'telemetry' ? 'active' : ''}`}
                    onClick={() => setActiveTab('telemetry')}
                  >
                    <BarChart2 size={13} />
                    <span>Room</span>
                  </button>
                </div>
              </div>

              <div className="online-sidebar-body">
                {/* Moves List Tab */}
                {activeTab === 'moves' && (
                  <div className="moves-panel-wrap">
                    <div className="moves-list-scroll">
                      {moveHistory.length === 0 ? (
                        <div className="no-moves-msg">
                          <span>Game initiated. Awaiting opening moves...</span>
                        </div>
                      ) : (
                        <div className="moves-grid-table">
                          {moveHistory.reduce((pairs, move, index) => {
                            if (index % 2 === 0) {
                              pairs.push([move, moveHistory[index + 1]]);
                            }
                            return pairs;
                          }, []).map((pair, i) => (
                            <div key={i} className="move-table-row">
                              <span className="row-num">{i + 1}.</span>
                              <span className="row-ply white">{pair[0]}</span>
                              <span className="row-ply black">{pair[1] || ''}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Chat Tab */}
                {activeTab === 'chat' && (
                  <div className="chat-panel-wrap">
                    {/* Quick Preset Phrases Bar */}
                    <div className="quick-chat-presets-bar">
                      {QUICK_CHAT_PRESETS.map((phrase) => (
                        <button
                          key={phrase}
                          type="button"
                          className="quick-chat-chip"
                          onClick={() => sendQuickChat(phrase)}
                        >
                          {phrase}
                        </button>
                      ))}
                    </div>

                    <div className="chat-messages-scroll">
                      {chatMessages.length === 0 ? (
                        <div className="no-chat-msg">
                          <span>Direct in-game chat is active. Send a message to your opponent or click a quick phrase above.</span>
                        </div>
                      ) : (
                        chatMessages.map((msg, i) => {
                          const isMine = msg.sender === (user?.username || 'Guest');
                          return (
                            <div
                              key={i}
                              className={`chat-bubble-row ${isMine ? 'mine' : 'theirs'}`}
                            >
                              <span className="chat-sender-tag">{msg.sender}</span>
                              <span className="chat-bubble-text">{msg.message}</span>
                            </div>
                          );
                        })
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={sendChat} className="chat-input-bar">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Type message to opponent..."
                      />
                      <button type="submit" disabled={!chatInput.trim()}>
                        <Send size={13} />
                      </button>
                    </form>
                  </div>
                )}

                {/* Telemetry Tab */}
                {activeTab === 'telemetry' && (
                  <div className="telemetry-panel-wrap">
                    <div className="telemetry-info-cell">
                      <div className="t-row-head">
                        <span className="t-lbl">ROOM IDENTIFIER</span>
                        <button
                          type="button"
                          className="copy-telemetry-btn"
                          onClick={() => copyToClipboard(roomId || '', 'room')}
                        >
                          {copiedField === 'room' ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                          <span>{copiedField === 'room' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <span className="t-val">{roomId || 'N/A'}</span>
                    </div>

                    <div className="telemetry-info-cell">
                      <span className="t-lbl">CADENCE FORMAT</span>
                      <span className="t-val">{selectedTimeControl}</span>
                    </div>

                    <div className="telemetry-info-cell">
                      <span className="t-lbl">ACTIVE RATING CATEGORY</span>
                      <span className="t-val">{getRatingCategory(selectedTimeControl).toUpperCase()} CLASS</span>
                    </div>

                    <div className="telemetry-info-cell">
                      <div className="t-row-head">
                        <span className="t-lbl">FEN STRING</span>
                        <button
                          type="button"
                          className="copy-telemetry-btn"
                          onClick={() => copyToClipboard(game.fen(), 'fen')}
                        >
                          {copiedField === 'fen' ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                          <span>{copiedField === 'fen' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <span className="t-val mono">{game.fen()}</span>
                    </div>

                    <div className="telemetry-info-cell">
                      <span className="t-lbl">PROTOCOL & TRANSPORT</span>
                      <span className="t-val">WebSocket · Full-Duplex Relay</span>
                    </div>
                  </div>
                )}

                {/* Tactical Actions Bar */}
                {gameState === 'playing' ? (
                  <div className="online-controls-bar">
                    <button
                      type="button"
                      className="ctrl-action-btn draw-btn"
                      onClick={handleOfferDraw}
                      disabled={drawOffered || moveHistory.length < 2}
                    >
                      <span>{drawOffered ? 'Draw Offered' : '½ Offer Draw'}</span>
                    </button>

                    <button
                      type="button"
                      className="ctrl-action-btn resign-btn"
                      onClick={resign}
                    >
                      <Flag size={14} />
                      <span>Resign</span>
                    </button>
                  </div>
                ) : (
                  <div className="online-controls-bar game-over-bar">
                    <button
                      type="button"
                      className="ctrl-action-btn primary"
                      onClick={playAgain}
                    >
                      <RotateCcw size={14} />
                      <span>Play Again</span>
                    </button>
                    <button
                      type="button"
                      className="ctrl-action-btn secondary"
                      onClick={() => setShowGameOverModal(true)}
                    >
                      <Trophy size={14} />
                      <span>Show Results</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            GAME OVER MODAL OVERLAY
            ==================================================================== */}
        {showGameOverModal && (
          <div className="modal-backdrop">
            <div className="modal-content cp-console-window game-over-modal-card">
              <div className="cp-window-topbar">
                <span className="cp-window-title">
                  <span className="cp-window-dot gold" />
                  <span>MATCH CONCLUDED // RESULT TELEMETRY</span>
                </span>
              </div>

              <div className="game-over-modal-body">
                <div
                  className={`game-over-banner ${
                    gameResult?.result === 'draw'
                      ? 'draw'
                      : gameResult?.result === playerColor
                      ? 'win'
                      : 'loss'
                  }`}
                >
                  <Trophy size={32} className="banner-icon" />
                  <div className="banner-text-wrap">
                    <h2>
                      {gameResult?.result === 'draw'
                        ? 'Drawn Game'
                        : gameResult?.result === playerColor
                        ? 'Victory Achieved'
                        : 'Defeat'}
                    </h2>
                    <p>{gameResult?.reason || 'Game completed.'}</p>
                  </div>
                </div>

                <div className="game-over-stats-grid">
                  <div className="go-stat-cell">
                    <span className="go-stat-code">TOTAL PLIES</span>
                    <span className="go-stat-val">{moveHistory.length}</span>
                  </div>
                  <div className="go-stat-cell">
                    <span className="go-stat-code">TIME CONTROL</span>
                    <span className="go-stat-val">{selectedTimeControl}</span>
                  </div>
                  <div className="go-stat-cell">
                    <span className="go-stat-code">OPPONENT</span>
                    <span className="go-stat-val">{opponent?.username || 'Opponent'}</span>
                  </div>
                </div>

                <div className="modal-actions-bar">
                  <button className="primary-action-btn" onClick={playAgain}>
                    <RotateCcw size={15} />
                    <span>Play Again</span>
                  </button>

                  <button
                    className="secondary-action-btn"
                    onClick={() =>
                      navigate('/analysis', {
                        state: {
                          moves: moveHistory,
                          playerColor,
                          opponentName: opponent?.username,
                          source: 'online',
                          result:
                            gameResult?.result === playerColor
                              ? 'win'
                              : gameResult?.result === 'draw'
                              ? 'draw'
                              : 'loss'
                        }
                      })
                    }
                  >
                    <ExternalLink size={15} />
                    <span>Analyze in Studio</span>
                  </button>

                  <button
                    className="review-board-btn"
                    onClick={() => setShowGameOverModal(false)}
                  >
                    Inspect Final Board
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showPromotion && (
        <PromotionDialog color={playerColor} onSelect={handlePromotionSelect} />
      )}

      {showResignModal && (
        <div className="modal-backdrop">
          <div className="modal-content cp-console-window resign-confirm-card">
            <div className="cp-window-topbar">
              <span className="cp-window-title">
                <span className="cp-window-dot rose" />
                <span>CONFIRM RESIGNATION</span>
              </span>
            </div>
            <div className="resign-confirm-body">
              <p>Are you sure you want to resign this rated match? Your rating will be adjusted accordingly.</p>
              <div className="modal-actions">
                <button
                  className="modal-btn secondary"
                  onClick={() => setShowResignModal(false)}
                >
                  Continue Game
                </button>
                <button className="modal-btn danger" onClick={confirmResign}>
                  Confirm Resign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
