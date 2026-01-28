import { useState, useRef, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Link } from 'react-router-dom';
import { ChevronLeft, Palette, Music, Layout, Sliders, Check } from 'lucide-react';
import { useBoardCustomization } from '../../contexts/BoardCustomizationContext';
import { PIECE_SETS, getCustomPieces } from '../../utils/pieceSets';
import { SOUND_THEMES, playSound } from '../../utils/sounds';
import './customize.css';

const PRESET_THEMES = [
    { name: 'Emerald Forest', dark: '#779952', light: '#edeed1', highlight: '#ffff0066' },
    { name: 'Deep Ocean', dark: '#4b7399', light: '#d3d9da', highlight: '#00ccff66' },
    { name: 'Midnight Purple', dark: '#7c3aed', light: '#e9d5ff', highlight: '#dfb3ff66' },
    { name: 'Royal Crimson', dark: '#be1e2d', light: '#ffcece', highlight: '#ff000066' },
    { name: 'Classic Wood', dark: '#b58863', light: '#f0d9b5', highlight: '#f5c95866' },
    { name: 'Slate Modern', dark: '#475569', light: '#e2e8f0', highlight: '#94a3b866' },
];

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

    const [game, setGame] = useState(new Chess('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'));

    function onPieceDrop(sourceSquare, targetSquare) {
        try {
            const newGame = new Chess(game.fen());
            const move = newGame.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q',
            });

            if (move === null) return false;

            setGame(newGame);

            if (soundEnabled) {
                const isCapture = move.flags.includes('c') || move.flags.includes('e');
                const isPromote = move.flags.includes('p');
                const isCheck = newGame.inCheck();
                let type = 'move';
                if (isCheck) type = 'check';
                else if (isCapture) type = 'capture';
                else if (isPromote) type = 'promote';

                playSound(type, soundTheme, true);
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    const handleSoundThemeChange = (themeId) => {
        updateBoardSettings({ soundTheme: themeId });
        if (soundEnabled && themeId !== 'silent') {
            playSound('move', themeId, true);
        }
    };

    const handlePresetClick = (preset) => {
        updateBoardSettings({
            darkSquareColor: preset.dark,
            lightSquareColor: preset.light,
            highlightColor: preset.highlight
        });
    };

    return (
        <div className="customize-page">
            <div className="customize-container">
                <div className="customize-sidebar">
                    <div className="sidebar-header">
                        <Link to="/" className="back-link">
                            <ChevronLeft size={16} /> Back to dashboard
                        </Link>
                        <h1>Studio</h1>
                        <p className="sidebar-subtitle">Craft your perfect chess atmosphere.</p>
                    </div>
                    <div className="control-group">
                        <h3><Palette size={14} style={{ display: 'inline', marginRight: 8 }} /> Moods</h3>
                        <div className="presets-grid">
                            {PRESET_THEMES.map((preset) => (
                                <button
                                    key={preset.name}
                                    className="preset-card"
                                    onClick={() => handlePresetClick(preset)}
                                >
                                    <div className="preset-swatch">
                                        <div style={{ background: preset.dark }} />
                                        <div style={{ background: preset.light }} />
                                    </div>
                                    <div className="preset-name">{preset.name}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="control-group">
                        <h3><Sliders size={14} style={{ display: 'inline', marginRight: 8 }} /> Colors</h3>
                        <div className="color-pickers">
                            <label className="color-input-group">
                                <span className="color-preview-dot" style={{ background: darkSquareColor }}></span>
                                <span className="color-label">Dark Squares</span>
                                <span className="color-hex">{darkSquareColor}</span>
                                <input
                                    type="color"
                                    value={darkSquareColor}
                                    onInput={(e) => updateBoardSettings({ darkSquareColor: e.target.value })}
                                    onChange={(e) => updateBoardSettings({ darkSquareColor: e.target.value })}
                                    className="hidden-color-input"
                                />
                            </label>
                            <label className="color-input-group" style={{ marginTop: 8 }}>
                                <span className="color-preview-dot" style={{ background: lightSquareColor }}></span>
                                <span className="color-label">Light Squares</span>
                                <span className="color-hex">{lightSquareColor}</span>
                                <input
                                    type="color"
                                    value={lightSquareColor}
                                    onInput={(e) => updateBoardSettings({ lightSquareColor: e.target.value })}
                                    onChange={(e) => updateBoardSettings({ lightSquareColor: e.target.value })}
                                    className="hidden-color-input"
                                />
                            </label>
                        </div>
                    </div>

                    <div className="control-group">
                        <h3><Layout size={14} style={{ display: 'inline', marginRight: 8 }} /> Assets</h3>

                        <div className="option-row">
                            <span className="option-label">Piece Set</span>
                            <select
                                value={pieceSet}
                                onChange={(e) => updateBoardSettings({ pieceSet: e.target.value })}
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    color: 'white',
                                    padding: '4px 8px',
                                    borderRadius: 6,
                                    cursor: 'pointer'
                                }}
                            >
                                {PIECE_SETS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div className="option-row">
                            <span className="option-label">Show Notation</span>
                            <input
                                type="checkbox"
                                checked={showNotation}
                                onChange={(e) => updateBoardSettings({ showNotation: e.target.checked })}
                                className="option-toggle"
                            />
                        </div>

                        <div className="option-row">
                            <span className="option-label">Animation Speed</span>
                            <select
                                value={animationSpeed}
                                onChange={(e) => updateBoardSettings({ animationSpeed: Number(e.target.value) })}
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    color: 'white',
                                    padding: '4px 8px',
                                    borderRadius: 6,
                                    cursor: 'pointer'
                                }}
                            >
                                <option value={0}>Instant</option>
                                <option value={100}>Fast</option>
                                <option value={200}>Normal</option>
                                <option value={300}>Relaxed</option>
                                <option value={500}>Cinematic</option>
                            </select>
                        </div>
                    </div>

                    <div className="control-group">
                        <h3><Music size={14} style={{ display: 'inline', marginRight: 8 }} /> Audio</h3>
                        <div className="option-row">
                            <span className="option-label">Sound Effects</span>
                            <input
                                type="checkbox"
                                checked={soundEnabled}
                                onChange={(e) => updateBoardSettings({ soundEnabled: e.target.checked })}
                                className="option-toggle"
                            />
                        </div>

                        {soundEnabled && (
                            <div className="presets-grid" style={{ marginTop: 12 }}>
                                {SOUND_THEMES.map((theme) => (
                                    <button
                                        key={theme.id}
                                        className={`preset-card ${soundTheme === theme.id ? 'active' : ''}`}
                                        onClick={() => handleSoundThemeChange(theme.id)}
                                        style={{
                                            textAlign: 'center',
                                            padding: '12px',
                                            borderColor: soundTheme === theme.id ? 'var(--accent)' : ''
                                        }}
                                    >
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{theme.name}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="customize-actions">
                        <button
                            className="reset-button"
                            onClick={resetToDefaults}
                            style={{ opacity: 0.6, fontSize: '0.9rem' }}
                        >
                            Reset all preferences
                        </button>
                    </div>
                </div>

                <div className="customize-preview-area">
                    <div className="preview-board-wrapper" style={{ width: '80%', maxWidth: '800px', margin: '0 auto' }}>
                        <Chessboard
                            id="studio-preview-board"
                            key={`${pieceSet}-${darkSquareColor}-${lightSquareColor}-${animationSpeed}`}
                            options={{
                                position: game.fen(),
                                arePiecesDraggable: true,
                                showNotation: showNotation,
                                customPieces: getCustomPieces(pieceSet),
                                animationDurationInMs: animationSpeed,
                                darkSquareStyle: { backgroundColor: darkSquareColor },
                                lightSquareStyle: { backgroundColor: lightSquareColor },
                                arrowOptions: {
                                    color: arrowColor,
                                    opacity: 0.8
                                },
                                onPieceDrop: onPieceDrop
                            }}
                            onPieceDrop={onPieceDrop}
                            boardWidth={600}
                            customBoardStyle={{
                                borderRadius: '4px',
                                boxShadow: '0 5px 15px rgba(0,0,0,0.5)'
                            }}
                        />
                    </div>

                    <div className="floating-badge">
                        <Check size={16} color="#4ade80" />
                        <span>Auto-saving changes</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
