import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, Terminal, Code2, ArrowRight } from "lucide-react";
import "./recruitercta.css";

export default function RecruiterCTA({ onOpenSandbox }) {
  return (
    <section className="recruiter-cta-section">
      <div className="recruiter-cta-container">
        <div className="recruiter-cta-card">
          <div className="recruiter-cta-glow" />

          <div className="recruiter-cta-left">
            <div className="recruiter-cta-badge">
              <Sparkles size={14} className="badge-sparkle" />
              <span>RECRUITER & ARCHITECTURE FAST-TRACK</span>
            </div>

            <h2 className="recruiter-cta-title">
              Engineered for Extreme Performance. <br />
              <span className="recruiter-cta-gradient">Verified for Production.</span>
            </h2>

            <p className="recruiter-cta-desc">
              Experience the compiled WebAssembly Stockfish 17 engine, live WebSocket FIDE & Lichess pipelines,
              and interactive telemetry workstations in a zero-friction, one-click sandbox environment.
            </p>

            <div className="recruiter-cta-actions">
              {onOpenSandbox && (
                <button
                  type="button"
                  onClick={onOpenSandbox}
                  className="recruiter-btn-primary"
                >
                  <Sparkles size={16} />
                  <span>Launch 1-Click Sandbox</span>
                </button>
              )}

              <Link to="/analysis" className="recruiter-btn-secondary">
                <span>Open Workstation</span>
                <ArrowRight size={15} />
              </Link>

              <a
                href="https://github.com/aavishkark/ChessPulse"
                target="_blank"
                rel="noreferrer"
                className="recruiter-btn-ghost"
              >
                <Code2 size={16} />
                <span>GitHub Source</span>
              </a>
            </div>
          </div>

          <div className="recruiter-cta-right">
            <div className="recruiter-spec-card">
              <div className="spec-header">
                <Terminal size={14} className="spec-icon" />
                <span>TECHNICAL SPEC SHEET</span>
              </div>
              <div className="spec-rows">
                <div className="spec-row">
                  <span className="spec-label">Engine:</span>
                  <span className="spec-val">Stockfish 17 WASM + NNUE</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Compute Target:</span>
                  <span className="spec-val">Multi-threaded Web Worker</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Streaming:</span>
                  <span className="spec-val">Lichess NDJSON Streams</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">State & UI:</span>
                  <span className="spec-val">React 19, Tailwind v4, Chakra v3</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Evaluation Latency:</span>
                  <span className="spec-val">&lt; 14ms In-Browser</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
