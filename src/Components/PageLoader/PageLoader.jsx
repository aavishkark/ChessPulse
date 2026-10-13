import React, { useState, useEffect } from "react";
import "./pageloader.css";

const LOGS = [
  "INITIALIZING CLIENT WASM THREADS...",
  "COMPILING STOCKFISH 17 NNUE ENGINE...",
  "SYNCING LIVE FIDE & LICHESS TV TELEMETRY...",
  "CHESSPULSE READY // DEPTH 22 ALLOCATED",
];

export default function PageLoader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [logIndex, setLogIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem("chesspulse_loader_seen") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isDismissed) {
      if (onComplete) onComplete();
      return;
    }

    // Lock scroll during intro
    document.body.style.overflow = "hidden";

    const startTime = performance.now();
    const duration = 1600; // 1.6s

    let animationFrameId;

    const tick = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - t, 3);
      const currentVal = Math.round(eased * 100);
      setProgress(currentVal);

      if (currentVal < 28) setLogIndex(0);
      else if (currentVal < 62) setLogIndex(1);
      else if (currentVal < 92) setLogIndex(2);
      else setLogIndex(3);

      if (t < 1) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        // Complete
        setTimeout(() => {
          setIsExiting(true);
          try {
            sessionStorage.setItem("chesspulse_loader_seen", "true");
          } catch {}
          setTimeout(() => {
            document.body.style.overflow = "";
            setIsDismissed(true);
            if (onComplete) onComplete();
          }, 850);
        }, 180);
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleSkip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isDismissed]);

  const handleSkip = () => {
    setIsExiting(true);
    try {
      sessionStorage.setItem("chesspulse_loader_seen", "true");
    } catch {}
    setTimeout(() => {
      document.body.style.overflow = "";
      setIsDismissed(true);
      if (onComplete) onComplete();
    }, 400);
  };

  if (isDismissed) return null;

  const formattedNum = String(progress).padStart(3, "0");

  return (
    <div
      className={`page-loader-root ${isExiting ? "loader-exit" : ""}`}
      aria-hidden={isDismissed}
    >
      <div className="loader-noise" />

      <header className="loader-top-bar">
        <div className="loader-brand">
          <span className="loader-brand-dot" />
          <span className="loader-brand-name">CHESSPULSE</span>
          <span className="loader-brand-tag">WASM TELEMETRY</span>
        </div>
        <button
          type="button"
          onClick={handleSkip}
          className="loader-skip-btn"
          aria-label="Skip loader"
        >
          Skip <span>[ESC]</span>
        </button>
      </header>

      <div className="loader-center">
        <div className="loader-number-wrapper">
          <span className="loader-number">{formattedNum}</span>
          <span className="loader-percent">%</span>
        </div>

        <div className="loader-progress-track">
          <div
            className="loader-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="loader-log-row">
          <span className="loader-terminal-prompt">&gt;</span>
          <span className="loader-log-text">{LOGS[logIndex]}</span>
        </div>
      </div>

      <footer className="loader-footer">
        <div className="loader-spec-item">
          <span className="loader-spec-k">ENGINE:</span>
          <span className="loader-spec-v">STOCKFISH 17 NNUE</span>
        </div>
        <div className="loader-spec-item">
          <span className="loader-spec-k">RUNTIME:</span>
          <span className="loader-spec-v">WEBASEMBLY CLIENT</span>
        </div>
        <div className="loader-spec-item">
          <span className="loader-spec-k">LATENCY:</span>
          <span className="loader-spec-v">&lt; 15MS LOCAL</span>
        </div>
      </footer>
    </div>
  );
}
