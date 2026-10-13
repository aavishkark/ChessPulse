import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Cpu, Radio, Zap, ArrowRight } from "lucide-react";

const SLIDES = [
  {
    id: "engine",
    arenaMap: "classic",
    title: "Stockfish 17 WASM",
    subtitle: "Client-side Depth-22 Engine",
    badge: "ENGINE ACTIVE",
    badgeColor: "emerald",
    icon: Cpu,
    statMain: "+1.35",
    statLabel: "White Centipawn Advantage",
    metrics: [
      { k: "DEPTH", v: "22/22" },
      { k: "NNUE", v: "ACTIVE" },
      { k: "SPEED", v: "18.4M n/s" },
      { k: "LATENCY", v: "< 14ms" },
    ],
    pvLine: "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O",
    ctaText: "Launch Workstation",
    ctaLink: "/analysis",
  },
  {
    id: "broadcast",
    arenaMap: "blitz",
    title: "Grandmaster TV",
    subtitle: "Realtime WebSocket Streams",
    badge: "● LIVE BROADCAST",
    badgeColor: "cyan",
    icon: Radio,
    statMain: "CARLSEN vs NAKAMURA",
    statLabel: "Speed Chess Championship 2026",
    metrics: [
      { k: "WHITE", v: "2832 ELO" },
      { k: "BLACK", v: "2875 ELO" },
      { k: "CLOCK", v: "03:42 // 04:18" },
      { k: "STREAM", v: "SUB-SECOND" },
    ],
    pvLine: "38... Rxd7! 39. Qxd7 Qxe4+ 40. Kh2 Qe5+ (Winning)",
    ctaText: "Spectate Tournaments",
    ctaLink: "/tournaments",
  },
  {
    id: "tactics",
    arenaMap: "gold",
    title: "Tactical Arena",
    subtitle: "Adaptive Grandmaster Puzzles",
    badge: "2,500+ PUZZLES",
    badgeColor: "violet",
    icon: Zap,
    statMain: "RATING: 2450",
    statLabel: "Target: Discovered Deflection",
    metrics: [
      { k: "DIFFICULTY", v: "MASTER" },
      { k: "ACCURACY", v: "99.2%" },
      { k: "STREAK", v: "16 CLEAN" },
      { k: "THEME", v: "MATE IN 3" },
    ],
    pvLine: "1. Rxg7+! Kxg7 2. Qh6+ Kg8 3. Qf8# (Discovered Mate)",
    ctaText: "Train Tactics",
    ctaLink: "/puzzles",
  },
];

export default function HeroShowcaseCard({ activeArena }) {
  const [activeIdx, setActiveIdx] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  // Sync with ArenaSwitcher selection
  useEffect(() => {
    if (!activeArena) return;
    const foundIdx = SLIDES.findIndex((s) => s.arenaMap === activeArena);
    if (foundIdx !== -1) {
      setActiveIdx(foundIdx);
    }
  }, [activeArena]);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % SLIDES.length);
    }, 5200);

    return () => clearInterval(timer);
  }, [isPaused]);

  const slide = SLIDES[activeIdx];
  const Icon = slide.icon;

  return (
    <div
      className="hero-showcase-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="hero-showcase-card">
        {/* Top Header Pill Tabs */}
        <div className="showcase-nav-row">
          <div className="showcase-tabs">
            {SLIDES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                className={`showcase-tab-btn ${idx === activeIdx ? "active" : ""}`}
                onClick={() => setActiveIdx(idx)}
              >
                {idx === 0 && <Cpu size={12} />}
                {idx === 1 && <Radio size={12} />}
                {idx === 2 && <Zap size={12} />}
                <span>{s.title.split(" ")[0]}</span>
              </button>
            ))}
          </div>

          <div className="showcase-live-pill">
            <span className="showcase-pulse-dot" />
            <span>60 FPS</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="showcase-content">
          <div className="showcase-hero-stat">
            <div className="showcase-icon-badge">
              <Icon size={18} />
            </div>
            <div className="showcase-stat-text">
              <div className="showcase-stat-val">{slide.statMain}</div>
              <div className="showcase-stat-sub">{slide.statLabel}</div>
            </div>
          </div>

          {/* 4-KPI Grid */}
          <div className="showcase-kpi-grid">
            {slide.metrics.map((m, i) => (
              <div key={i} className="showcase-kpi-box">
                <span className="kpi-k">{m.k}</span>
                <span className="kpi-v">{m.v}</span>
              </div>
            ))}
          </div>

          {/* Best Line Telemetry snippet */}
          <div className="showcase-pv-box">
            <span className="pv-tag">TELEMETRY LINE</span>
            <code className="pv-code">{slide.pvLine}</code>
          </div>

          {/* CTA Footer */}
          <div className="showcase-footer">
            <Link to={slide.ctaLink} className="showcase-cta-link">
              <span>{slide.ctaText}</span>
              <ArrowRight size={14} />
            </Link>
            <div className="showcase-step-indicator">
              {SLIDES.map((_, i) => (
                <span
                  key={i}
                  className={`step-dot ${i === activeIdx ? "active" : ""}`}
                  onClick={() => setActiveIdx(i)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Auto-cycle progress bar */}
        <div className="showcase-progress-line">
          <div
            key={activeIdx}
            className={`showcase-progress-fill ${isPaused ? "paused" : ""}`}
          />
        </div>
      </div>
    </div>
  );
}
