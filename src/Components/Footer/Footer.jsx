import React from 'react';
import { Link } from 'react-router-dom';
import { PulseBrandMark } from '../Icons/Icons';
import './footer.css';

export const Footer = () => {
    return (
        <footer className="footer-modern">
            <div className="footer-watermark" aria-hidden="true">CHESSPULSE</div>
            <div className="footer-container">
                <div className="footer-grid">
                    {/* Brand & Telemetry Column */}
                    <div className="footer-brand-col">
                        <Link to="/" className="footer-brand-link">
                            <span className="footer-emblem">
                                <PulseBrandMark size={22} />
                            </span>
                            <span className="footer-logo">
                                Chess<span className="footer-logo-accent">Pulse</span>
                            </span>
                        </Link>
                        <p className="footer-tagline">
                            Grandmaster telemetry, Stockfish 17 NNUE WebAssembly evaluation, and real-time tactical training engineered with precision.
                        </p>
                        <div className="footer-telemetry-pill">
                            <span className="footer-telemetry-dot" />
                            <span>ENGINE CLUSTER ONLINE · 0.2ms LATENCY</span>
                        </div>
                    </div>

                    {/* Workstations */}
                    <div className="footer-links-col">
                        <h4 className="footer-col-title">Workstations</h4>
                        <nav className="footer-nav-list">
                            <Link to="/analysis">Position Analysis</Link>
                            <Link to="/tournaments">FIDE Broadcasts</Link>
                            <Link to="/play/online">Live Matchmaking</Link>
                            <Link to="/customize">3D Board Studio</Link>
                        </nav>
                    </div>

                    {/* Tactical Arena */}
                    <div className="footer-links-col">
                        <h4 className="footer-col-title">Tactical Arena</h4>
                        <nav className="footer-nav-list">
                            <Link to="/puzzles">Daily Puzzles</Link>
                            <Link to="/puzzles/rush">Puzzle Rush</Link>
                            <Link to="/puzzles/survival">3-Life Survival</Link>
                            <Link to="/puzzles/curated">Pulse AI Curated</Link>
                        </nav>
                    </div>

                    {/* Competitive */}
                    <div className="footer-links-col">
                        <h4 className="footer-col-title">Competitive</h4>
                        <nav className="footer-nav-list">
                            <Link to="/bots">AI Personalities</Link>
                            <Link to="/puzzles/rating">Skill Track ELO</Link>
                            <Link to="/puzzles/themed">Tactical Themes</Link>
                            <Link to="/puzzles/leaderboard">Global Leaderboard</Link>
                        </nav>
                    </div>
                </div>

                <div className="footer-bottom-bar">
                    <div className="footer-copyright">
                        © {new Date().getFullYear()} ChessPulse Studio. Powered by Stockfish 17 WASM & Lichess Open Broadcasts.
                    </div>
                    <div className="footer-pieces-signature" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.1em', color: 'rgba(226, 232, 240, 0.4)' }}>
                        <span>SF17 NNUE · WASM · 60FPS</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
