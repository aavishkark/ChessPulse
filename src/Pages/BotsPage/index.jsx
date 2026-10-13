import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BOT_PROFILES } from '../../data/botProfiles';
import { useBotStats } from '../../hooks/useBotStats';
import { useAuth } from '../../contexts/AuthContext';
import { useBoardCustomization } from '../../contexts/BoardCustomizationContext';
import { playSound } from '../../utils/sounds';
import PageHeader, { PageAmbient } from '../../Components/UI/PageHeader';
import {
  Cpu,
  Swords,
  Shield,
  Zap,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Dices,
  Trophy,
  CheckCircle2,
  Sparkles,
  Flame,
  Target,
  Activity,
  Layers,
  RotateCcw
} from 'lucide-react';
import './bots.css';

// Tier definitions with color palettes and metadata
const TIER_META = {
  beginner: { label: 'Novice', color: '#10b981', rgb: '16, 185, 129', badge: 'BEGINNER' },
  casual: { label: 'Casual', color: '#06b6d4', rgb: '6, 182, 212', badge: 'CASUAL SPEED' },
  intermediate: { label: 'Intermediate', color: '#3b82f6', rgb: '59, 130, 246', badge: 'THEORETICAL' },
  advanced: { label: 'Tactical', color: '#f59e0b', rgb: '245, 158, 11', badge: 'HYPER-AGGRO' },
  expert: { label: 'Expert', color: '#f43f5e', rgb: '244, 63, 94', badge: 'ENDGAME GENIUS' },
  master: { label: 'Master', color: '#a855f7', rgb: '168, 85, 247', badge: 'ROYAL MASTER' },
  grandmaster: { label: 'Grandmaster', color: '#eab308', rgb: '234, 179, 8', badge: 'SUPREME GM' },
};

const getBotTier = (elo) => {
  if (elo < 600) return 'beginner';
  if (elo < 1000) return 'casual';
  if (elo < 1400) return 'intermediate';
  if (elo < 1700) return 'advanced';
  if (elo < 2000) return 'expert';
  if (elo < 2300) return 'master';
  return 'grandmaster';
};

