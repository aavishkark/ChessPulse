import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  Palette,
  Sliders,
  Volume2,
  VolumeX,
  Compass,
  RotateCcw,
  Play,
  Check,
  Sparkles,
  Layers,
  Activity,
  Music,
  CheckCircle2
} from 'lucide-react';
import { useBoardCustomization } from '../../contexts/BoardCustomizationContext';
import { PIECE_SETS, getCustomPieces, getPieceSvgUrl } from '../../utils/pieceSets';
import { SOUND_THEMES, playSound, getMoveSound } from '../../utils/sounds';
import PageHeader, { PageAmbient } from '../../Components/UI/PageHeader';
import './customize.css';

const PRESET_THEMES = [
  { name: 'Emerald Forest', dark: '#779952', light: '#edeed1', highlight: 'rgba(255, 255, 0, 0.4)', tag: 'Tactical' },
  { name: 'Tournament Green', dark: '#35654d', light: '#e8ecd0', highlight: 'rgba(255, 215, 0, 0.45)', tag: 'FIDE Classic' },
  { name: 'Deep Ocean', dark: '#4b7399', light: '#d3d9da', highlight: 'rgba(56, 189, 248, 0.45)', tag: 'Maritime' },
  { name: 'Ice Cold', dark: '#2b5278', light: '#cbe3fb', highlight: 'rgba(6, 182, 212, 0.45)', tag: 'Arctic' },
  { name: 'Midnight Purple', dark: '#7c3aed', light: '#e9d5ff', highlight: 'rgba(192, 132, 252, 0.45)', tag: 'Neon' },
  { name: 'Royal Crimson', dark: '#be1e2d', light: '#ffcece', highlight: 'rgba(239, 68, 68, 0.45)', tag: 'Imperial' },
  { name: 'Classic Wood', dark: '#b58863', light: '#f0d9b5', highlight: 'rgba(245, 158, 11, 0.45)', tag: 'Organic' },
  { name: 'Slate Modern', dark: '#475569', light: '#e2e8f0', highlight: 'rgba(148, 163, 184, 0.45)', tag: 'Minimal' },
  { name: 'Obsidian Dark', dark: '#24272c', light: '#434850', highlight: 'rgba(245, 158, 11, 0.45)', tag: 'Stealth' },
  { name: 'Rose Gold', dark: '#9c4146', light: '#f2dede', highlight: 'rgba(251, 113, 133, 0.45)', tag: 'Warm' },
];

const DEMO_MOVES = ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Bxc6', 'dxc6', 'O-O'];

