import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { puzzleService } from '../../services/puzzleService';
import { puzzleStatsService } from '../../services/puzzleStatsService';
import PuzzleBoard from '../../Components/PuzzleBoard/PuzzleBoard';
import PuzzleSubnav from '../../Components/Puzzles/PuzzleSubnav';
import PageHeader, { PageAmbient } from '../../Components/UI/PageHeader';
import {
  Zap,
  Timer,
  Trophy,
  Flame,
  RotateCcw,
  AlertTriangle,
  Play,
  BarChart3,
  Bot,
  ShieldCheck,
  FastForward,
  CheckCircle2,
  XCircle,
  Sparkles
} from 'lucide-react';
import './puzzleRush.css';

const TIME_OPTIONS = {
  '3': { seconds: 3 * 60, label: '3 min', description: 'Quick sprint' },
  '5': { seconds: 5 * 60, label: '5 min', description: 'Standard championship' },
  '10': { seconds: 10 * 60, label: '10 min', description: 'Tactical marathon' }
};

const DIFFICULTY_OPTIONS = {
  all: { label: 'All Levels', description: 'Mixed dynamic pool' },
  beginner: { label: 'Beginner', description: '800 – 1199 ELO' },
  intermediate: { label: 'Intermediate', description: '1200 – 1599 ELO' },
  advanced: { label: 'Advanced', description: '1600 – 1999 ELO' },
  expert: { label: 'Expert', description: '2000 – 2400 ELO' }
};

const PuzzleRushPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const timeMode = searchParams.get('time') || '5';

  const [gameState, setGameState] = useState('ready'); // 'ready' | 'playing' | 'finished'
  const [timeLeft, setTimeLeft] = useState(TIME_OPTIONS[timeMode]?.seconds || 300);
  const [score, setScore] = useState(0);
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);
  const [puzzlesAttempted, setPuzzlesAttempted] = useState(0);
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [isLoadingPuzzle, setIsLoadingPuzzle] = useState(false);
  const [difficulty, setDifficulty] = useState('all');
  const [penaltyFlash, setPenaltyFlash] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setGameState('finished');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [gameState, timeLeft]);

  // Fetch AI feedback upon completion
  useEffect(() => {
    if (gameState === 'finished' && isAuthenticated && !aiFeedback) {
      setLoadingFeedback(true);
      puzzleStatsService
        .getSessionFeedback({
          mode: 'rush',
          solved: puzzlesSolved,
          failed: puzzlesAttempted - puzzlesSolved,
          totalAttempted: puzzlesAttempted,
          duration: `${TIME_OPTIONS[timeMode]?.label || '5 min'}`,
          score: score
        })
        .then((res) => {
          if (res?.success) setAiFeedback(res.data);
        })
        .catch((err) => console.error('Failed to get AI feedback:', err))
        .finally(() => setLoadingFeedback(false));
    }
  }, [gameState, isAuthenticated, puzzlesSolved, puzzlesAttempted, timeMode, score, aiFeedback]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerClass = () => {
    if (timeLeft <= 10) return 'critical';
    if (timeLeft <= 30) return 'low';
    return '';
  };

  const loadNewPuzzle = useCallback(
    async (selectedDifficulty) => {
      setIsLoadingPuzzle(true);
      try {
        const filters =
          selectedDifficulty && selectedDifficulty !== 'all'
            ? { difficulty: selectedDifficulty }
            : {};
        const puzzle = await puzzleService.getPuzzleWithFilters(filters);
        setCurrentPuzzle(puzzle);
      } catch (error) {
        console.error('Error loading puzzle:', error);
      } finally {
        setIsLoadingPuzzle(false);
      }
    },
    []
  );

  const startGame = async () => {
    setTimeLeft(TIME_OPTIONS[timeMode]?.seconds || 300);
    setScore(0);
    setPuzzlesSolved(0);
    setPuzzlesAttempted(0);
    setPenaltyFlash(false);
    setAiFeedback(null);
    setGameState('playing');
    puzzleService.resetSession();
    await loadNewPuzzle(difficulty);
  };

  const handleCorrectSolve = useCallback(async () => {
    setScore((prev) => prev + 1);
    setPuzzlesSolved((prev) => prev + 1);
    setPuzzlesAttempted((prev) => prev + 1);

    if (isAuthenticated && currentPuzzle) {
      try {
        await puzzleStatsService.recordAttempt({
          puzzleId: currentPuzzle.id,
          solved: true,
          puzzleRating: currentPuzzle.rating,
          themes: currentPuzzle.themes || [],
          mode: 'rush',
          difficulty
        });
      } catch (err) {
        console.error('Failed to record attempt:', err);
      }
    }

    // Auto-advance in Puzzle Rush with short delay for dopamine
    setTimeout(() => {
      loadNewPuzzle(difficulty);
    }, 280);
  }, [currentPuzzle, isAuthenticated, difficulty, loadNewPuzzle]);

  const handleFailedMove = useCallback(async () => {
    setPuzzlesAttempted((prev) => prev + 1);

    // Apply -5s time penalty
    setTimeLeft((prev) => Math.max(0, prev - 5));
    setPenaltyFlash(true);
    setTimeout(() => setPenaltyFlash(false), 900);

    if (isAuthenticated && currentPuzzle) {
      try {
        await puzzleStatsService.recordAttempt({
          puzzleId: currentPuzzle.id,
          solved: false,
          puzzleRating: currentPuzzle.rating,
          themes: currentPuzzle.themes || [],
          mode: 'rush',
          difficulty
        });
      } catch (err) {
        console.error('Failed to record attempt:', err);
      }
    }

    // Advance to next puzzle on mistake in rush
    setTimeout(() => {
      loadNewPuzzle(difficulty);
    }, 450);
  }, [currentPuzzle, isAuthenticated, difficulty, loadNewPuzzle]);

  const handleSkip = () => {
    handleFailedMove();
  };

  const accuracy =
    puzzlesAttempted > 0
      ? Math.round((puzzlesSolved / puzzlesAttempted) * 100)
      : 100;

  // --------------------------------------------------------------------------
  // Results Screen
  // --------------------------------------------------------------------------
  if (gameState === 'finished') {
    return (
      <div className="puzzle-rush-page cp-subpage">
        <PageAmbient watermark="RUSH" theme="gold" />

        <PageHeader
          badge="SPRINT TIMEOUT · FINAL TELEMETRY"
          title="Puzzle Rush"
          accent="Summary"
          subtitle="Time has expired! Inspect your high-velocity calculation metrics and AI Coach evaluation."
          theme="gold"
          backTo="/puzzles"
          backLabel="Tactical Hub"
        />

        <PuzzleSubnav />

        <div className="rush-container">
          <div className="rush-results-card cp-console-window">
            <div className="cp-window-topbar">
              <span className="cp-window-title">
                <span className="cp-window-dot rose" />
                <span>RUSH MISSION COMPLETE // RESULTS DEBRIEF</span>
              </span>
              <span className="rush-score-chip">{score} Solved</span>
            </div>

            <div className="rush-results-body">
              <div className="rush-summary-grid">
                <div className="rush-stat-box highlight">
                  <span className="r-stat-code">SCORE // SOLVED</span>
                  <div className="r-stat-val gold">{score}</div>
                  <span className="r-stat-lbl">Puzzles Completed</span>
                </div>
                <div className="rush-stat-box">
                  <span className="r-stat-code">METRIC // ACCURACY</span>
                  <div className="r-stat-val emerald">{accuracy}%</div>
                  <span className="r-stat-lbl">Tactical Precision</span>
                </div>
                <div className="rush-stat-box">
                  <span className="r-stat-code">METRIC // ATTEMPTS</span>
                  <div className="r-stat-val cyan">{puzzlesAttempted}</div>
                  <span className="r-stat-lbl">Total Attempted</span>
                </div>
                <div className="rush-stat-box">
                  <span className="r-stat-code">MODE // FORMAT</span>
                  <div className="r-stat-val violet">{TIME_OPTIONS[timeMode]?.label}</div>
                  <span className="r-stat-lbl">Sprint Duration</span>
                </div>
              </div>

              {/* AI Coach Analysis */}
              {isAuthenticated && (
                <div className="rush-coach-wrap">
                  <div className="coach-header-line">
                    <Bot size={18} className="coach-icon" />
                    <span>Neural Coach Velocity Debrief</span>
                  </div>

                  {loadingFeedback ? (
                    <div className="coach-loading">
                      <div className="loading-spinner" />
                      <span>Analyzing tactical sprint cadence...</span>
                    </div>
                  ) : aiFeedback ? (
                    <div className="coach-content">
                      <p className="coach-summary">{aiFeedback.summary}</p>
                      {aiFeedback.tips && aiFeedback.tips.length > 0 && (
                        <div className="coach-tips-grid">
                          {aiFeedback.tips.map((tip, i) => (
                            <div key={i} className="coach-tip-item">
                              <span className="tip-bullet">›</span>
                              <span>{tip}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {aiFeedback.strength && (
                        <div className="coach-strength-chip">
                          <ShieldCheck size={14} />
                          <span>Pace Strength: {aiFeedback.strength}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="coach-empty">
                      Sprint recorded. Solve consistently to build automatic reflexes.
                    </p>
                  )}
                </div>
              )}

              {!isAuthenticated && (
                <div className="guest-nudge-box">
                  <AlertTriangle size={18} className="guest-warn-icon" />
                  <div className="guest-nudge-content">
                    <strong>Guest Record</strong>
                    <span>Sign in to save your score to the Global Rush Leaderboard!</span>
                  </div>
                  <Link to="/signin" className="guest-signin-btn">
                    Sign In →
                  </Link>
                </div>
              )}

              <div className="rush-actions-row">
                <button
                  type="button"
                  className="rush-primary-btn"
                  onClick={startGame}
                >
                  <RotateCcw size={15} />
                  <span>Rush Again</span>
                </button>
                <Link to="/puzzles/leaderboard" className="rush-secondary-btn">
                  <Trophy size={15} />
                  <span>View Global Standings</span>
                </Link>
                <Link to="/puzzles" className="rush-secondary-btn">
                  <span>Return to Hub</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Pre-game Sprint Terminal
  // --------------------------------------------------------------------------
  if (gameState !== 'playing') {
    return (
      <div className="puzzle-rush-page cp-subpage">
        <PageAmbient watermark="RUSH" theme="gold" />

        <PageHeader
          badge="HIGH-VELOCITY SPRINT · REAL-TIME SPEED DRILL"
          title="Puzzle"
          accent="Rush"
          subtitle="Race against the clock to solve as many tactical combinations as possible before time expires."
          theme="gold"
          backTo="/puzzles"
          backLabel="Tactical Hub"
        />

        <PuzzleSubnav />

        <div className="rush-container">
          <div className="rush-briefing-grid">
            {/* Left: Configuration & Launchpad */}
            <div className="cp-console-window rush-launch-console">
              <div className="cp-window-topbar">
                <span className="cp-window-title">
                  <span className="cp-window-dot rose" />
                  <span>SPRINT TERMINAL // SPRINT CONFIGURATION</span>
                </span>
                <span className="rush-sys-id">VELOCITY-01</span>
              </div>

              <div className="rush-launch-body">
                {/* Time Mode Selector */}
                <div className="rush-section-group">
                  <label className="rush-group-lbl">SELECT DURATION</label>
                  <div className="rush-duration-grid">
                    {Object.entries(TIME_OPTIONS).map(([key, val]) => (
                      <button
                        key={key}
                        type="button"
                        className={`duration-pill-btn ${timeMode === key ? 'active' : ''}`}
                        onClick={() => navigate(`/puzzles/rush?time=${key}`)}
                      >
                        <span className="dur-val">{val.label}</span>
                        <span className="dur-desc">{val.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty Selector */}
                <div className="rush-section-group">
                  <label className="rush-group-lbl">TACTICAL DIFFICULTY</label>
                  <div className="rush-diff-grid">
                    {Object.entries(DIFFICULTY_OPTIONS).map(([key, val]) => (
                      <button
                        key={key}
                        type="button"
                        className={`diff-pill-btn ${difficulty === key ? 'active' : ''}`}
                        onClick={() => setDifficulty(key)}
                      >
                        <span className="diff-val">{val.label}</span>
                        <span className="diff-desc">{val.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rules Strip */}
                <div className="rush-rules-strip">
                  <div className="r-rule-item">
                    <span className="r-rule-badge green">+1</span>
                    <span>Point per completed combination</span>
                  </div>
                  <div className="r-rule-item">
                    <span className="r-rule-badge red">-5s</span>
                    <span>Penalty on incorrect moves</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="rush-ignite-btn"
                  onClick={startGame}
                >
                  <Zap size={18} />
                  <span>Ignite Puzzle Rush</span>
                </button>
              </div>
            </div>

            {/* Right: Intel Console */}
            <div className="cp-console-window rush-intel-console">
              <div className="cp-window-topbar">
                <span className="cp-window-title">
                  <span>TELEMETRY INTEL // SPEED DRILL</span>
                </span>
              </div>

              <div className="rush-intel-body">
                <div className="intel-cell">
                  <span className="intel-code">TACTICAL MOTIFS</span>
                  <span className="intel-val">Rapid Recognition</span>
                  <span className="intel-sub">Forks, pins, back-ranks, and sacrifices</span>
                </div>

                <div className="intel-cell">
                  <span className="intel-code">CLOCK PRESSURE</span>
                  <span className="intel-val">{TIME_OPTIONS[timeMode]?.seconds}s Continuous</span>
                  <span className="intel-sub">Simulates blitz and bullet time-trouble</span>
                </div>

                <div className="intel-cell">
                  <span className="intel-code">CORPUS STATUS</span>
                  <span className="intel-val">Active Random Seed</span>
                  <span className="intel-sub">Dynamic pool populated from master games</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Active Gameplay Session
  // --------------------------------------------------------------------------
  return (
    <div className="puzzle-rush-page playing cp-subpage">
      <PageAmbient watermark="RUSH" theme="gold" />

      <PageHeader
        badge="ACTIVE SPRINT · HIGH-VELOCITY PULSE"
        title="Puzzle"
        accent="Rush"
        subtitle="Speed calculation session in progress. Clock is ticking!"
        theme="gold"
        rightElement={
          <button
            type="button"
            className="rush-abort-btn"
            onClick={() => setGameState('finished')}
          >
            End Sprint
          </button>
        }
      />

      <PuzzleSubnav />

      <div className="rush-container">
        {/* Top High-Intensity Rush HUD */}
        <div className="cp-console-window rush-live-hud">
          {/* Big Neon Digital Clock */}
          <div className={`rush-hud-cell timer-cell ${getTimerClass()} ${penaltyFlash ? 'penalty-active' : ''}`}>
            <span className="hud-code">REMAINING TIME</span>
            <div className="rush-clock-wrap">
              <Timer size={22} className="rush-clock-icon" />
              <span className="rush-clock-digits">{formatTime(timeLeft)}</span>
              {penaltyFlash && <span className="rush-penalty-pop">-5s</span>}
            </div>
          </div>

          <div className="rush-hud-cell score-cell">
            <span className="hud-code">RUSH SCORE</span>
            <span className="rush-score-digits">{score}</span>
          </div>

          <div className="rush-hud-cell">
            <span className="hud-code">ACCURACY</span>
            <span className="rush-hud-val cyan">{accuracy}%</span>
          </div>

          <div className="rush-hud-cell">
            <span className="hud-code">PACE</span>
            <span className="rush-hud-val violet">
              {timeLeft < (TIME_OPTIONS[timeMode]?.seconds || 300)
                ? (
                    (score /
                      Math.max(
                        1,
                        (TIME_OPTIONS[timeMode]?.seconds || 300) - timeLeft
                      )) *
                    60
                  ).toFixed(1)
                : '0.0'}{' '}
              / min
            </span>
          </div>
        </div>

        {/* Board Window & Skip Control */}
        <div className="rush-stage-layout">
          <div className="cp-console-window rush-board-window">
            <div className="cp-window-topbar">
              <span className="cp-window-title">
                <span className="cp-window-dot rose" />
                <span>
                  TACTICAL SPRINT COMBINATION //{' '}
                  {currentPuzzle?.id ? `#${currentPuzzle.id}` : 'ACTIVE'}
                </span>
              </span>

              <button
                type="button"
                className="rush-skip-btn"
                onClick={handleSkip}
                title="Skip puzzle with -5s penalty"
              >
                <FastForward size={13} />
                <span>Skip (-5s)</span>
              </button>
            </div>

            <div className="rush-board-body">
              {isLoadingPuzzle ? (
                <div className="puzzle-board-loading">
                  <div className="loading-spinner" />
                  <p>Queuing next tactical sprint position...</p>
                </div>
              ) : currentPuzzle ? (
                <PuzzleBoard
                  key={`rush-${currentPuzzle.id}`}
                  puzzle={currentPuzzle}
                  onSolve={handleCorrectSolve}
                  onFail={handleFailedMove}
                  showControls={false}
                  autoAdvance={true}
                  allowRetry={false}
                />
              ) : (
                <div className="puzzle-board-loading">
                  <p>Initializing position...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PuzzleRushPage;
