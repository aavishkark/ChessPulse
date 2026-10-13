import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { puzzleService } from '../../services/puzzleService';
import { puzzleStatsService } from '../../services/puzzleStatsService';
import PuzzleBoard from '../../Components/PuzzleBoard/PuzzleBoard';
import PuzzleSubnav from '../../Components/Puzzles/PuzzleSubnav';
import PageHeader, { PageAmbient } from '../../Components/UI/PageHeader';
import {
  Cpu,
  Sparkles,
  Trophy,
  RotateCcw,
  Play,
  BarChart3,
  Bot,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Target,
  Layers,
  ChevronRight
} from 'lucide-react';
import './puzzleCurated.css';

const PuzzleCuratedPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [puzzles, setPuzzles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);
  const [puzzlesAttempted, setPuzzlesAttempted] = useState(0);
  const [isLoadingSet, setIsLoadingSet] = useState(true);
  const [sessionActive, setSessionActive] = useState(false);
  const [aiPlan, setAiPlan] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  const loadCuratedSet = useCallback(async () => {
    setIsLoadingSet(true);
    try {
      let plan = null;
      if (isAuthenticated) {
        try {
          const res = await puzzleStatsService.getCurationPlan();
          if (res?.success) plan = res.data;
        } catch (err) {
          console.error('Failed to fetch AI plan, using default', err);
        }
      }

      if (!plan) {
        plan = {
          themes: [
            { theme: 'mateIn1', count: 6, reason: 'Essential checkmate pattern recognition' },
            { theme: 'fork', count: 6, reason: 'Double attack calculation' },
            { theme: 'pin', count: 6, reason: 'Absolute and relative pins' },
            { theme: 'backRank', count: 6, reason: 'King safety and back-rank exploitation' },
            { theme: 'hangingPiece', count: 6, reason: 'Observation and undefended piece tactics' }
          ],
          summary: 'Tailored 30-puzzle tactical training plan targeting core tactical weaknesses.'
        };
      }
      setAiPlan(plan);

      const allPuzzles = [];
      for (const item of plan.themes) {
        const themePuzzles = await puzzleService.getPuzzlesBatchWithFilters(item.count, {
          themes: [item.theme]
        });
        allPuzzles.push(...themePuzzles);
      }

      // Shuffle and limit to 30
      const finalPuzzles = allPuzzles
        .sort(() => Math.random() - 0.5)
        .slice(0, 30);

      setPuzzles(finalPuzzles);
    } catch (error) {
      console.error('Error loading curated set:', error);
    } finally {
      setIsLoadingSet(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadCuratedSet();
  }, [loadCuratedSet]);

  const startSession = () => {
    if (puzzles.length === 0) return;
    setSessionActive(true);
    setSessionEnded(false);
    setCurrentIndex(0);
    setPuzzlesSolved(0);
    setPuzzlesAttempted(0);
  };

  const endSession = useCallback(async () => {
    setSessionActive(false);
    setSessionEnded(true);

    if (puzzlesAttempted > 0 && isAuthenticated) {
      setLoadingFeedback(true);
      try {
        const res = await puzzleStatsService.getSessionFeedback({
          mode: 'curated',
          solved: puzzlesSolved,
          failed: puzzlesAttempted - puzzlesSolved,
          totalAttempted: puzzlesAttempted
        });
        if (res?.success) setAiFeedback(res.data);
      } catch (err) {
        console.error('Failed to get feedback:', err);
      } finally {
        setLoadingFeedback(false);
      }
    }
  }, [puzzlesAttempted, isAuthenticated, puzzlesSolved]);

  const nextPuzzle = useCallback(() => {
    const nextIdx = currentIndex + 1;
    if (nextIdx < puzzles.length) {
      setCurrentIndex(nextIdx);
    } else {
      endSession();
    }
  }, [currentIndex, puzzles.length, endSession]);

  const handleCorrectSolve = useCallback(async () => {
    setPuzzlesSolved((prev) => prev + 1);
    setPuzzlesAttempted((prev) => prev + 1);

    const puzzle = puzzles[currentIndex];
    if (isAuthenticated && puzzle) {
      try {
        await puzzleStatsService.recordAttempt({
          puzzleId: puzzle.id,
          solved: true,
          puzzleRating: puzzle.rating,
          themes: puzzle.themes || [],
          mode: 'curated'
        });
      } catch (err) {
        console.error('Failed to record attempt:', err);
      }
    }

    setTimeout(() => {
      nextPuzzle();
    }, 400);
  }, [puzzles, currentIndex, isAuthenticated, nextPuzzle]);

  const handleFailedMove = useCallback(async () => {
    setPuzzlesAttempted((prev) => prev + 1);

    const puzzle = puzzles[currentIndex];
    if (isAuthenticated && puzzle) {
      try {
        await puzzleStatsService.recordAttempt({
          puzzleId: puzzle.id,
          solved: false,
          puzzleRating: puzzle.rating,
          themes: puzzle.themes || [],
          mode: 'curated'
        });
      } catch (err) {
        console.error('Failed to record attempt:', err);
      }
    }
  }, [puzzles, currentIndex, isAuthenticated]);

  const accuracy =
    puzzlesAttempted > 0
      ? Math.round((puzzlesSolved / puzzlesAttempted) * 100)
      : 100;

  const currentPuzzle = puzzles[currentIndex];
  const progressPercent =
    puzzles.length > 0 ? Math.round(((currentIndex + 1) / puzzles.length) * 100) : 0;

  // --------------------------------------------------------------------------
  // Results Screen
  // --------------------------------------------------------------------------
  if (sessionEnded) {
    return (
      <div className="puzzle-curated-page cp-subpage">
        <PageAmbient watermark="CURATED" theme="classic" />

        <PageHeader
          badge="NEURAL SET COMPLETE · EVALUATION REPORT"
          title="Pulse AI"
          accent="Set Debrief"
          subtitle="Your personalized 30-puzzle training mission is finished. Review pattern telemetry."
          theme="classic"
          backTo="/puzzles"
          backLabel="Tactical Hub"
        />

        <PuzzleSubnav />

        <div className="curated-container">
          <div className="curated-results-card cp-console-window">
            <div className="cp-window-topbar">
              <span className="cp-window-title">
                <span className="cp-window-dot cyan" />
                <span>NEURAL CURATION EVALUATION // SYS-COMPLETE</span>
              </span>
              <span className="curated-acc-tag">{accuracy}% Precision</span>
            </div>

            <div className="curated-results-body">
              <div className="curated-summary-grid">
                <div className="curated-stat-box highlight">
                  <span className="c-stat-code">COMPLETED // SOLVED</span>
                  <div className="c-stat-val cyan">{puzzlesSolved}</div>
                  <span className="c-stat-lbl">Combinations Solved</span>
                </div>
                <div className="curated-stat-box">
                  <span className="c-stat-code">METRIC // ACCURACY</span>
                  <div className="c-stat-val emerald">{accuracy}%</div>
                  <span className="c-stat-lbl">Tactical Precision</span>
                </div>
                <div className="curated-stat-box">
                  <span className="c-stat-code">CORPUS // SET SIZE</span>
                  <div className="c-stat-val gold">{puzzlesAttempted} / 30</div>
                  <span className="c-stat-lbl">Puzzles Completed</span>
                </div>
                <div className="curated-stat-box">
                  <span className="c-stat-code">MODEL // CURATION</span>
                  <div className="c-stat-val violet">Pulse AI</div>
                  <span className="c-stat-lbl">Neural Tailoring</span>
                </div>
              </div>

              {/* AI Coach Analysis */}
              {isAuthenticated && (
                <div className="curated-coach-wrap">
                  <div className="coach-header-line">
                    <Bot size={18} className="coach-icon" />
                    <span>Neural Coach Repertoire Diagnosis</span>
                  </div>

                  {loadingFeedback ? (
                    <div className="coach-loading">
                      <div className="loading-spinner" />
                      <span>Generating motif performance diagnostics...</span>
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
                          <span>Solid Motif: {aiFeedback.strength}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="coach-empty">
                      Curated set recorded. New training sets generate weekly based on your performance.
                    </p>
                  )}
                </div>
              )}

              <div className="curated-actions-row">
                <button
                  type="button"
                  className="curated-primary-btn"
                  onClick={() => {
                    loadCuratedSet().then(startSession);
                  }}
                >
                  <RotateCcw size={15} />
                  <span>Generate New AI Set</span>
                </button>
                <Link to="/puzzles/stats" className="curated-secondary-btn">
                  <BarChart3 size={15} />
                  <span>View All Analytics</span>
                </Link>
                <Link to="/puzzles" className="curated-secondary-btn">
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
  if (!sessionActive) {
    return (
      <div className="puzzle-curated-page cp-subpage">
        <PageAmbient watermark="CURATED" theme="classic" />

        <PageHeader
          badge="NEURAL REPERTOIRE SET · 30 TACTICAL DRILLS"
          title="Pulse AI"
          accent="Curated Set"
          subtitle="Hand-picked tactical combinations tailored to your calculation weaknesses and tactical motifs."
          theme="classic"
          backTo="/puzzles"
          backLabel="Tactical Hub"
        />

        <PuzzleSubnav />

        <div className="curated-container">
          <div className="curated-briefing-grid">
            {/* Left: AI Training Plan Console */}
            <div className="cp-console-window curated-launch-console">
              <div className="cp-window-topbar">
                <span className="cp-window-title">
                  <span className="cp-window-dot cyan" />
                  <span>NEURAL TRAINING PLAN // ACTIVE REPERTOIRE</span>
                </span>
                <span className="curated-sys-id">NEURAL-30</span>
              </div>

              <div className="curated-launch-body">
                {isLoadingSet ? (
                  <div className="curated-loading-box">
                    <div className="loading-spinner" />
                    <p>Synthesizing tailored tactical combination set...</p>
                  </div>
                ) : (
                  <>
                    <div className="ai-plan-summary-box">
                      <Cpu size={24} className="plan-icon" />
                      <div className="plan-text">
                        <strong>Personalized Calculation Set</strong>
                        <p>{aiPlan?.summary}</p>
                      </div>
                    </div>

                    <div className="curated-themes-breakdown">
                      <span className="breakdown-title">SET COMPOSITION (30 PUZZLES)</span>
                      <div className="themes-list">
                        {aiPlan?.themes?.map((item, idx) => (
                          <div key={idx} className="theme-plan-row">
                            <div className="theme-plan-left">
                              <span className="theme-plan-name">{item.theme}</span>
                              <span className="theme-plan-reason">{item.reason}</span>
                            </div>
                            <span className="theme-plan-count">{item.count} Drills</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="curated-launch-btn"
                      onClick={startSession}
                      disabled={puzzles.length === 0}
                    >
                      <Play size={18} />
                      <span>Start Curated Session (30 Puzzles)</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Right: Intel Overview */}
            <div className="cp-console-window curated-intel-console">
              <div className="cp-window-topbar">
                <span className="cp-window-title">
                  <span>TELEMETRY OVERVIEW // CURATION</span>
                </span>
              </div>

              <div className="curated-intel-body">
                <div className="intel-cell">
                  <span className="intel-code">SET FORMAT</span>
                  <span className="intel-val">30 Positions</span>
                  <span className="intel-sub">Balanced distribution of motifs</span>
                </div>

                <div className="intel-cell">
                  <span className="intel-code">CALCULATION RIGOR</span>
                  <span className="intel-val">Verified Lines Only</span>
                  <span className="intel-sub">Computer checked with Stockfish 17</span>
                </div>

                <div className="intel-cell">
                  <span className="intel-code">ADAPTIVE REPERTOIRE</span>
                  <span className="intel-val">Motif Targeting</span>
                  <span className="intel-sub">Deepens recognition of tactical blindspots</span>
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
    <div className="puzzle-curated-page playing cp-subpage">
      <PageAmbient watermark="CURATED" theme="classic" />

      <PageHeader
        badge={`CURATED TRAINING SESSION · DRILL ${currentIndex + 1} OF ${puzzles.length}`}
        title="Pulse AI"
        accent="Studio"
        subtitle="Work through your tailored 30-puzzle training plan."
        theme="classic"
        rightElement={
          <button
            type="button"
            className="curated-end-top-btn"
            onClick={endSession}
          >
            End & View Report
          </button>
        }
      />

      <PuzzleSubnav />

      <div className="curated-container">
        {/* Top Progress & Telemetry Ribbon */}
        <div className="cp-console-window curated-live-hud">
          <div className="live-hud-cell progress-cell">
            <div className="progress-top-row">
              <span className="hud-code">SET PROGRESS</span>
              <span className="progress-pct">{progressPercent}%</span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="progress-sub">
              Puzzle {currentIndex + 1} of {puzzles.length}
            </span>
          </div>

          <div className="live-hud-cell">
            <span className="hud-code">SOLVED IN SET</span>
            <span className="hud-val emerald">{puzzlesSolved}</span>
          </div>

          <div className="live-hud-cell">
            <span className="hud-code">ACCURACY</span>
            <span className="hud-val cyan">{accuracy}%</span>
          </div>

          <div className="live-hud-cell">
            <span className="hud-code">PUZZLE ELO</span>
            <span className="hud-val gold">
              {currentPuzzle?.rating ? `${currentPuzzle.rating}` : '...'}
            </span>
          </div>
        </div>

        {/* Board Stage */}
        <div className="curated-stage-layout">
          <div className="cp-console-window curated-board-window">
            <div className="cp-window-topbar">
              <span className="cp-window-title">
                <span className="cp-window-dot cyan" />
                <span>
                  CURATED COMBINATION // #{currentPuzzle?.id || 'ACTIVE'} (
                  {currentIndex + 1}/{puzzles.length})
                </span>
              </span>

              <button
                type="button"
                className="curated-next-top-btn"
                onClick={nextPuzzle}
              >
                <span>{currentIndex + 1 === puzzles.length ? 'Finish Set' : 'Next Puzzle'}</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="curated-board-body">
              {currentPuzzle ? (
                <div className="curated-board-wrap">
                  <PuzzleBoard
                    key={`curated-${currentPuzzle.id}-${currentIndex}`}
                    puzzle={currentPuzzle}
                    onSolve={handleCorrectSolve}
                    onFail={handleFailedMove}
                    showControls={true}
                    allowRetry={true}
                  />

                  <div className="curated-stage-bottom-bar">
                    <button
                      type="button"
                      className="curated-advance-btn"
                      onClick={nextPuzzle}
                    >
                      <span>
                        {currentIndex + 1 === puzzles.length
                          ? 'Finish Set & View Report →'
                          : 'Skip / Next Puzzle →'}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="puzzle-board-loading">
                  <p>Loading position...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PuzzleCuratedPage;
