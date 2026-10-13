import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { puzzleService } from '../../services/puzzleService';
import { puzzleStatsService } from '../../services/puzzleStatsService';
import PuzzleBoard from '../../Components/PuzzleBoard/PuzzleBoard';
import PuzzleSubnav from '../../Components/Puzzles/PuzzleSubnav';
import PageHeader, { PageAmbient } from '../../Components/UI/PageHeader';
import {
  TrendingUp,
  Trophy,
  Target,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Play,
  ShieldCheck,
  Zap,
  Bot
} from 'lucide-react';
import './puzzleRated.css';

const INITIAL_RATING = 1200;
const K_FACTOR = 32;

const PuzzleRatedPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [rating, setRating] = useState(INITIAL_RATING);
  const [peakRating, setPeakRating] = useState(INITIAL_RATING);
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);
  const [puzzlesAttempted, setPuzzlesAttempted] = useState(0);
  const [lastChange, setLastChange] = useState(null);
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [isLoadingPuzzle, setIsLoadingPuzzle] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [sessionJustEnded, setSessionJustEnded] = useState(false);
  const [loadingRating, setLoadingRating] = useState(true);
  const [puzzleOutcome, setPuzzleOutcome] = useState(null); // 'solved' | 'failed' | null

  // Fetch rating from backend on mount
  useEffect(() => {
    if (isAuthenticated) {
      puzzleStatsService
        .getRating()
        .then((res) => {
          if (res?.success) {
            setRating(res.data.rating);
            setPeakRating(res.data.peakRating || res.data.rating);
          }
        })
        .catch((err) => console.error('Failed to fetch rating:', err))
        .finally(() => setLoadingRating(false));
    } else {
      setLoadingRating(false);
    }
  }, [isAuthenticated]);

  const loadNewPuzzle = useCallback(async (currentRating) => {
    setIsLoadingPuzzle(true);
    setPuzzleOutcome(null);

    try {
      const puzzle = await puzzleService.getPuzzleByRating(currentRating);
      setCurrentPuzzle(puzzle);
    } catch (error) {
      console.error('Error loading puzzle:', error);
    } finally {
      setIsLoadingPuzzle(false);
    }
  }, []);

  const startSession = async () => {
    setSessionActive(true);
    setSessionJustEnded(false);
    setPuzzlesSolved(0);
    setPuzzlesAttempted(0);
    setLastChange(null);
    setPuzzleOutcome(null);
    await loadNewPuzzle(rating);
  };

  const endSession = async () => {
    setSessionActive(false);
    setCurrentPuzzle(null);

    if (puzzlesAttempted > 0) {
      setSessionJustEnded(true);
      if (isAuthenticated) {
        setLoadingFeedback(true);
        try {
          const res = await puzzleStatsService.getSessionFeedback({
            mode: 'rated',
            solved: puzzlesSolved,
            failed: puzzlesAttempted - puzzlesSolved,
            totalAttempted: puzzlesAttempted
          });
          if (res.success) setAiFeedback(res.data);
        } catch (err) {
          console.error('Failed to get AI feedback:', err);
        } finally {
          setLoadingFeedback(false);
        }
      }
    }
  };

  const handleCorrectSolve = useCallback(async () => {
    setPuzzleOutcome('solved');
    setPuzzlesSolved((prev) => prev + 1);
    setPuzzlesAttempted((prev) => prev + 1);

    let newRating = rating;

    if (isAuthenticated && currentPuzzle) {
      try {
        const res = await puzzleStatsService.recordAttempt({
          puzzleId: currentPuzzle.id,
          solved: true,
          puzzleRating: currentPuzzle.rating,
          themes: currentPuzzle.themes || [],
          mode: 'rated'
        });
        if (res.success) {
          newRating = res.data.newRating;
          setRating(newRating);
          setLastChange(res.data.ratingChange);
          if (res.data.peakRating > peakRating) {
            setPeakRating(res.data.peakRating);
          }
        }
      } catch (err) {
        console.error('Failed to record attempt:', err);
      }
    } else {
      // Guest calculation
      const expectedScore =
        1 / (1 + Math.pow(10, ((currentPuzzle?.rating || rating) - rating) / 400));
      const change = Math.round(K_FACTOR * (1 - expectedScore));
      newRating = rating + change;
      setRating(newRating);
      setLastChange(change);
      if (newRating > peakRating) setPeakRating(newRating);
    }
  }, [currentPuzzle, isAuthenticated, rating, peakRating]);

  const handleFailedMove = useCallback(async () => {
    if (puzzleOutcome === 'failed') return; // Prevent double-penalty
    setPuzzleOutcome('failed');
    setPuzzlesAttempted((prev) => prev + 1);

    let newRating = rating;

    if (isAuthenticated && currentPuzzle) {
      try {
        const res = await puzzleStatsService.recordAttempt({
          puzzleId: currentPuzzle.id,
          solved: false,
          puzzleRating: currentPuzzle.rating,
          themes: currentPuzzle.themes || [],
          mode: 'rated'
        });
        if (res.success) {
          newRating = res.data.newRating;
          setRating(newRating);
          setLastChange(res.data.ratingChange);
        }
      } catch (err) {
        console.error('Failed to record attempt:', err);
      }
    } else {
      const expectedScore =
        1 / (1 + Math.pow(10, ((currentPuzzle?.rating || rating) - rating) / 400));
      const change = Math.round(K_FACTOR * (0 - expectedScore));
      newRating = Math.max(100, rating + change);
      setRating(newRating);
      setLastChange(change);
    }
  }, [currentPuzzle, isAuthenticated, rating, puzzleOutcome]);

  const accuracy =
    puzzlesAttempted > 0
      ? Math.round((puzzlesSolved / puzzlesAttempted) * 100)
      : 100;

  // Session Results Screen
  if (sessionJustEnded) {
    return (
      <div className="puzzle-rated-page cp-subpage">
        <PageAmbient watermark="RATED" theme="classic" />

        <PageHeader
          badge="RATED TRACK COMPLETE · SESSION TELEMETRY"
          title="Session"
          accent="Summary"
          subtitle="Review your tactical accuracy, rating shifts, and AI Coach calculation breakdown."
          theme="classic"
          backTo="/puzzles"
          backLabel="Tactical Hub"
        />

        <PuzzleSubnav />

        <div className="rated-container">
          <div className="rated-results-card cp-console-window">
            <div className="cp-window-topbar">
              <span className="cp-window-title">
                <span className="cp-window-dot emerald" />
                <span>RATED SESSION DEBRIEF // SYS-RESULTS</span>
              </span>
              <span className="rated-rating-tag">{rating} ELO</span>
            </div>

            <div className="rated-results-body">
              <div className="rated-summary-grid">
                <div className="summary-stat-box">
                  <span className="stat-code">METRIC-01</span>
                  <div className="stat-val emerald">{rating}</div>
                  <span className="stat-lbl">Final ELO Rating</span>
                </div>
                <div className="summary-stat-box">
                  <span className="stat-code">METRIC-02</span>
                  <div className="stat-val gold">{peakRating}</div>
                  <span className="stat-lbl">Peak Rating</span>
                </div>
                <div className="summary-stat-box">
                  <span className="stat-code">METRIC-03</span>
                  <div className="stat-val cyan">{accuracy}%</div>
                  <span className="stat-lbl">Tactical Precision</span>
                </div>
                <div className="summary-stat-box">
                  <span className="stat-code">METRIC-04</span>
                  <div className="stat-val violet">{puzzlesSolved}/{puzzlesAttempted}</div>
                  <span className="stat-lbl">Solved / Attempted</span>
                </div>
              </div>

              {/* AI Coach Analysis */}
              {isAuthenticated && (
                <div className="rated-ai-coach-wrap">
                  <div className="coach-header-line">
                    <Bot size={18} className="coach-icon" />
                    <span className="coach-title">Neural Coach Analysis</span>
                  </div>

                  {loadingFeedback ? (
                    <div className="coach-loading">
                      <div className="loading-spinner" />
                      <span>Synthesizing session telemetry...</span>
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
                          <span>Identified Strength: {aiFeedback.strength}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="coach-empty">
                      Keep solving puzzles to unlock deeper calculation patterns.
                    </p>
                  )}
                </div>
              )}

              {!isAuthenticated && (
                <div className="guest-nudge-box">
                  <AlertTriangle size={18} className="guest-warn-icon" />
                  <div className="guest-nudge-content">
                    <strong>Guest Session Completed</strong>
                    <p>Sign in to sync your ELO across devices and unlock AI Coach telemetry.</p>
                  </div>
                  <Link to="/signin" className="guest-signin-btn">
                    Sign In →
                  </Link>
                </div>
              )}

              <div className="rated-actions-row">
                <button
                  type="button"
                  className="rated-primary-btn"
                  onClick={startSession}
                >
                  <RotateCcw size={15} />
                  <span>Start New Session</span>
                </button>
                <Link to="/puzzles/stats" className="rated-secondary-btn">
                  <BarChart3 size={15} />
                  <span>View All Analytics</span>
                </Link>
                <Link to="/puzzles" className="rated-secondary-btn">
                  <span>Return to Hub</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pre-game Briefing Terminal
  if (!sessionActive) {
    return (
      <div className="puzzle-rated-page cp-subpage">
        <PageAmbient watermark="RATED" theme="classic" />

        <PageHeader
          badge="DYNAMIC MATCHMAKING · FIDE K=32 FORMULA"
          title="Rated"
          accent="ELO Track"
          subtitle="Measure your tactical calculation strength against dynamically matched puzzles. Rating updates live with every solve."
          theme="classic"
          backTo="/puzzles"
          backLabel="Tactical Hub"
        />

        <PuzzleSubnav />

        <div className="rated-container">
          <div className="rated-briefing-grid">
            {/* Left: Interactive Launch Terminal */}
            <div className="cp-console-window rated-launch-console">
              <div className="cp-window-topbar">
                <span className="cp-window-title">
                  <span className="cp-window-dot emerald" />
                  <span>RATED MATCHMAKING TERMINAL // ACTIVE PROFILE</span>
                </span>
                <span className="rated-sys-id">SYS-ELO</span>
              </div>

              <div className="rated-launch-body">
                <div className="rated-hero-rating-box">
                  <span className="hero-rating-label">CURRENT TACTICAL ELO</span>
                  <div className="hero-rating-val">{rating}</div>
                  <span className="hero-rating-peak">PEAK RECORD: {peakRating} ELO</span>
                </div>

                <div className="rated-rules-checklist">
                  <div className="rule-check-item">
                    <span className="rule-icon success">+</span>
                    <div className="rule-text">
                      <strong>Dynamic ELO Scaling</strong>
                      <span>Earn more points against puzzles rated above your current rank.</span>
                    </div>
                  </div>
                  <div className="rule-check-item">
                    <span className="rule-icon danger">−</span>
                    <div className="rule-text">
                      <strong>Penalty on Tactical Misses</strong>
                      <span>Blunders deduct rating according to the standard K=32 formula.</span>
                    </div>
                  </div>
                  <div className="rule-check-item">
                    <span className="rule-icon cyan">≈</span>
                    <div className="rule-text">
                      <strong>Adaptive Matchmaking</strong>
                      <span>Puzzles adjust continuously to test the boundary of your calculation.</span>
                    </div>
                  </div>
                </div>

                {!isAuthenticated && (
                  <div className="guest-nudge-box">
                    <AlertTriangle size={18} className="guest-warn-icon" />
                    <div className="guest-nudge-content">
                      <strong>Playing as Guest</strong>
                      <span>Your ELO updates locally but won't persist across devices.</span>
                    </div>
                    <Link to="/signin" className="guest-signin-btn">
                      Sign In
                    </Link>
                  </div>
                )}

                <button
                  type="button"
                  className="rated-launch-btn"
                  onClick={startSession}
                >
                  <Play size={18} />
                  <span>Engage Rated Track</span>
                </button>
              </div>
            </div>

            {/* Right: Telemetry Overview */}
            <div className="cp-console-window rated-intel-console">
              <div className="cp-window-topbar">
                <span className="cp-window-title">
                  <span>TELEMETRY STANDINGS // OVERVIEW</span>
                </span>
                <Link to="/puzzles/leaderboard" className="rated-view-all-link">
                  Leaderboard →
                </Link>
              </div>

              <div className="rated-intel-body">
                <div className="intel-cell">
                  <span className="intel-code">METRIC // ELO TIER</span>
                  <span className="intel-val">
                    {rating < 1200
                      ? 'Novice Tactician'
                      : rating < 1600
                      ? 'Club Player'
                      : rating < 2000
                      ? 'Tactical Expert'
                      : 'Master Calculator'}
                  </span>
                  <span className="intel-sub">Based on global puzzle distribution</span>
                </div>

                <div className="intel-cell">
                  <span className="intel-code">FORMULA // K-FACTOR</span>
                  <span className="intel-val">K = 32</span>
                  <span className="intel-sub">Standard FIDE tactical weighting</span>
                </div>

                <div className="intel-cell">
                  <span className="intel-code">CORPUS // DATABASE</span>
                  <span className="intel-val">2,500+ Verified GM Lines</span>
                  <span className="intel-sub">Lichess Open Tactics Database</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Gameplay Session
  return (
    <div className="puzzle-rated-page playing cp-subpage">
      <PageAmbient watermark="RATED" theme="classic" />

      <PageHeader
        badge="LIVE RATED SESSION · ACTIVE ENGINE"
        title="Rated"
        accent="Studio"
        subtitle="Calculate deeply. Find the single winning continuation."
        theme="classic"
        rightElement={
          <button
            type="button"
            className="rated-end-session-top-btn"
            onClick={endSession}
          >
            End Session & Review
          </button>
        }
      />

      <PuzzleSubnav />

      <div className="rated-container">
        {/* Top Live Telemetry Ribbon */}
        <div className="cp-console-window rated-live-hud">
          <div className="live-hud-cell">
            <span className="hud-code">RATING // LIVE</span>
            <div className="hud-val-row">
              <span className="hud-val emerald">{rating}</span>
              {lastChange !== null && (
                <span
                  className={`hud-delta ${
                    lastChange >= 0 ? 'positive' : 'negative'
                  }`}
                >
                  {lastChange >= 0 ? `+${lastChange}` : lastChange} ELO
                </span>
              )}
            </div>
          </div>

          <div className="live-hud-cell">
            <span className="hud-code">TARGET // PUZZLE</span>
            <span className="hud-val gold">
              {currentPuzzle?.rating ? `${currentPuzzle.rating} ELO` : '...'}
            </span>
          </div>

          <div className="live-hud-cell">
            <span className="hud-code">SESSION // ACCURACY</span>
            <span className="hud-val cyan">{accuracy}%</span>
          </div>

          <div className="live-hud-cell">
            <span className="hud-code">PROGRESS // SOLVED</span>
            <span className="hud-val violet">
              {puzzlesSolved} / {puzzlesAttempted}
            </span>
          </div>
        </div>

        {/* 2-Column Board Stage Layout */}
        <div className="rated-layout">
          {/* Main Board Window */}
          <div className="cp-console-window rated-board-window">
            <div className="cp-window-topbar">
              <div className="cp-window-title">
                <span className="cp-window-dot emerald" />
                <span>
                  TACTICAL COMBINATION //{' '}
                  {currentPuzzle?.id ? `#${currentPuzzle.id}` : 'MATCHED'}
                </span>
              </div>
              <div className="rated-topbar-actions">
                {puzzleOutcome && (
                  <button
                    type="button"
                    className="rated-next-btn"
                    onClick={() => loadNewPuzzle(rating)}
                  >
                    <span>Next Puzzle</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </div>

            <div className="rated-board-stage">
              {isLoadingPuzzle ? (
                <div className="puzzle-board-loading">
                  <div className="loading-spinner" />
                  <p>Matching position against your rating ({rating} ELO)...</p>
                </div>
              ) : currentPuzzle ? (
                <div className="rated-board-wrap">
                  <PuzzleBoard
                    key={`rated-${currentPuzzle.id}`}
                    puzzle={currentPuzzle}
                    onSolve={handleCorrectSolve}
                    onFail={handleFailedMove}
                    showControls={true}
                    allowRetry={true}
                  />

                  {puzzleOutcome === 'solved' && (
                    <div className="rated-outcome-banner success">
                      <CheckCircle2 size={18} />
                      <div className="outcome-text">
                        <strong>Sequence Mastered!</strong>
                        <span>
                          {lastChange !== null && lastChange >= 0
                            ? `+${lastChange} ELO awarded.`
                            : 'Rating updated.'}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="outcome-next-btn"
                        onClick={() => loadNewPuzzle(rating)}
                      >
                        Next Puzzle →
                      </button>
                    </div>
                  )}

                  {puzzleOutcome === 'failed' && (
                    <div className="rated-outcome-banner failed">
                      <AlertTriangle size={18} />
                      <div className="outcome-text">
                        <strong>Tactical Blunder</strong>
                        <span>
                          {lastChange !== null
                            ? `${lastChange} ELO deducted.`
                            : 'Rating adjusted.'}{' '}
                          Retry or inspect solution before continuing.
                        </span>
                      </div>
                      <button
                        type="button"
                        className="outcome-next-btn secondary"
                        onClick={() => loadNewPuzzle(rating)}
                      >
                        Skip to Next →
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="puzzle-board-loading">
                  <p>No puzzle available. Retrying...</p>
                  <button
                    type="button"
                    className="rated-retry-load-btn"
                    onClick={() => loadNewPuzzle(rating)}
                  >
                    Load Position
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Active Session Telemetry */}
          <div className="cp-console-window rated-sidebar-window">
            <div className="cp-window-topbar">
              <span className="cp-window-title">
                <span>SESSION CONTROLS</span>
              </span>
            </div>

            <div className="rated-sidebar-body">
              <div className="sidebar-section">
                <span className="sidebar-section-title">CURRENT POSITION</span>
                <div className="sidebar-stat-row">
                  <span className="sidebar-lbl">Puzzle Rating:</span>
                  <span className="sidebar-val gold">
                    {currentPuzzle?.rating || '—'} ELO
                  </span>
                </div>
                <div className="sidebar-stat-row">
                  <span className="sidebar-lbl">Difficulty Tier:</span>
                  <span className="sidebar-val">
                    {(currentPuzzle?.rating || 1200) < 1200
                      ? 'Beginner'
                      : (currentPuzzle?.rating || 1200) < 1600
                      ? 'Intermediate'
                      : (currentPuzzle?.rating || 1200) < 2000
                      ? 'Advanced'
                      : 'Expert'}
                  </span>
                </div>
              </div>

              <div className="sidebar-section">
                <span className="sidebar-section-title">SESSION RECORD</span>
                <div className="sidebar-stat-row">
                  <span className="sidebar-lbl">Puzzles Solved:</span>
                  <span className="sidebar-val emerald">{puzzlesSolved}</span>
                </div>
                <div className="sidebar-stat-row">
                  <span className="sidebar-lbl">Puzzles Missed:</span>
                  <span className="sidebar-val rose">
                    {puzzlesAttempted - puzzlesSolved}
                  </span>
                </div>
                <div className="sidebar-stat-row">
                  <span className="sidebar-lbl">Session Accuracy:</span>
                  <span className="sidebar-val cyan">{accuracy}%</span>
                </div>
              </div>

              <button
                type="button"
                className="rated-end-btn"
                onClick={endSession}
              >
                End Session & View Analysis
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PuzzleRatedPage;