export default function CustomizePage() {
  const {
    darkSquareColor,
    lightSquareColor,
    showNotation,
    pieceSet,
    animationSpeed,
    highlightColor,
    arrowColor,
    soundEnabled,
    soundTheme,
    updateBoardSettings,
    resetToDefaults,
  } = useBoardCustomization();

  const [activeSection, setActiveSection] = useState('moods'); // 'moods' | 'pieces' | 'audio' | 'board'
  const [game, setGame] = useState(new Chess());
  const [boardOrientation, setBoardOrientation] = useState('white');
  const [lastMove, setLastMove] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [demoStep, setDemoStep] = useState(0);
  const [lastTestedSound, setLastTestedSound] = useState(null);
  const [saveIndicator, setSaveIndicator] = useState(false);

  // Hidden native color picker refs
  const darkInputRef = useRef(null);
  const lightInputRef = useRef(null);
  const highlightInputRef = useRef(null);
  const arrowInputRef = useRef(null);

  // Trigger pulse whenever settings change
  const triggerSaveNotification = useCallback(() => {
    setSaveIndicator(true);
    const timer = setTimeout(() => setSaveIndicator(false), 1400);
    return () => clearTimeout(timer);
  }, []);

  const handleUpdate = useCallback(
    (newSettings) => {
      updateBoardSettings(newSettings);
      triggerSaveNotification();
    },
    [updateBoardSettings, triggerSaveNotification]
  );

  // Move handler
  const handleMove = useCallback(
    (from, to, promotion = 'q') => {
      try {
        const newGame = new Chess(game.fen());
        const move = newGame.move({ from, to, promotion });

        if (!move) return false;

        setGame(newGame);
        setLastMove({ from, to });

        if (soundEnabled) {
          const isCapture = !!move.captured;
          const isCheck = newGame.isCheck();
          const isCastle = move.san.includes('O-');
          const isPromotion = !!move.promotion;
          const soundType = getMoveSound(move, isCapture, isCheck, isCastle, isPromotion);
          playSound(soundType, soundTheme, soundEnabled);
        }

        return true;
      } catch {
        return false;
      }
    },
    [game, soundEnabled, soundTheme]
  );

  // Drag-and-drop callback
  const onPieceDrop = useCallback(
    (dropArg1, dropArg2) => {
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
      return handleMove(sourceSquare, targetSquare);
    },
    [handleMove]
  );

  // Click-to-move callback
  const onSquareClick = useCallback(
    (square) => {
      if (!selectedSquare) {
        const piece = game.get(square);
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
          const legal = game.moves({ square, verbose: true });
          setPossibleMoves(legal.map((m) => m.to));
        }
        return;
      }

      if (selectedSquare === square) {
        setSelectedSquare(null);
        setPossibleMoves([]);
        return;
      }

      const clickedPiece = game.get(square);
      if (clickedPiece && clickedPiece.color === game.turn()) {
        setSelectedSquare(square);
        const legal = game.moves({ square, verbose: true });
        setPossibleMoves(legal.map((m) => m.to));
        return;
      }

      const from = selectedSquare;
      setSelectedSquare(null);
      setPossibleMoves([]);
      handleMove(from, square);
    },
    [selectedSquare, game, handleMove]
  );

  // Test next demo move
  const playNextDemoMove = useCallback(() => {
    if (demoStep >= DEMO_MOVES.length) {
      // Loop back to start
      const freshGame = new Chess();
      setGame(freshGame);
      setLastMove(null);
      setSelectedSquare(null);
      setPossibleMoves([]);
      setDemoStep(0);
      return;
    }

    const moveSan = DEMO_MOVES[demoStep];
    try {
      const nextGame = new Chess(game.fen());
      const res = nextGame.move(moveSan);
      if (res) {
        setGame(nextGame);
        setLastMove({ from: res.from, to: res.to });
        setSelectedSquare(null);
        setPossibleMoves([]);
        setDemoStep((s) => s + 1);

        if (soundEnabled) {
          const isCapture = !!res.captured;
          const isCheck = nextGame.isCheck();
          const isCastle = res.san.includes('O-');
          const isPromotion = !!res.promotion;
          const soundType = getMoveSound(res, isCapture, isCheck, isCastle, isPromotion);
          playSound(soundType, soundTheme, soundEnabled);
        }
      }
    } catch {
      // If move failed against current position, reset and apply
      const fresh = new Chess();
      const res = fresh.move(moveSan);
      if (res) {
        setGame(fresh);
        setLastMove({ from: res.from, to: res.to });
        setDemoStep(1);
      }
    }
  }, [demoStep, game, soundEnabled, soundTheme]);

  // Reset demo board
  const resetBoardPosition = useCallback(() => {
    setGame(new Chess());
    setLastMove(null);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setDemoStep(0);
  }, []);

  // Preset Selection
  const applyPreset = (preset) => {
    handleUpdate({
      darkSquareColor: preset.dark,
      lightSquareColor: preset.light,
      highlightColor: preset.highlight,
    });
  };

  // Sound Theme Selection
  const handleSoundThemeSelect = (themeId) => {
    handleUpdate({ soundTheme: themeId });
    if (soundEnabled && themeId !== 'silent') {
      playSound('move', themeId, true);
      setLastTestedSound('move');
    }
  };

  // Sound Preview Button
  const testSoundEffect = (type) => {
    if (soundTheme === 'silent') return;
    playSound(type, soundTheme, true);
    setLastTestedSound(type);
    setTimeout(() => setLastTestedSound(null), 1200);
  };

  // Dynamic square highlights
  const customSquareStyles = useMemo(() => {
    const styles = {};

    if (lastMove) {
      styles[lastMove.from] = { backgroundColor: highlightColor || 'rgba(255, 215, 0, 0.4)' };
      styles[lastMove.to] = { backgroundColor: highlightColor || 'rgba(255, 215, 0, 0.4)' };
    }

    if (selectedSquare) {
      styles[selectedSquare] = {
        backgroundColor: 'rgba(16, 185, 129, 0.4)',
        boxShadow: 'inset 0 0 0 3px #10b981',
      };
    }

    possibleMoves.forEach((sq) => {
      styles[sq] = {
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.8) 22%, transparent 26%)',
      };
    });

    return styles;
  }, [lastMove, selectedSquare, possibleMoves, highlightColor]);

  // Active preset match check
  const activePreset = useMemo(() => {
    return PRESET_THEMES.find(
      (p) => p.dark.toLowerCase() === darkSquareColor?.toLowerCase() && p.light.toLowerCase() === lightSquareColor?.toLowerCase()
    );
  }, [darkSquareColor, lightSquareColor]);

  return (
    <div className="customize-page cp-subpage">
      <PageAmbient watermark="STUDIO" theme="gold" />

      <div className="customize-container">
        {/* ====================================================================
            PAGE HEADER & TOP TELEMETRY RIBBON
            ==================================================================== */}
        <div className="studio-topbar-wrapper">
          <PageHeader
            badge="HARDWARE TELEMETRY · BOARD CALIBRATION ENGINE"
            title="Board Studio"
            accent="Studio"
            subtitle="Calibrate square pigments, Staunton piece geometry, coordinate notation, and acoustic feedback."
            theme="gold"
            rightElement={
              <div className="studio-save-badge">
                <span className={`live-pulse-dot ${saveIndicator ? 'active' : ''}`} />
                <span>{saveIndicator ? 'SAVED TO LOCAL STORAGE' : 'AUTO-SAVED IN BROWSER'}</span>
              </div>
            }
          />

          {/* Quick HUD Metrics */}
          <div className="cp-console-window studio-hud-ribbon">
            <div className="studio-hud-cell">
              <span className="hud-code">PIGMENT // PALETTE</span>
              <span className="hud-val gold">{activePreset ? activePreset.name : 'Custom Matrix'}</span>
              <span className="hud-lbl">{darkSquareColor} / {lightSquareColor}</span>
            </div>
            <div className="studio-hud-cell">
              <span className="hud-code">GEOMETRY // PIECE SET</span>
              <span className="hud-val cyan">
                {PIECE_SETS.find((s) => s.id === pieceSet)?.name || pieceSet}
              </span>
              <span className="hud-lbl">High-Precision Vector Assets</span>
            </div>
            <div className="studio-hud-cell">
              <span className="hud-code">ACOUSTICS // ENGINE</span>
              <span className="hud-val emerald">
                {soundEnabled ? (SOUND_THEMES.find((t) => t.id === soundTheme)?.name || soundTheme) : 'Muted'}
              </span>
              <span className="hud-lbl">{soundEnabled ? 'Low-Latency Audio Relay' : 'Audio Disabled'}</span>
            </div>
            <div className="studio-hud-cell">
              <span className="hud-code">ANIMATION // CADENCE</span>
              <span className="hud-val violet">
                {animationSpeed === 0 ? 'Instant' : `${animationSpeed}ms`}
              </span>
              <span className="hud-lbl">Square Translation Time</span>
            </div>
          </div>
        </div>

        {/* ====================================================================
            MAIN 2-COLUMN STUDIO WORKBENCH
            ==================================================================== */}
        <div className="studio-workbench-grid">
          {/* LEFT COLUMN: CALIBRATION DOCK */}
          <div className="cp-console-window studio-calibration-console">
            {/* Navigation Tabs */}
            <div className="cp-window-topbar">
              <div className="calibration-tabs-nav">
                <button
                  type="button"
                  className={`cal-tab-pill ${activeSection === 'moods' ? 'active' : ''}`}
                  onClick={() => setActiveSection('moods')}
                >
                  <Palette size={13} />
                  <span>Moods & Pigments</span>
                </button>
                <button
                  type="button"
                  className={`cal-tab-pill ${activeSection === 'pieces' ? 'active' : ''}`}
                  onClick={() => setActiveSection('pieces')}
                >
                  <Layers size={13} />
                  <span>Piece Sets</span>
                </button>
                <button
                  type="button"
                  className={`cal-tab-pill ${activeSection === 'audio' ? 'active' : ''}`}
                  onClick={() => setActiveSection('audio')}
                >
                  <Music size={13} />
                  <span>Acoustics</span>
                </button>
                <button
                  type="button"
                  className={`cal-tab-pill ${activeSection === 'board' ? 'active' : ''}`}
                  onClick={() => setActiveSection('board')}
                >
                  <Sliders size={13} />
                  <span>Board Options</span>
                </button>
              </div>
            </div>

            <div className="studio-calibration-body">
              {/* SECTION 1: MOODS & PIGMENTS */}
              {activeSection === 'moods' && (
                <div className="cal-section-content">
                  <div className="section-subheading">
                    <span className="subheading-tag">CURATED PALETTES //</span>
                    <h4>Tactical Preset Moods</h4>
                    <p>Select proven tournament contrast ratios or define customized hex values below.</p>
                  </div>

                  <div className="presets-matrix-grid">
                    {PRESET_THEMES.map((preset) => {
                      const isSelected =
                        darkSquareColor.toLowerCase() === preset.dark.toLowerCase() &&
                        lightSquareColor.toLowerCase() === preset.light.toLowerCase();

                      return (
                        <button
                          key={preset.name}
                          type="button"
                          className={`preset-theme-card ${isSelected ? 'active' : ''}`}
                          onClick={() => applyPreset(preset)}
                        >
                          <div className="preset-swatch-duo">
                            <div className="swatch-half" style={{ background: preset.dark }} />
                            <div className="swatch-half" style={{ background: preset.light }} />
                          </div>
                          <div className="preset-meta">
                            <span className="preset-name">{preset.name}</span>
                            <span className="preset-tag">{preset.tag}</span>
                          </div>
                          {isSelected && <CheckCircle2 size={15} className="preset-check" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="section-divider" />

                  <div className="section-subheading">
                    <span className="subheading-tag">EXACT VALUES //</span>
                    <h4>Custom Pigment Pickers</h4>
                  </div>

                  <div className="custom-pickers-stack">
                    {/* Dark Squares */}
                    <div className="color-picker-row">
                      <div className="picker-meta">
                        <span className="picker-title">Dark Squares</span>
                        <span className="picker-sub">Hex: {darkSquareColor}</span>
                      </div>
                      <div className="picker-inputs-group">
                        <input
                          type="text"
                          className="hex-text-input"
                          value={darkSquareColor}
                          onChange={(e) => handleUpdate({ darkSquareColor: e.target.value })}
                        />
                        <button
                          type="button"
                          className="swatch-btn"
                          style={{ background: darkSquareColor }}
                          onClick={() => darkInputRef.current?.click()}
                          title="Open Color Picker"
                        >
                          <input
                            ref={darkInputRef}
                            type="color"
                            value={darkSquareColor.startsWith('#') && darkSquareColor.length === 7 ? darkSquareColor : '#779952'}
                            onChange={(e) => handleUpdate({ darkSquareColor: e.target.value })}
                            className="hidden-native-picker"
                          />
                        </button>
                      </div>
                    </div>

                    {/* Light Squares */}
                    <div className="color-picker-row">
                      <div className="picker-meta">
                        <span className="picker-title">Light Squares</span>
                        <span className="picker-sub">Hex: {lightSquareColor}</span>
                      </div>
                      <div className="picker-inputs-group">
                        <input
                          type="text"
                          className="hex-text-input"
                          value={lightSquareColor}
                          onChange={(e) => handleUpdate({ lightSquareColor: e.target.value })}
                        />
                        <button
                          type="button"
                          className="swatch-btn"
                          style={{ background: lightSquareColor }}
                          onClick={() => lightInputRef.current?.click()}
                          title="Open Color Picker"
                        >
                          <input
                            ref={lightInputRef}
                            type="color"
                            value={lightSquareColor.startsWith('#') && lightSquareColor.length === 7 ? lightSquareColor : '#edeed1'}
                            onChange={(e) => handleUpdate({ lightSquareColor: e.target.value })}
                            className="hidden-native-picker"
                          />
                        </button>
                      </div>
                    </div>

                    {/* Move Highlight Color */}
                    <div className="color-picker-row">
                      <div className="picker-meta">
                        <span className="picker-title">Move Highlights</span>
                        <span className="picker-sub">Square overlay color on last move</span>
                      </div>
                      <div className="picker-inputs-group">
                        <input
                          type="text"
                          className="hex-text-input"
                          value={highlightColor}
                          onChange={(e) => handleUpdate({ highlightColor: e.target.value })}
                        />
                        <button
                          type="button"
                          className="swatch-btn"
                          style={{ background: highlightColor }}
                          onClick={() => highlightInputRef.current?.click()}
                          title="Open Color Picker"
                        >
                          <input
                            ref={highlightInputRef}
                            type="color"
                            value="#ffd700"
                            onChange={(e) => handleUpdate({ highlightColor: `${e.target.value}66` })}
                            className="hidden-native-picker"
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: PIECE SETS */}
              {activeSection === 'pieces' && (
                <div className="cal-section-content">
                  <div className="section-subheading">
                    <span className="subheading-tag">STAUNTON & STYLES //</span>
                    <h4>Vector Piece Sets</h4>
                    <p>Choose your preferred piece set. High-definition vector graphics render crisp at any resolution.</p>
                  </div>

                  <div className="pieces-matrix-grid">
                    {PIECE_SETS.map((set) => {
                      const isSelected = pieceSet === set.id;

                      return (
                        <button
                          key={set.id}
                          type="button"
                          className={`piece-set-card ${isSelected ? 'active' : ''}`}
                          onClick={() => handleUpdate({ pieceSet: set.id })}
                        >
                          <div className="piece-preview-pod">
                            <img
                              src={getPieceSvgUrl(set.id, 'wK')}
                              alt={`${set.name} King`}
                              className="piece-preview-img"
                              onError={(e) => {
                                // Fallback to classic if loading fails
                                e.target.src = getPieceSvgUrl('cburnett', 'wK');
                              }}
                            />
                            <img
                              src={getPieceSvgUrl(set.id, 'wN')}
                              alt={`${set.name} Knight`}
                              className="piece-preview-img knight"
                              onError={(e) => {
                                e.target.src = getPieceSvgUrl('cburnett', 'wN');
                              }}
                            />
                          </div>

                          <div className="piece-set-details">
                            <span className="piece-set-title">{set.name}</span>
                            <span className="piece-set-category">{set.category}</span>
                          </div>

                          {isSelected && <CheckCircle2 size={16} className="piece-check-icon" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 3: ACOUSTICS & AUDIO */}
              {activeSection === 'audio' && (
                <div className="cal-section-content">
                  <div className="section-subheading">
                    <span className="subheading-tag">ACOUSTIC PROFILES //</span>
                    <h4>Acoustic Feedback Engine</h4>
                    <p>Auditory confirmation for moves, captures, checks, castling, and match conclusions.</p>
                  </div>

                  {/* Master Toggle */}
                  <div className="audio-master-card">
                    <div className="master-meta">
                      {soundEnabled ? <Volume2 size={20} className="audio-icon on" /> : <VolumeX size={20} className="audio-icon off" />}
                      <div>
                        <strong>Sound Effects</strong>
                        <span>{soundEnabled ? 'Acoustic cues active on moves and events' : 'All chess sounds disabled'}</span>
                      </div>
                    </div>
                    <label className="switch-toggle-wrap">
                      <input
                        type="checkbox"
                        checked={soundEnabled}
                        onChange={(e) => handleUpdate({ soundEnabled: e.target.checked })}
                      />
                      <span className="switch-slider" />
                    </label>
                  </div>

                  {soundEnabled && (
                    <>
                      {/* Theme Selector */}
                      <div className="audio-themes-grid">
                        {SOUND_THEMES.map((theme) => {
                          const isSelected = soundTheme === theme.id;

                          return (
                            <button
                              key={theme.id}
                              type="button"
                              className={`audio-theme-card ${isSelected ? 'active' : ''}`}
                              onClick={() => handleSoundThemeSelect(theme.id)}
                            >
                              <div className="audio-theme-meta">
                                <span className="theme-name">{theme.name}</span>
                                <span className="theme-desc">{theme.desc}</span>
                              </div>
                              {isSelected && <CheckCircle2 size={15} className="audio-check" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Interactive Audio Test Bar */}
                      <div className="audio-test-bar cp-console-window">
                        <div className="test-bar-header">
                          <span className="test-bar-title">
                            <Sparkles size={13} />
                            <span>TEST ACOUSTIC CUES ({SOUND_THEMES.find((t) => t.id === soundTheme)?.name || soundTheme})</span>
                          </span>
                          <span className="test-bar-hint">Click to listen</span>
                        </div>
                        <div className="test-buttons-row">
                          <button
                            type="button"
                            className={`test-cue-btn ${lastTestedSound === 'move' ? 'tested' : ''}`}
                            onClick={() => testSoundEffect('move')}
                          >
                            <span>Move</span>
                          </button>
                          <button
                            type="button"
                            className={`test-cue-btn ${lastTestedSound === 'capture' ? 'tested' : ''}`}
                            onClick={() => testSoundEffect('capture')}
                          >
                            <span>Capture</span>
                          </button>
                          <button
                            type="button"
                            className={`test-cue-btn ${lastTestedSound === 'check' ? 'tested' : ''}`}
                            onClick={() => testSoundEffect('check')}
                          >
                            <span>Check</span>
                          </button>
                          <button
                            type="button"
                            className={`test-cue-btn ${lastTestedSound === 'castle' ? 'tested' : ''}`}
                            onClick={() => testSoundEffect('castle')}
                          >
                            <span>Castle</span>
                          </button>
                          <button
                            type="button"
                            className={`test-cue-btn ${lastTestedSound === 'victory' ? 'tested' : ''}`}
                            onClick={() => testSoundEffect('victory')}
                          >
                            <span>Victory</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* SECTION 4: BOARD OPTIONS */}
              {activeSection === 'board' && (
                <div className="cal-section-content">
                  <div className="section-subheading">
                    <span className="subheading-tag">HUD & ANIMATION //</span>
                    <h4>Board Display Options</h4>
                    <p>Configure coordinate notation and piece transition animation speeds.</p>
                  </div>

                  {/* Show Notation Toggle */}
                  <div className="audio-master-card">
                    <div className="master-meta">
                      <Sliders size={20} className="audio-icon on" />
                      <div>
                        <strong>Show Algebraic Notation</strong>
                        <span>Display rank numbers (1-8) and file letters (a-h) along the board borders</span>
                      </div>
                    </div>
                    <label className="switch-toggle-wrap">
                      <input
                        type="checkbox"
                        checked={showNotation}
                        onChange={(e) => handleUpdate({ showNotation: e.target.checked })}
                      />
                      <span className="switch-slider" />
                    </label>
                  </div>

                  {/* Animation Cadence */}
                  <div className="animation-cadence-group">
                    <div className="group-label-row">
                      <span className="group-title">Piece Animation Duration</span>
                      <span className="group-val">{animationSpeed === 0 ? 'Instant (0ms)' : `${animationSpeed}ms`}</span>
                    </div>

                    <div className="speed-pills-row">
                      {[
                        { speed: 0, label: 'Instant (0ms)', desc: 'No transitions' },
                        { speed: 100, label: 'Fast (100ms)', desc: 'Bullet speed' },
                        { speed: 200, label: 'Normal (200ms)', desc: 'Balanced FIDE' },
                        { speed: 300, label: 'Relaxed (300ms)', desc: 'Smooth glide' },
                        { speed: 500, label: 'Cinematic (500ms)', desc: 'Majestic arcs' }
                      ].map((item) => (
                        <button
                          key={item.speed}
                          type="button"
                          className={`speed-pill-btn ${animationSpeed === item.speed ? 'active' : ''}`}
                          onClick={() => handleUpdate({ animationSpeed: item.speed })}
                        >
                          <span className="speed-pill-name">{item.label}</span>
                          <span className="speed-pill-desc">{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* RESET DEFAULTS BUTTON */}
              <div className="studio-reset-bar">
                <button
                  type="button"
                  className="reset-defaults-btn"
                  onClick={() => {
                    resetToDefaults();
                    triggerSaveNotification();
                  }}
                >
                  <RotateCcw size={13} />
                  <span>Restore Factory Defaults</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: INTERACTIVE PREVIEW STAGE */}
          <div className="cp-console-window studio-preview-console">
            <div className="cp-window-topbar">
              <div className="cp-window-title">
                <span className="cp-window-dot gold" />
                <span>INTERACTIVE PREVIEW STAGE // LIVE CALIBRATION</span>
              </div>

              <div className="preview-topbar-actions">
                <button
                  type="button"
                  className="preview-util-btn"
                  onClick={() => setBoardOrientation((o) => (o === 'white' ? 'black' : 'white'))}
                  title="Flip board perspective"
                >
                  <Compass size={13} />
                  <span>Flip View ({boardOrientation})</span>
                </button>
                <button
                  type="button"
                  className="preview-util-btn"
                  onClick={resetBoardPosition}
                  title="Reset board pieces to start"
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  className="preview-util-btn primary"
                  onClick={playNextDemoMove}
                  title="Play next move in sample game"
                >
                  <Play size={13} />
                  <span>Demo Ply ({demoStep}/{DEMO_MOVES.length})</span>
                </button>
              </div>
            </div>

            <div className="studio-preview-body">
              {/* Chessboard Container */}
              <div className="studio-board-frame-outer">
                <div className="studio-board-frame">
                  <Chessboard
                    id="studio-preview-board"
                    key={`${pieceSet}-${darkSquareColor}-${lightSquareColor}-${animationSpeed}-${showNotation}-${boardOrientation}`}
                    options={{
                      position: game.fen(),
                      boardOrientation: boardOrientation,
                      allowDragging: true,
                      showNotation: showNotation,
                      pieces: getCustomPieces(pieceSet),
                      customPieces: getCustomPieces(pieceSet),
                      animationDurationInMs: animationSpeed,
                      showAnimations: animationSpeed > 0,
                      darkSquareStyle: { backgroundColor: darkSquareColor },
                      lightSquareStyle: { backgroundColor: lightSquareColor },
                      squareStyles: customSquareStyles,
                      arrowOptions: {
                        color: arrowColor,
                        opacity: 0.8,
                      },
                      onPieceDrop: onPieceDrop,
                      onSquareClick: onSquareClick,
                    }}
                  />
                </div>
              </div>

              {/* Board Telemetry Footer */}
              <div className="studio-board-footer-bar">
                <div className="footer-status-chip">
                  <span className="footer-turn-dot" style={{ background: game.turn() === 'w' ? '#f8fafc' : '#0f172a' }} />
                  <span>{game.turn() === 'w' ? 'WHITE TO MOVE' : 'BLACK TO MOVE'}</span>
                </div>

                <div className="footer-fen-chip" title={game.fen()}>
                  <span className="fen-label">FEN:</span>
                  <span className="fen-val">{game.fen()}</span>
                </div>

                <div className="footer-hint-text">
                  <span>💡 Drag pieces or click to test movement & acoustics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
