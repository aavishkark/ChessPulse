import { useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useBoardCustomization } from '../../contexts/BoardCustomizationContext';
import { PIECE_SETS, getCustomPieces } from '../../utils/pieceSets';
import { SOUND_THEMES, playSound } from '../../utils/sounds';
import './customize.css';
import { Link } from 'react-router-dom';



const PRESET_COLORS = [
    { name: 'Classic Green', dark: '#779952', light: '#edeed1' },
    { name: 'Blue Ocean', dark: '#5b7c99', light: '#d3d9da' },
    { name: 'Purple Dream', dark: '#9c27b0', light: '#e1bee7' },
    { name: 'Brown Wood', dark: '#b58863', light: '#f0d9b5' },
    { name: 'Gray Modern', dark: '#6c757d', light: '#dee2e6' },
    { name: 'Red Ember', dark: '#c62828', light: '#ffcdd2' },
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

    console.log('[CustomizePage] Current pieceSet:', pieceSet);

    const [previewGame] = useState(() => {
        const game = new Chess();
        game.load('rnbqkb1r/pp2pppp/3p1n2/2p5/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 0 4');
        return game;
    });

    const handlePresetColor = (preset) => {
        updateBoardSettings({
            darkSquareColor: preset.dark,
            lightSquareColor: preset.light,
        });
    };

    return (
        <div className="customize-page">
            <div className="customize-container">
                <div className="customize-header">
                    <Link to="/" className="back-link">← Back</Link>
                    <h1>Customize Your Board</h1>
                    <p className="customize-subtitle">Personalize all chessboards across the site</p>
                </div>

                <div className="customize-content">
                    <div className="customize-settings">
                        <section className="setting-section">
                            <h2>Color Presets</h2>
                            <div className="preset-grid">
                                {PRESET_COLORS.map((preset) => (
                                    <button
                                        key={preset.name}
                                        className="preset-button"
                                        onClick={() => handlePresetColor(preset)}
                                        title={preset.name}
                                    >
                                        <div className="preset-preview">
                                            <div className="preset-square" style={{ backgroundColor: preset.dark }} />
                                            <div className="preset-square" style={{ backgroundColor: preset.light }} />
                                        </div>
                                        <span className="preset-name">{preset.name}</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="setting-section">
                            <h2>Custom Colors</h2>
                            <div className="color-pickers">
                                <div className="color-picker-item">
                                    <label htmlFor="dark-square-color">Dark Squares</label>
                                    <div className="color-input-wrapper">
                                        <input
                                            id="dark-square-color"
                                            type="color"
                                            value={darkSquareColor}
                                            onChange={(e) => updateBoardSettings({ darkSquareColor: e.target.value })}
                                            className="color-input"
                                        />
                                        <input
                                            type="text"
                                            value={darkSquareColor}
                                            onChange={(e) => updateBoardSettings({ darkSquareColor: e.target.value })}
                                            className="color-text-input"
                                            placeholder="#779952"
                                        />
                                    </div>
                                </div>

                                <div className="color-picker-item">
                                    <label htmlFor="light-square-color">Light Squares</label>
                                    <div className="color-input-wrapper">
                                        <input
                                            id="light-square-color"
                                            type="color"
                                            value={lightSquareColor}
                                            onChange={(e) => updateBoardSettings({ lightSquareColor: e.target.value })}
                                            className="color-input"
                                        />
                                        <input
                                            type="text"
                                            value={lightSquareColor}
                                            onChange={(e) => updateBoardSettings({ lightSquareColor: e.target.value })}
                                            className="color-text-input"
                                            placeholder="#edeed1"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="setting-section">
                            <h2>Piece Set</h2>
                            <p className="section-description">Choose the style of your chess pieces.</p>
                            <div className="piece-set-grid">
                                {PIECE_SETS.map((set) => (
                                    <button
                                        key={set.id}
                                        className={`piece-set-button ${pieceSet === set.id ? 'active' : ''}`}
                                        onClick={() => updateBoardSettings({ pieceSet: set.id })}
                                    >
                                        {set.name}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="setting-section">
                            <h2>Animation Speed</h2>
                            <p className="section-description">Control how fast pieces move on the board.</p>
                            <div className="piece-set-grid">
                                {[
                                    { id: 0, name: 'Instant' },
                                    { id: 100, name: 'Fast' },
                                    { id: 200, name: 'Normal' },
                                    { id: 400, name: 'Slow' },
                                ].map((speed) => (
                                    <button
                                        key={speed.id}
                                        className={`piece-set-button ${animationSpeed === speed.id ? 'active' : ''}`}
                                        onClick={() => updateBoardSettings({ animationSpeed: speed.id })}
                                    >
                                        {speed.name}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="setting-section">
                            <h2>Move Highlights & Arrows</h2>
                            <p className="section-description">Customize how moves are highlighted on the board.</p>
                            <div className="color-pickers">
                                <div className="color-picker-item">
                                    <label htmlFor="highlight-color">Last Move Highlight</label>
                                    <div className="color-input-wrapper">
                                        <input
                                            id="highlight-color"
                                            type="color"
                                            value={highlightColor.startsWith('rgba') ? '#ffff00' : highlightColor.slice(0, 7)}
                                            onInput={(e) => updateBoardSettings({ highlightColor: e.target.value + '66' })}
                                            onChange={(e) => updateBoardSettings({ highlightColor: e.target.value + '66' })}
                                            className="color-input"
                                        />
                                        <span className="color-text-input" style={{ background: highlightColor, border: '1px solid var(--border)' }}></span>
                                    </div>
                                </div>
                                <div className="color-picker-item">
                                    <label htmlFor="arrow-color">Arrow Color</label>
                                    <div className="color-input-wrapper">
                                        <input
                                            id="arrow-color"
                                            type="color"
                                            value={arrowColor.startsWith('rgba') ? '#ffaa00' : arrowColor.slice(0, 7)}
                                            onInput={(e) => updateBoardSettings({ arrowColor: e.target.value + 'cc' })}
                                            onChange={(e) => updateBoardSettings({ arrowColor: e.target.value + 'cc' })}
                                            className="color-input"
                                        />
                                        <span className="color-text-input" style={{ background: arrowColor, border: '1px solid var(--border)' }}></span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="setting-section">
                            <h2>Sounds</h2>
                            <p className="section-description">Enable move sounds and choose a theme.</p>
                            <div className="toggle-options">
                                <label className="toggle-label">
                                    <input
                                        type="checkbox"
                                        checked={soundEnabled}
                                        onChange={(e) => updateBoardSettings({ soundEnabled: e.target.checked })}
                                        className="toggle-input"
                                    />
                                    <span className="toggle-text">Enable move sounds</span>
                                </label>
                            </div>
                            {soundEnabled && (
                                <div className="piece-set-grid" style={{ marginTop: '16px' }}>
                                    {SOUND_THEMES.map((theme) => (
                                        <button
                                            key={theme.id}
                                            className={`piece-set-button ${soundTheme === theme.id ? 'active' : ''}`}
                                            onClick={() => {
                                                updateBoardSettings({ soundTheme: theme.id });
                                                if (theme.id !== 'silent') {
                                                    playSound('move', theme.id, true);
                                                }
                                            }}
                                        >
                                            {theme.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="setting-section">
                            <h2>Display Options</h2>
                            <div className="toggle-options">
                                <label className="toggle-label">
                                    <input
                                        type="checkbox"
                                        checked={showNotation}
                                        onChange={(e) => updateBoardSettings({ showNotation: e.target.checked })}
                                        className="toggle-input"
                                    />
                                    <span className="toggle-text">Show board notation (a-h, 1-8)</span>
                                </label>
                            </div>
                        </section>

                        <div className="customize-actions">
                            <button className="reset-button" onClick={resetToDefaults}>
                                Reset to Defaults
                            </button>
                        </div>
                    </div>

                    <div className="customize-preview">
                        <h2>Live Preview</h2>
                        <p className="preview-subtitle">Changes apply instantly to all boards</p>
                        <div className="preview-board-container">
                            <Chessboard
                                key={pieceSet}
                                id="customize-preview-board"
                                options={{
                                    position: previewGame.fen(),
                                    arePiecesDraggable: false,
                                    showNotation: showNotation,
                                    darkSquareStyle: { backgroundColor: darkSquareColor },
                                    lightSquareStyle: { backgroundColor: lightSquareColor },
                                    customPieces: getCustomPieces(pieceSet)
                                }}
                                boardWidth={Math.min(500, window.innerWidth * 0.4)}
                            />
                        </div>
                        <div className="preview-info">
                            <div className="info-badge">
                                <span className="info-label">Dark:</span>
                                <span className="info-value">{darkSquareColor}</span>
                            </div>
                            <div className="info-badge">
                                <span className="info-label">Light:</span>
                                <span className="info-value">{lightSquareColor}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
