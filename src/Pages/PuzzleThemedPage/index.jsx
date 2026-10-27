import { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { puzzleService } from '../../services/puzzleService';
import { puzzleStatsService } from '../../services/puzzleStatsService';
import PuzzleBoard from '../../Components/PuzzleBoard/PuzzleBoard';
import PuzzleSubnav from '../../Components/Puzzles/PuzzleSubnav';
import PageHeader, { PageAmbient } from '../../Components/UI/PageHeader';
import {
  Crown,
  Sparkles,
  GitFork,
  Crosshair,
  Layers,
  Shield,
  Compass,
  TrendingUp,
  Zap,
  Target,
  Swords,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  ChevronLeft
} from 'lucide-react';
import './puzzleThemed.css';

const THEME_DATA = {
  fork: {
    name: 'Tactical Fork',
    icon: GitFork,
    color: '#8b5cf6',
    tag: 'DOUBLE ATTACK',
    description: 'Attack two enemy pieces simultaneously, forcing immediate material gain.'
  },
  pin: {
    name: 'Absolute & Relative Pin',
    icon: Crosshair,
    color: '#06b6d4',
    tag: 'IMMOBILIZE',
    description: 'Fix enemy pieces against higher-value targets or the king.'
  },
  skewer: {
    name: 'Royal Skewer',
    icon: Swords,
    color: '#ec4899',
    tag: 'LINEAR FORCE',
    description: 'Force a valuable piece to flee, exposing an undefended target behind it.'
  },
  mate: {
    name: 'Checkmate Patterns',
    icon: Crown,
    color: '#ef4444',
    tag: 'LETHAL FINISH',
    description: 'Trap the opponent king with unstoppable mating combinations.'
  },
  mateIn1: {
    name: 'Mate in 1 Strike',
    icon: Sparkles,
    color: '#dc2626',
    tag: 'ONE PLY',
    description: 'Spot instant single-move checkmates from sharp positions.'
  },
  backrank: {
    name: 'Back-Rank Weakness',
    icon: Layers,
    color: '#f59e0b',
    tag: 'TRAPPED KING',
    description: 'Punish uncastled kings or kings blocked behind their own pawn shelter.'
  },
  endgame: {
    name: 'Endgame Conversion',
    icon: Shield,
    color: '#22c55e',
    tag: 'TECHNIQUE',
    description: 'Promote passed pawns and execute precise king and rook technical wins.'
  },
  capture: {
    name: 'Material Advantage',
    icon: Target,
    color: '#f97316',
    tag: 'WIN PIECES',
    description: 'Exploit overloaded defenders and hanging pieces to win material.'
  },
  attack: {
    name: 'Direct King Attack',
    icon: Zap,
    color: '#e11d48',
    tag: 'AGGRESSION',
    description: 'Break open the enemy castle with aggressive piece sacrifices.'
  },
  center: {
    name: 'Central Domination',
    icon: Compass,
    color: '#6366f1',
    tag: 'BOARD CONTROL',
    description: 'Occupy and control central outposts to restrict enemy counterplay.'
  },
  development: {
    name: 'Lead in Development',
    icon: TrendingUp,
    color: '#14b8a6',
    tag: 'RAPID MOBILITY',
    description: 'Leverage superior piece activity to punish slow setups.'
  }
};

const DIFFICULTY_OPTIONS = {
  all: { label: 'All Levels' },
  beginner: { label: 'Easy (800-1199)' },
  intermediate: { label: 'Medium (1200-1599)' },
  advanced: { label: 'Hard (1600-1999)' },
  expert: { label: 'Expert (2000+)' }
};

const PuzzleThemedPage = () => {
  const navigate = useNavigate();
  const { theme: urlTheme } = useParams();
  const { isAuthenticated } = useAuth();

  const [selectedTheme, setSelectedTheme] = useState(urlTheme || null);
  const [isPlaying, setIsPlaying] = useState(!!urlTheme);
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [isLoadingPuzzle, setIsLoadingPuzzle] = useState(false);
  const [difficulty, setDifficulty] = useState('all');

  const loadNewPuzzle = useCallback(
    async (themeKey, selectedDifficulty) => {
      setIsLoadingPuzzle(true);
      try {
        const filters = { themes: [themeKey] };
        if (selectedDifficulty && selectedDifficulty !== 'all') {
          filters.difficulty = selectedDifficulty;
        }
        const puzzle = await puzzleService.getPuzzleWithFilters(filters);
        setCurrentPuzzle(puzzle);
      } catch (error) {
        console.error('Error loading themed puzzle:', error);
      } finally {
        setIsLoadingPuzzle(false);
      }
    },
    []
  );

  const startPractice = (themeKey) => {
    setSelectedTheme(themeKey);
    setIsPlaying(true);
    setPuzzlesSolved(0);
    puzzleService.resetSession();
    loadNewPuzzle(themeKey, difficulty);
  };

  const endPractice = () => {
    setIsPlaying(false);
    setSelectedTheme(null);
    setCurrentPuzzle(null);
  };

  const handleCorrectSolve = useCallback(async () => {
    setPuzzlesSolved((prev) => prev + 1);

    if (isAuthenticated && currentPuzzle) {
      try {
        await puzzleStatsService.recordAttempt({
          puzzleId: currentPuzzle.id,
          solved: true,
          puzzleRating: currentPuzzle.rating,
          themes: currentPuzzle.themes || [selectedTheme],
          mode: 'themed',
          difficulty
        });
      } catch (err) {
        console.error('Failed to record attempt:', err);
      }
    }
  }, [currentPuzzle, isAuthenticated, selectedTheme, difficulty]);

  const handleFailedMove = useCallback(async () => {
    if (isAuthenticated && currentPuzzle) {
      try {
        await puzzleStatsService.recordAttempt({
          puzzleId: currentPuzzle.id,
          solved: false,
          puzzleRating: currentPuzzle.rating,
          themes: currentPuzzle.themes || [selectedTheme],
          mode: 'themed',
          difficulty
        });
      } catch (err) {
        console.error('Failed to record attempt:', err);
      }
    }
  }, [currentPuzzle, isAuthenticated, selectedTheme, difficulty]);

  const currentThemeData = selectedTheme ? THEME_DATA[selectedTheme] || {} : {};
  const CurrentIcon = currentThemeData.icon || Target;

  // --------------------------------------------------------------------------
  // Active Practice Stage
  // --------------------------------------------------------------------------
  if (isPlaying && selectedTheme) {
    return (
      <div className="puzzle-themed-page playing cp-subpage">
        <PageAmbient watermark="PATTERNS" theme="gold" />

        <PageHeader
          badge={`MOTIF DRILL · ${currentThemeData.name?.toUpperCase() || 'CUSTOM'}`}
          title="Motif"
          accent="Drill Lab"
          subtitle={currentThemeData.description || 'Isolate and master this tactical pattern.'}
          theme="gold"
          backTo="/puzzles/themed"
          backLabel="All Motifs"
          rightElement={
            <button
              type="button"
              className="themed-change-top-btn"
              onClick={endPractice}
            >
              Switch Motif
            </button>
          }
        />

        <PuzzleSubnav />

        <div className="themed-container">
          {/* Top Live HUD */}
          <div className="cp-console-window themed-live-hud">
            <div className="live-hud-cell theme-cell">
              <span className="hud-code">ACTIVE MOTIF</span>
              <div className="theme-active-tag-line">
                <CurrentIcon size={18} style={{ color: currentThemeData.color }} />
                <span className="theme-active-title">{currentThemeData.name}</span>
              </div>
            </div>

            <div className="live-hud-cell">
              <span className="hud-code">SOLVED THIS DRILL</span>
              <span className="hud-val emerald">{puzzlesSolved}</span>
            </div>

            <div className="live-hud-cell">
              <span className="hud-code">POSITION ELO</span>
              <span className="hud-val gold">
                {currentPuzzle?.rating ? `${currentPuzzle.rating} ELO` : '...'}
              </span>
            </div>

            <div className="live-hud-cell">
              <span className="hud-code">DIFFICULTY TIER</span>
              <span className="hud-val cyan">
                {DIFFICULTY_OPTIONS[difficulty]?.label}
              </span>
            </div>
          </div>

          {/* Board Stage Layout */}
          <div className="themed-layout">
            <div className="cp-console-window themed-board-window">
              <div className="cp-window-topbar">
                <span className="cp-window-title">
                  <span className="cp-window-dot amber" />
                  <span>
                    TACTICAL MOTIF DRILL //{' '}
                    {currentPuzzle?.id ? `#${currentPuzzle.id}` : 'ACTIVE'}
                  </span>
                </span>

                <button
                  type="button"
                  className="themed-next-btn"
                  onClick={() => loadNewPuzzle(selectedTheme, difficulty)}
                >
                  <span>Next Puzzle</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              <div className="themed-board-stage">
                {isLoadingPuzzle ? (
                  <div className="puzzle-board-loading">
                    <div className="loading-spinner" />
                    <p>Loading {currentThemeData.name} combination...</p>
                  </div>
                ) : currentPuzzle ? (
                  <div className="themed-board-wrap">
                    <PuzzleBoard
                      key={`themed-${currentPuzzle.id}`}
                      puzzle={currentPuzzle}
                      onSolve={handleCorrectSolve}
                      onFail={handleFailedMove}
                      showControls={true}
                      allowRetry={true}
                    />

                    <div className="themed-bottom-actions">
                      <button
                        type="button"
                        className="themed-next-big-btn"
                        onClick={() => loadNewPuzzle(selectedTheme, difficulty)}
                      >
                        <span>Next {currentThemeData.name} Puzzle →</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="puzzle-board-loading">
                    <p>No puzzle loaded.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Controls */}
            <div className="cp-console-window themed-sidebar-window">
              <div className="cp-window-topbar">
                <span className="cp-window-title">
                  <span>DRILL WORKSTATION</span>
                </span>
              </div>

              <div className="themed-sidebar-body">
                <div className="sidebar-section">
                  <span className="sidebar-section-title">MOTIF BRIEF</span>
                  <p className="motif-brief-text">
                    {currentThemeData.description}
                  </p>
                </div>

                <div className="sidebar-section">
                  <span className="sidebar-section-title">SELECT DIFFICULTY</span>
                  <div className="themed-diff-selector">
                    {Object.entries(DIFFICULTY_OPTIONS).map(([key, val]) => (
                      <button
                        key={key}
                        type="button"
                        className={`diff-opt-btn ${difficulty === key ? 'active' : ''}`}
                        onClick={() => {
                          setDifficulty(key);
                          loadNewPuzzle(selectedTheme, key);
                        }}
                      >
                        {val.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="themed-switch-btn"
                  onClick={endPractice}
                >
                  <ChevronLeft size={15} />
                  <span>Return to All Motifs</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Motifs Grid Selection Screen
  // --------------------------------------------------------------------------
  return (
    <div className="puzzle-themed-page cp-subpage">
      <PageAmbient watermark="PATTERNS" theme="gold" />

      <PageHeader
        badge="11 TACTICAL MOTIFS · PATTERN RECOGNITION LAB"
        title="Tactical"
        accent="Motif Lab"
        subtitle="Isolate and drill essential tactical motifs, from forks and pins to skewers and back-rank checkmates, until recognition is automatic."
        theme="gold"
        backTo="/puzzles"
        backLabel="Tactical Hub"
      />

      <PuzzleSubnav />

      <div className="themed-container">
        {/* Difficulty Filter Strip */}
        <div className="cp-console-window themed-filter-ribbon">
          <span className="filter-ribbon-label">DIFFICULTY FILTER:</span>
          <div className="filter-pills-row">
            {Object.entries(DIFFICULTY_OPTIONS).map(([key, val]) => (
              <button
                key={key}
                type="button"
                className={`filter-pill-btn ${difficulty === key ? 'active' : ''}`}
                onClick={() => setDifficulty(key)}
              >
                {val.label}
              </button>
            ))}
          </div>
        </div>

        {/* 11 Motifs Cards Grid */}
        <div className="themes-grid-console">
          {Object.entries(THEME_DATA).map(([key, data]) => {
            const Icon = data.icon;
            return (
              <button
                key={key}
                type="button"
                className="motif-studio-card"
                style={{ '--motif-accent': data.color }}
                onClick={() => startPractice(key)}
              >
                <div className="motif-card-glow" aria-hidden="true" />

                <div className="motif-card-header">
                  <div className="motif-icon-circle">
                    <Icon size={22} style={{ color: data.color }} />
                  </div>
                  <span className="motif-tag-pill">{data.tag}</span>
                </div>

                <div className="motif-card-body">
                  <span className="motif-title">{data.name}</span>
                  <p className="motif-desc">{data.description}</p>
                </div>

                <div className="motif-card-footer">
                  <span className="motif-action-text">Drill Motif</span>
                  <ArrowRight size={14} className="motif-arrow" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PuzzleThemedPage;