export default function BotsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isBeaten, stats } = useBotStats();
  const { soundEnabled, soundTheme } = useBoardCustomization();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [playerColor, setPlayerColor] = useState('random');
  const [activeTierFilter, setActiveTierFilter] = useState('all');
  const [isRolling, setIsRolling] = useState(false);

  // 3D Tilt state for active card
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [sheenPos, setSheenPos] = useState({ x: 50, y: 50 });

  // Drag / swipe gesture state
  const stageRef = useRef(null);
  const dragStartX = useRef(null);
  const isDragging = useRef(false);

  const totalBots = BOT_PROFILES.length;
  const currentBot = BOT_PROFILES[currentIndex] || BOT_PROFILES[0];
  const tierKey = getBotTier(currentBot.elo);
  const tierInfo = TIER_META[tierKey] || TIER_META.beginner;

  // Count defeated bots
  const defeatedCount = useMemo(() => {
    if (!isAuthenticated) return 0;
    return BOT_PROFILES.filter((b) => isBeaten(b.id)).length;
  }, [isAuthenticated, isBeaten]);

  // Navigate to bot
  const goToIndex = useCallback(
    (index) => {
      const normalized = (index + totalBots) % totalBots;
      setCurrentIndex(normalized);
      if (soundEnabled) {
        playSound('move', soundTheme || 'robot', true);
      }
    },
    [totalBots, soundEnabled, soundTheme]
  );

  const goToPrevious = useCallback(() => {
    goToIndex(currentIndex - 1);
  }, [currentIndex, goToIndex]);

  const goToNext = useCallback(() => {
    goToIndex(currentIndex + 1);
  }, [currentIndex, goToIndex]);

  // Surprise Opponent (Random dice roll with animated spinning)
  const rollRandomBot = () => {
    if (isRolling) return;
    setIsRolling(true);
    let spins = 0;
    const maxSpins = 8 + Math.floor(Math.random() * 5);
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalBots);
      if (soundEnabled) {
        playSound('move', soundTheme || 'robot', true);
      }
      spins++;
      if (spins >= maxSpins) {
        clearInterval(interval);
        setIsRolling(false);
      }
    }, 90);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') goToPrevious();
      if (e.key === 'ArrowRight' || e.key === 'd') goToNext();
      if (e.key === 'Enter') handleLaunchMatch();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext]);

  // Mouse drag / touch swipe handlers
  const handleTouchStart = (e) => {
    dragStartX.current = e.touches ? e.touches[0].clientX : e.clientX;
    isDragging.current = true;
  };

  const handleTouchEnd = (e) => {
    if (!isDragging.current || dragStartX.current === null) return;
    const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const diff = endX - dragStartX.current;
    if (Math.abs(diff) > 45) {
      if (diff > 0) goToPrevious();
      else goToNext();
    }
    dragStartX.current = null;
    isDragging.current = false;
  };

  // 3D Parallax Tilt calculation on mouse move
  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = -((y - centerY) / centerY) * 10;
    const tiltY = ((x - centerX) / centerX) * 10;

    setTilt({ x: tiltX, y: tiltY });
    setSheenPos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Launch Match Handler
  const handleLaunchMatch = () => {
    const color =
      playerColor === 'random'
        ? Math.random() > 0.5
          ? 'white'
          : 'black'
        : playerColor;
    navigate(`/bots/play/${currentBot.id}?color=${color}`);
  };

  // Compute calculated engine attribute meters
  const botAttributes = useMemo(() => {
    const base = Math.min(99, Math.max(25, Math.round((currentBot.elo / 2800) * 100)));
    const seed = currentBot.name.charCodeAt(0) || 7;
    return [
      { label: 'Tactical Sharpness', val: Math.min(99, Math.max(30, base + (seed % 9) - 3)), icon: Zap },
      { label: 'Positional Horizon', val: Math.min(99, Math.max(25, base + ((seed * 3) % 11) - 5)), icon: Cpu },
      { label: 'Endgame Precision', val: Math.min(99, Math.max(20, base + ((seed * 7) % 9) - 2)), icon: Shield },
      { label: 'Aggression Index', val: Math.min(99, Math.max(35, (seed * 11) % 55 + 40)), icon: Flame },
    ];
  }, [currentBot]);

  return (
    <div className="bots-page cp-subpage">
      <PageAmbient watermark="CHALLENGERS" theme="blitz" />

      {/* ====================================================================
          PAGE HEADER & ARENA HUD TELEMETRY
          ==================================================================== */}
      <div className="bots-top-wrapper">
        <PageHeader
          badge="STOCKFISH 17 NEURAL PERSONALITIES · 400 - 2400 ELO"
          title="Neural AI"
          accent="Arena"
          subtitle="Rotate through calibrated Stockfish sparring personas in full 3D perspective to test openings and sharpen tactical reflexes."
          theme="blitz"
          backTo="/"
          backLabel="Back to Home"
          rightElement={
            <div className="bots-progress-chip">
              <Trophy size={14} className="trophy-gold" />
              <span>
                {defeatedCount} / {totalBots} CONQUERED
              </span>
            </div>
          }
        />

        {/* 4-Cell Telemetry Ribbon */}
        <div className="cp-console-window bots-hud-ribbon">
          <div className="bots-hud-cell">
            <span className="hud-code">SYS-01 // ACTIVE CHALLENGER</span>
            <span className="hud-val cyan">{currentBot.name}</span>
            <span className="hud-lbl">{currentBot.elo} ELO RATING</span>
          </div>
          <div className="bots-hud-cell">
            <span className="hud-code">SYS-02 // HARDWARE PROFILE</span>
            <span className="hud-val gold">
              Depth {currentBot.engineConfig?.depth || 12} Plies
            </span>
            <span className="hud-lbl">
              Skill Lvl {currentBot.engineConfig?.skillLevel || 5} · {currentBot.engineConfig?.thinkTimeMs || 1000}ms Think
            </span>
          </div>
          <div className="bots-hud-cell">
            <span className="hud-code">SYS-03 // TACTICAL CADENCE</span>
            <span className="hud-val emerald">{tierInfo.badge}</span>
            <span className="hud-lbl">{tierInfo.label} Sparring Tier</span>
          </div>
          <div className="bots-hud-cell">
            <span className="hud-code">SYS-04 // ENGINE PROTOCOL</span>
            <span className="hud-val violet">Stockfish WASM</span>
            <span className="hud-lbl">Calibrated Multi-Tier Matrix</span>
          </div>
        </div>

        {/* Action & Filter Toolbar */}
        <div className="bots-toolbar-row">
          <div className="bots-tier-filter-pills">
            {[
              { id: 'all', label: 'All Roster (7)' },
              { id: 'beginner', label: 'Novice (400-800)' },
              { id: 'intermediate', label: 'Club (1200-1500)' },
              { id: 'expert', label: 'Master (1800-2400)' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                className={`tier-pill-btn ${activeTierFilter === f.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTierFilter(f.id);
                  if (f.id !== 'all') {
                    // Find first bot in this tier and jump
                    const found = BOT_PROFILES.findIndex((b) => {
                      const t = getBotTier(b.elo);
                      if (f.id === 'beginner') return t === 'beginner' || t === 'casual';
                      if (f.id === 'intermediate') return t === 'intermediate' || t === 'advanced';
                      if (f.id === 'expert') return t === 'expert' || t === 'master' || t === 'grandmaster';
                      return true;
                    });
                    if (found !== -1) goToIndex(found);
                  }
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="toolbar-right-actions">
            <button
              type="button"
              className={`surprise-bot-btn ${isRolling ? 'spinning' : ''}`}
              onClick={rollRandomBot}
              title="Roll dice to challenge a random bot"
            >
              <Dices size={15} />
              <span>Surprise Challenger</span>
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          MIND-BLOWING 3D CYLINDRICAL CAROUSEL STAGE
          ==================================================================== */}
      <div
        className="carousel-3d-stage-viewport"
        ref={stageRef}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Arrow Paddles */}
        <button
          type="button"
          className="carousel-nav-paddle prev"
          onClick={goToPrevious}
          title="Previous Challenger (←)"
        >
          <ChevronLeft size={26} />
          <span className="paddle-shortcut">←</span>
        </button>

        <button
          type="button"
          className="carousel-nav-paddle next"
          onClick={goToNext}
          title="Next Challenger (→)"
        >
          <ChevronRight size={26} />
          <span className="paddle-shortcut">→</span>
        </button>

        {/* 3D Cards Ring Container */}
        <div className="carousel-3d-ring">
          {BOT_PROFILES.map((bot, index) => {
            // Shortest circular offset
            let diff = (index - currentIndex) % totalBots;
            if (diff > totalBots / 2) diff -= totalBots;
            if (diff < -totalBots / 2) diff += totalBots;

            const isCenter = diff === 0;
            const botTierKey = getBotTier(bot.elo);
            const botTierMeta = TIER_META[botTierKey] || TIER_META.beginner;
            const isBeatenByPlayer = isAuthenticated && isBeaten(bot.id);
            const botStats = isAuthenticated ? stats[bot.id] : null;

            // Compute 3D Cylindrical Geometry
            // Spacing: 320px on desktop
            const translateX = diff * 320;
            const translateZ = isCenter ? 60 : -Math.abs(diff) * 160;
            const rotateY = diff * -28;
            const scale = isCenter ? 1 : Math.max(0.68, 1 - Math.abs(diff) * 0.14);
            const opacity = isCenter ? 1 : Math.max(0, 0.9 - Math.abs(diff) * 0.28);
            const zIndex = 50 - Math.abs(diff) * 10;
            const isVisible = Math.abs(diff) <= 2;

            // Apply interactive 3D parallax tilt only to the active card
            const transformStyle = isCenter
              ? `translateX(0px) translateZ(60px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1)`
              : `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`;

            return (
              <div
                key={bot.id}
                className={`carousel-card-3d tier-${botTierKey} ${isCenter ? 'is-active' : ''} ${
                  !isVisible ? 'is-hidden' : ''
                }`}
                style={{
                  transform: transformStyle,
                  opacity: opacity,
                  zIndex: zIndex,
                  pointerEvents: isVisible ? 'auto' : 'none',
                  '--tier-color': botTierMeta.color,
                  '--tier-rgb': botTierMeta.rgb,
                }}
                onClick={() => {
                  if (!isCenter) goToIndex(index);
                }}
                onMouseMove={isCenter ? handleMouseMove : undefined}
                onMouseLeave={isCenter ? handleMouseLeave : undefined}
              >
                {/* Holographic Specular Reflection Sheen */}
                {isCenter && (
                  <div
                    className="holo-sheen"
                    style={{
                      background: `radial-gradient(circle at ${sheenPos.x}% ${sheenPos.y}%, rgba(255,255,255,0.18) 0%, transparent 60%)`,
                    }}
                  />
                )}

                {/* Cybernetic Card Header */}
                <div className="card-cyber-header">
                  <div className="tier-badge-pill">
                    <span className="tier-pulse-orb" />
                    <span>{botTierMeta.badge}</span>
                  </div>
                  <div className="elo-rating-pill">
                    <Trophy size={12} />
                    <span>{bot.elo} ELO</span>
                  </div>
                </div>

                {/* Bot Avatar Hologram Pod */}
                <div className="card-avatar-pod">
                  <div className="avatar-scanner-ring" />
                  <div className="avatar-frame">
                    <img
                      src={bot.avatar}
                      alt={bot.name}
                      className="bot-portrait"
                      onError={(e) => {
                        e.target.src = '/assets/bots/timmy.png';
                      }}
                    />
                  </div>

                  {isBeatenByPlayer && (
                    <div className="defeated-crown-badge" title="You have defeated this bot!">
                      <CheckCircle2 size={16} />
                      <span>CONQUERED</span>
                    </div>
                  )}
                </div>

                {/* Bot Identity */}
                <div className="card-identity-box">
                  <h3 className="bot-display-name">{bot.name}</h3>
                  <p className="bot-bio-snippet">{bot.bio}</p>
                </div>

                {/* Comms Transmission Quote */}
                <div className="card-comms-quote">
                  <span className="quote-tag">COMMS //</span>
                  <p className="quote-body">&ldquo;{bot.catchphrases[0]}&rdquo;</p>
                </div>

                {/* Animated Telemetry Attributes */}
                <div className="card-telemetry-block">
                  {botAttributes.map((attr) => {
                    const Icon = attr.icon;
                    return (
                      <div key={attr.label} className="telemetry-stat-row">
                        <div className="stat-label-wrap">
                          <Icon size={12} className="stat-icon" />
                          <span>{attr.label}</span>
                        </div>
                        <div className="stat-track-bar">
                          <div
                            className="stat-fill-bar"
                            style={{
                              width: `${attr.val}%`,
                              background: botTierMeta.color,
                            }}
                          />
                        </div>
                        <span className="stat-pct">{attr.val}%</span>
                      </div>
                    );
                  })}
                </div>

                {/* Engine Hardware Metrics Footer */}
                <div className="card-engine-specs">
                  <span className="spec-item">
                    <strong>DEPTH</strong> {bot.engineConfig?.depth || 12}
                  </span>
                  <span className="spec-separator">•</span>
                  <span className="spec-item">
                    <strong>THINK</strong> {bot.engineConfig?.thinkTimeMs || 1000}ms
                  </span>
                  <span className="spec-separator">•</span>
                  <span className="spec-item">
                    <strong>SKILL</strong> LVL {bot.engineConfig?.skillLevel || 5}
                  </span>
                </div>

                {/* Match Launchpad Dock (Only interactive on Active Center Card) */}
                {isCenter ? (
                  <div className="card-launch-dock" onClick={(e) => e.stopPropagation()}>
                    <div className="color-selector-row">
                      <span className="color-picker-label">SIDE:</span>
                      <div className="color-options-group">
                        <button
                          type="button"
                          className={`color-pill ${playerColor === 'white' ? 'active' : ''}`}
                          onClick={() => setPlayerColor('white')}
                          title="Play as White"
                        >
                          <span className="stone white" />
                          <span>White</span>
                        </button>
                        <button
                          type="button"
                          className={`color-pill ${playerColor === 'random' ? 'active' : ''}`}
                          onClick={() => setPlayerColor('random')}
                          title="Random Side"
                        >
                          <span className="stone random" />
                          <span>Auto</span>
                        </button>
                        <button
                          type="button"
                          className={`color-pill ${playerColor === 'black' ? 'active' : ''}`}
                          onClick={() => setPlayerColor('black')}
                          title="Play as Black"
                        >
                          <span className="stone black" />
                          <span>Black</span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="launch-match-btn"
                      onClick={handleLaunchMatch}
                    >
                      <span>INITIATE MATCH VS {bot.name.toUpperCase()}</span>
                      <ArrowRight size={17} />
                    </button>
                  </div>
                ) : (
                  <div className="card-tap-to-inspect">
                    <span>Click to Inspect Challenger</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ====================================================================
          CAROUSEL ORBIT SELECTOR & TIMELINE STRIP
          ==================================================================== */}
      <div className="carousel-orbit-strip">
        <div className="orbit-bots-row">
          {BOT_PROFILES.map((bot, index) => {
            const isSelected = index === currentIndex;
            const botTierKey = getBotTier(bot.elo);
            const botTierMeta = TIER_META[botTierKey] || TIER_META.beginner;
            const isBeatenByPlayer = isAuthenticated && isBeaten(bot.id);

            return (
              <button
                key={bot.id}
                type="button"
                className={`orbit-bot-cell ${isSelected ? 'active' : ''}`}
                style={{ '--bot-accent': botTierMeta.color }}
                onClick={() => goToIndex(index)}
              >
                <div className="orbit-avatar-wrap">
                  <img
                    src={bot.avatar}
                    alt={bot.name}
                    className="orbit-avatar"
                    onError={(e) => {
                      e.target.src = '/assets/bots/timmy.png';
                    }}
                  />
                  {isBeatenByPlayer && (
                    <span className="orbit-beaten-tag">
                      <CheckCircle2 size={10} />
                    </span>
                  )}
                </div>

                <div className="orbit-info">
                  <span className="orbit-name">{bot.name}</span>
                  <span className="orbit-elo">{bot.elo} ELO</span>
                </div>

                {isSelected && <div className="orbit-active-beacon" />}
              </button>
            );
          })}
        </div>

        <div className="carousel-nav-hints">
          <span>💡 Swipe / Drag or use [←] [→] Arrow Keys to rotate the 3D challenger cylinder</span>
        </div>
      </div>
    </div>
  );
}
