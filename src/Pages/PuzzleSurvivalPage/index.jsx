import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { puzzleService } from '../../services/puzzleService';
import { puzzleStatsService } from '../../services/puzzleStatsService';
import PuzzleBoard from '../../Components/PuzzleBoard/PuzzleBoard';
import PuzzleSubnav from '../../Components/Puzzles/PuzzleSubnav';
import PageHeader, { PageAmbient } from '../../Components/UI/PageHeader';
import {
  Flame,
  Shield,
  ShieldAlert,
  ShieldX,
  Trophy,
  RotateCcw,
  AlertTriangle,
  Play,
  BarChart3,
  Bot,
  ShieldCheck,
  CheckCircle2,
  Heart,
  HeartCrack,
  ArrowRight
} from 'lucide-react';
import './puzzleSurvival.css';

const DIFFICULTY_OPTIONS = {
  all: { label: 'All Levels', description: 'Mixed dynamic pool' },
  beginner: { label: 'Beginner', description: '800 – 1199 ELO' },
  intermediate: { label: 'Intermediate', description: '1200 – 1599 ELO' },
  advanced: { label: 'Advanced', description: '1600 – 1999 ELO' },
  expert: { label: 'Expert', description: '2000 – 2400 ELO' }
};

const PuzzleSurvivalPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [gameState, setGameState] = useState('ready'); // 'ready' | 'playing' | 'finished'
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(() => {
    const saved = localStorage.getItem('survivalBestStreak');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [isLoadingPuzzle, setIsLoadingPuzzle] = useState(false);
  const [difficulty, setDifficulty] = useState('all');
  const [aiFeedback, setAiFeedback] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [lastStrike, setLastStrike] = useState(false);

  useEffect(() => {
    if (gameState === 'finished' && isAuthenticated && !aiFeedback) {
      setLoadingFeedback(true);
      puzzleStatsService
        .getSessionFeedback({
          mode: 'survival',
          solved: streak,
          failed: 3,
          totalAttempted: streak + 3,
          streak: streak
        })
        .then((res) => {
          if (res?.success) setAiFeedback(res.data);
        })
        .catch((err) => console.error('Failed to get AI feedback:', err))
        .finally(() => setLoadingFeedback(false));
    }
  }, [gameState, isAuthenticated, streak, aiFeedback]);

  const loadNewPuzzle = useCallback(
    async (selectedDifficulty) => {
      setIsLoadingPuzzle(true);
      setLastStrike(false);
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
    setGameState('playing');
    setLives(3);
    setStreak(0);
    setLastStrike(false);
    setAiFeedback(null);
    puzzleService.resetSession();
    await loadNewPuzzle(difficulty);
  };

  const handleCorrectSolve = useCallback(async () => {
    setStreak((prev) => {
      const newStreak = prev + 1;
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
        localStorage.setItem('survivalBestStreak', newStreak.toString());
      }
      return newStreak;
    });

    if (isAuthenticated && currentPuzzle) {
      try {
        await puzzleStatsService.recordAttempt({
          puzzleId: currentPuzzle.id,
          solved: true,
          puzzleRating: currentPuzzle.rating,
          themes: currentPuzzle.themes || [],
          mode: 'survival',
          difficulty
        });
      } catch (err) {
        console.error('Failed to record attempt:', err);
      }
    }

    setTimeout(() => {
      loadNewPuzzle(difficulty);
    }, 350);
  }, [currentPuzzle, isAuthenticated, difficulty, bestStreak, loadNewPuzzle]);

  const handleFailedMove = useCallback(async () => {
    const nextLives = lives - 1;
    setLives(nextLives);
    setLastStrike(true);

    if (isAuthenticated && currentPuzzle) {
      try {
        await puzzleStatsService.recordAttempt({
          puzzleId: currentPuzzle.id,
          solved: false,
          puzzleRating: currentPuzzle.rating,
          themes: currentPuzzle.themes || [],
          mode: 'survival',
          difficulty
        });
      } catch (err) {
        console.error('Failed to record attempt:', err);
      }
    }

    if (nextLives <= 0) {
      setTimeout(() => {
        setGameState('finished');
      }, 700);
    } else {
      setTimeout(() => {
        loadNewPuzzle(difficulty);
      }, 650);
    }
  }, [lives, currentPuzzle, isAuthenticated, difficulty, loadNewPuzzle]);

  // --------------------------------------------------------------------------
  // Results Screen (Game Over)
  // --------------------------------------------------------------------------
  if (gameState === 'finished') {
    const isNewRecord = streak >= bestStreak && streak > 0;

    return (
      <div className="puzzle-survival-page cp-subpage">
        <PageAmbient watermark="SURVIVAL" theme="blitz" />

        <PageHeader
          badge="SURVIVAL CLIMB CONCLUDED · 3 STRIKES"
          title="Survival"
          accent="Summary"
          subtitle="Your 3 lives have expired. Review your streak depth and endurance telemetry."
          theme="blitz"
          backTo="/puzzles"
          backLabel="Tactical Hub"
        />

        <PuzzleSubnav />

        <div className="survival-container">
          <div className="survival-results-card cp-console-window">
            <div className="cp-window-topbar">
              <span className="cp-window-title">
                <span className="cp-window-dot violet" />
                <span>ENDURANCE RUN TERMINATED // SYS-SURVIVAL</span>
              </span>
              <span className="survival-streak-badge">{streak} Streak</span>
            </div>

            <div className="survival-results-body">
              <div className="survival-summary-grid">
                <div className="survival-stat-box highlight">
                  <span className="s-stat-code">STREAK // FINAL</span>
                  <div className="s-stat-val violet">{streak}</div>
                  <span className="s-stat-lbl">Puzzles Solved In Row</span>
                </div>
                <div className="survival-stat-box">
                  <span className="s-stat-code">RECORD // ALL-TIME</span>
                  <div className="s-stat-val gold">{bestStreak}</div>
                  <span className="s-stat-lbl">Personal Best Streak</span>
                </div>
                <div className="survival-stat-box">
                  <span className="s-stat-code">DIFFICULTY // TIER</span>
                  <div className="s-stat-val cyan">
                    {DIFFICULTY_OPTIONS[difficulty]?.label}
                  </div>
                  <span className="s-stat-lbl">Corpus Selection</span>
                </div>
                <div className="survival-stat-box">
                  <span className="s-stat-code">STRIKES // ALLOWED</span>
                  <div className="s-stat-val rose">3 / 3</div>
                  <span className="s-stat-lbl">Lives Depleted</span>
                </div>
              </div>

              {isNewRecord && (
                <div className="new-record-banner">
                  <Trophy size={18} className="gold" />
                  <strong>NEW PERSONAL BEST STREAK!</strong>
                  <span>You set a record of {streak} consecutive tactical solves.</span>
                </div>
              )}

              {/* AI Coach Analysis */}
              {isAuthenticated && (
                <div className="survival-coach-wrap">
                  <div className="coach-header-line">
                    <Bot size={18} className="coach-icon" />
                    <span>Neural Coach Endurance Analysis</span>
                  </div>

                  {loadingFeedback ? (
                    <div className="coach-loading">
                      <div className="loading-spinner" />
                      <span>Synthesizing calculation stamina data...</span>
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
                    </div>
                  ) : (
                    <p className="coach-empty">
                      Endurance session recorded. Keep training to deepen calculation horizon.
                    </p>
                  )}
                </div>
              )}

              <div className="survival-actions-row">
                <button
                  type="button"
                  className="survival-primary-btn"
                  onClick={startGame}
                >
                  <RotateCcw size={15} />
                  <span>Climb Again</span>
                </button>
                <Link to="/puzzles/leaderboard" className="survival-secondary-btn">
                  <Trophy size={15} />
                  <span>View Global Streak Standings</span>
                </Link>
                <Link to="/puzzles" className="survival-secondary-btn">
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
  // Pre-game Briefing Terminal
  // --------------------------------------------------------------------------
  if (gameState !== 'playing') {
    return (
      <div className="puzzle-survival-page cp-subpage">
        <PageAmbient watermark="SURVIVAL" theme="blitz" />

        <PageHeader
          badge="ENDURANCE CLIMB · 3 STRIKES ALLOWED"
          title="3-Life"
          accent="Survival"
          subtitle="Zero time limit. Calculate as deeply as you need. Three tactical blunders and your run ends."
          theme="blitz"
          backTo="/puzzles"
          backLabel="Tactical Hub"
        />

        <PuzzleSubnav />

        <div className="survival-container">
          <div className="survival-briefing-grid">
            {/* Left: Launch Terminal */}
            <div className="cp-console-window survival-launch-console">
              <div className="cp-window-topbar">
                <span className="cp-window-title">
                  <span className="cp-window-dot violet" />
                  <span>ENDURANCE CLIMB // CONFIGURATION</span>
                </span>
                <span className="survival-sys-id">SURV-03</span>
              </div>

              <div className="survival-launch-body">
                {/* Hero Lives Demonstration */}
                <div className="survival-hero-shield-box">
                  <span className="hero-shield-label">LIVES ALLOCATED</span>
                  <div className="hero-shields-row">
                    <div className="shield-pod active">
                      <Shield size={28} />
                      <span>LIFE 1</span>
                    </div>
                    <div className="shield-pod active">
                      <Shield size={28} />
                      <span>LIFE 2</span>
                    </div>
                    <div className="shield-pod active">
                      <Shield size={28} />
                      <span>LIFE 3</span>
                    </div>
                  </div>
                  <span className="hero-streak-record">
                    BEST RECORD: {bestStreak} CONSECUTIVE SOLVES
                  </span>
                </div>

                {/* Difficulty Selector */}
                <div className="survival-section-group">
                  <label className="survival-group-lbl">SELECT CORPUS TIER</label>
                  <div className="survival-diff-grid">
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

                {/* Rules Checklist */}
                <div className="survival-rules-checklist">
                  <div className="s-rule-item">
                    <span className="s-rule-icon cyan">∞</span>
                    <div className="s-rule-text">
                      <strong>Zero Clock Pressure</strong>
                      <span>Take all the time you need to verify opponent candidate moves.</span>
                    </div>
                  </div>
                  <div className="s-rule-item">
                    <span className="s-rule-icon red">3×</span>
                    <div className="s-rule-text">
                      <strong>Three Strikes Allowed</strong>
                      <span>A single incorrect move consumes one life shield.</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="survival-launch-btn"
                  onClick={startGame}
                >
                  <Flame size={18} />
                  <span>Begin Survival Climb</span>
                </button>
              </div>
            </div>

            {/* Right: Telemetry Intel */}
            <div className="cp-console-window survival-intel-console">
              <div className="cp-window-topbar">
                <span className="cp-window-title">
                  <span>TELEMETRY OVERVIEW // ENDURANCE</span>
                </span>
              </div>

              <div className="survival-intel-body">
                <div className="intel-cell">
                  <span className="intel-code">CALCULATION DEPTH</span>
                  <span className="intel-val">Multi-Ply Tactics</span>
                  <span className="intel-sub">Requires calculating 3 to 6 moves ahead</span>
                </div>

                <div className="intel-cell">
                  <span className="intel-code">SESSION STREAK PERSISTENCE</span>
                  <span className="intel-val">Saved to Browser Record</span>
                  <span className="intel-sub">High scores synced to user account</span>
                </div>

                <div className="intel-cell">
                  <span className="intel-code">CORPUS STATUS</span>
                  <span className="intel-val">Adaptive Difficulty</span>
                  <span className="intel-sub">Puzzles escalate as your streak climbs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Active Gameplay Stage
  // --------------------------------------------------------------------------
  return (
    <div className="puzzle-survival-page playing cp-subpage">
      <PageAmbient watermark="SURVIVAL" theme="blitz" />

      <PageHeader
        badge="ACTIVE SURVIVAL RUN · 3 LIVES"
        title="3-Life"
        accent="Survival"
        subtitle="Endurance calculation in progress. Guard your remaining lives."
        theme="blitz"
        rightElement={
          <button
            type="button"
            className="survival-abort-btn"
            onClick={() => setGameState('finished')}
          >
            End Climb
          </button>
        }
      />

      <PuzzleSubnav />

      <div className="survival-container">
        {/* Top Telemetry HUD with Shield Icons */}
        <div className="cp-console-window survival-live-hud">
          {/* 3 Life Shields */}
          <div className="survival-hud-cell shields-cell">
            <span className="hud-code">SHIELD INTEGRITY</span>
            <div className="live-shields-row">
              {[1, 2, 3].map((num) => {
                const isAlive = lives >= num;
                return (
                  <div
                    key={num}
                    className={`live-shield-pod ${isAlive ? 'alive' : 'lost'} ${
                      lastStrike && num === lives + 1 ? 'just-lost' : ''
                    }`}
                  >
                    {isAlive ? <Shield size={18} /> : <ShieldX size={18} />}
                    <span className="shield-num">STRIKE {num}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="survival-hud-cell streak-cell">
            <span className="hud-code">ACTIVE STREAK</span>
            <span className="survival-streak-digits">{streak}</span>
          </div>

          <div className="survival-hud-cell">
            <span className="hud-code">BEST STREAK</span>
            <span className="survival-hud-val gold">{bestStreak}</span>
          </div>

          <div className="survival-hud-cell">
            <span className="hud-code">PUZZLE ELO</span>
            <span className="survival-hud-val cyan">
              {currentPuzzle?.rating ? `${currentPuzzle.rating}` : '...'}
            </span>
          </div>
        </div>

        {/* Board Stage */}
        <div className="survival-stage-layout">
          <div className="cp-console-window survival-board-window">
            <div className="cp-window-topbar">
              <span className="cp-window-title">
                <span className="cp-window-dot violet" />
                <span>
                  TACTICAL SURVIVAL POSITION //{' '}
                  {currentPuzzle?.id ? `#${currentPuzzle.id}` : 'ACTIVE'}
                </span>
              </span>
              <span className="survival-lives-tag">
                {lives} {lives === 1 ? 'Life' : 'Lives'} Left
              </span>
            </div>

            <div className="survival-board-body">
              {isLoadingPuzzle ? (
                <div className="puzzle-board-loading">
                  <div className="loading-spinner" />
                  <p>Loading endurance combination...</p>
                </div>
              ) : currentPuzzle ? (
                <PuzzleBoard
                  key={`survival-${currentPuzzle.id}`}
                  puzzle={currentPuzzle}
                  onSolve={handleCorrectSolve}
                  onFail={handleFailedMove}
                  showControls={true}
                  autoAdvance={true}
                  allowRetry={false}
                />
              ) : (
                <div className="puzzle-board-loading">
                  <p>Position ready...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PuzzleSurvivalPage;
