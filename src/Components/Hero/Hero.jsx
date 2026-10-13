import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import ChessCanvas from "./ChessCanvas";
import ChessForceField from "./ChessForceField";
import NotationSparks from "./NotationSparks";
import GrandmasterCenterpiece from "./GrandmasterCenterpiece";
import ArenaSwitcher from "./ArenaSwitcher";
import HeroShowcaseCard from "./HeroShowcaseCard";
import { Sparkles, ChevronRight } from "lucide-react";
import "./hero.css";

const ARENA_THEMES = {
  classic: {
    inner: "#064e3b",
    mid: "#022c22",
    outer: "#070b12",
    accent: "#10b981",
  },
  blitz: {
    inner: "#3b0764",
    mid: "#17143a",
    outer: "#07090f",
    accent: "#a855f7",
  },
  gold: {
    inner: "#78350f",
    mid: "#3b1504",
    outer: "#090807",
    accent: "#f59e0b",
  },
};

const Hero = ({ onOpenSandbox }) => {
  const [currentArena, setCurrentArena] = useState(
    () => document.body.dataset.arena || "blitz"
  );
  const forceFieldRef = useRef(null);
  const centerpieceRef = useRef(null);

  useEffect(() => {
    document.body.dataset.arena = currentArena;
  }, [currentArena]);

  const handleSelectArena = (arenaId) => {
    if (arenaId === currentArena) return;
    document.body.dataset.arena = arenaId;

    const theme = ARENA_THEMES[arenaId];
    const heroEl = document.querySelector(".hero-root");

    // 1. Smoothly morph background radial gradient via GSAP
    if (heroEl && theme) {
      gsap.to(heroEl, {
        "--hero-bg-inner": theme.inner,
        "--hero-bg-mid": theme.mid,
        "--hero-bg-outer": theme.outer,
        duration: 1.4,
        ease: "power2.inOut",
      });
    }

    // 2. Trigger 720-degree spin + motion blur on the 3D Centerpiece
    if (centerpieceRef.current) {
      centerpieceRef.current.triggerSpin(() => {
        setCurrentArena(arenaId);
      });
    }

    // 3. Trigger Implode & Explode on the floating Staunton force-field pieces
    if (forceFieldRef.current) {
      forceFieldRef.current.triggerSwitch(arenaId, () => {
        setCurrentArena(arenaId);
      });
    }
  };

  return (
    <div className={`hero-root arena-theme-${currentArena}`}>
      <section className="hero-section">
        {/* Continuous Rising Tactical Glyphs */}
        <NotationSparks />

        {/* Ambient Interactive Vector Constellation */}
        <ChessCanvas />

        {/* Floating Staunton Chess Pieces with Magnetic Force-Field Repulsion */}
        <ChessForceField ref={forceFieldRef} currentArena={currentArena} />

        {/* Giant Typographic Brand Watermark */}
        <div className="hero-watermark" aria-hidden="true">
          CHESSPULSE
        </div>

        <div className="hero-inner">
          {/* Left Column: Editorial Typography, CTAs & Arena Mode Switcher */}
          <div className="hero-left">
            <div className="hero-pretitle-pill">
              <span className="hero-pill-ping" />
              <span className="hero-pill-text">
                STOCKFISH 17 WASM · REALTIME TELEMETRY · 3,500+ ELO
              </span>
            </div>

            <h1 className="hero-title">
              Master Every Move with{" "}
              <span className="hero-gradientText">Grandmaster Telemetry</span>
            </h1>

            <p className="hero-description">
              In-browser WebAssembly Stockfish 17 evaluation, sub-second live tournament broadcasts,
              and adaptive grandmaster tactical training — engineered with zero server latency and 100% client-side privacy.
            </p>

            <div className="hero-ctaWrapper">
              {onOpenSandbox && (
                <button
                  type="button"
                  onClick={onOpenSandbox}
                  className="hero-cta hero-cta-sandbox"
                >
                  <Sparkles size={16} className="cta-icon-sparkle" />
                  <span>⚡ Recruiter Sandbox</span>
                </button>
              )}

              <div className="hero-cta-primary-wrap">
                <div className="hero-ctaGlow"></div>
                <Link to="/analysis" className="hero-cta hero-cta-primary">
                  <span>Open Analysis Workstation</span>
                  <ChevronRight size={16} />
                </Link>
              </div>

              <Link to="/tournaments" className="hero-cta hero-cta-ghost">
                Explore Tournaments
              </Link>
            </div>

            {/* Choreographed 3-Arena Switcher with Popping Staunton Pieces */}
            <ArenaSwitcher
              currentArena={currentArena}
              onSelectArena={handleSelectArena}
            />

            <div className="hero-telemetry-strip">
              <div className="telemetry-item">
                <span className="telemetry-dot emerald" />
                <span className="telemetry-label">NNUE Evaluator:</span>
                <span className="telemetry-val">Depth 22</span>
              </div>
              <div className="telemetry-divider">/</div>
              <div className="telemetry-item">
                <span className="telemetry-dot cyan" />
                <span className="telemetry-label">Compute Latency:</span>
                <span className="telemetry-val">&lt; 14ms</span>
              </div>
              <div className="telemetry-divider">/</div>
              <div className="telemetry-item">
                <span className="telemetry-dot violet" />
                <span className="telemetry-label">Active Mode:</span>
                <span className="telemetry-val" style={{ textTransform: "capitalize" }}>
                  {currentArena} Arena
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Interactive Stage + Live Telemetry Showcase Card */}
          <div className="hero-right">
            <GrandmasterCenterpiece
              ref={centerpieceRef}
              currentArena={currentArena}
            />

            <HeroShowcaseCard activeArena={currentArena} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Hero;