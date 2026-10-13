import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Cpu, Radio, Trophy, Swords, ArrowUpRight, ArrowRight } from "lucide-react";
import "./featureband.css";

const CAPABILITY_ROWS = [
  {
    num: "01",
    tag: "ENGINE CORE",
    title: "Stockfish 17 NNUE Workstation",
    desc: "Multi-threaded WebAssembly evaluation running directly in browser worker threads with centipawn accuracy and variation trees.",
    specs: ["Depth 22 Horizon", "WASM SIMD", "Zero Server Latency"],
    metric: "1.45M+",
    metricLabel: "Positions Evaluated",
    icon: Cpu,
    accent: "#a855f7",
    link: "/analysis",
  },
  {
    num: "02",
    tag: "BROADCAST TV",
    title: "Live FIDE & Grandmaster Streams",
    desc: "Sub-second NDJSON & PGN telemetry pipelines streaming official FIDE World Championship boards and high-Elo arena battles.",
    specs: ["NDJSON WebSockets", "Live Clocks", "Multi-Board Grid"],
    metric: "< 14ms",
    metricLabel: "Stream Sync Delta",
    icon: Radio,
    accent: "#06b6d4",
    link: "/tournaments",
  },
  {
    num: "03",
    tag: "TACTICAL LAB",
    title: "Adaptive Grandmaster Puzzle Arena",
    desc: "Rated ELO progression, high-velocity Puzzle Rush, 3-Life Survival, and 11 tactical motif laboratories calibrated to your weaknesses.",
    specs: ["2,500+ GM Motifs", "Pulse AI Curated", "ELO Skill Track"],
    metric: "99.4%",
    metricLabel: "Line Verification",
    icon: Trophy,
    accent: "#10b981",
    link: "/puzzles",
  },
  {
    num: "04",
    tag: "AI SPARRING",
    title: "Calibrated Neural Personalities",
    desc: "Spar against distinct Stockfish-backed challengers ranging from club tacticians to relentless 2800+ ELO Grandmaster engines.",
    specs: ["Adaptive ELO Tiers", "3D Board Studio", "Instant Post-Mortem"],
    metric: "60 FPS",
    metricLabel: "Interactive Studio",
    icon: Swords,
    accent: "#f59e0b",
    link: "/bots",
  },
];

export default function FeatureBand() {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  return (
    <section className="cp-studio-section feature-band-section">
      <div className="cp-studio-container">
        {/* Lumora-Inspired 4-Pill Interlocking Architectural Statement Band */}
        <div className="lumora-pill-band" aria-label="We Engineer Grandmaster Telemetry">
          <div className="lumora-pill pill-surface">
            <span className="lumora-pill-kicker">00 // STUDIO</span>
            <span className="lumora-pill-word">We Engineer</span>
          </div>
          <div className="lumora-pill pill-accent">
            <ArrowRight size={34} strokeWidth={2.2} className="lumora-pill-arrow-svg" />
          </div>
          <div className="lumora-pill pill-ink">
            <span className="lumora-pill-word">Grandmaster</span>
          </div>
          <div className="lumora-pill pill-outline">
            <span className="lumora-pill-word">Telemetry.</span>
            <span className="lumora-pill-dot" />
          </div>
        </div>

        {/* Editorial Chapter Header */}
        <div className="cp-chapter-header">
          <div className="cp-chapter-meta">
            <span className="cp-chapter-index">
              <span className="cp-chapter-index-dot" />
              00 // ARCHITECTURE
            </span>
            <span className="cp-chapter-subtag">FOUR CORE WORKSTATIONS</span>
          </div>
          <div className="cp-chapter-main">
            <h2 className="cp-chapter-title">
              Built Like a High-Frequency{" "}
              <span className="cp-chapter-title-accent">Chess Trading Desk</span>
            </h2>
            <p className="cp-chapter-desc">
              Every module is engineered around compiled client-side WebAssembly, real-time tournament streams, and tactile studio controls.
            </p>
          </div>
          <div className="cp-chapter-actions">
            <Link to="/customize" className="fb-studio-pill-link">
              <span>Configure 3D Board Studio</span>
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>

        {/* Lumora-Style Numbered Hover-Sweep Rows (01 — 04) */}
        <div className="capability-rows-list">
          {CAPABILITY_ROWS.map((row, idx) => {
            const Icon = row.icon;
            const isHovered = hoveredIdx === idx;

            return (
              <Link
                to={row.link}
                key={row.num}
                className={`capability-row ${isHovered ? "is-hovered" : ""}`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  "--row-accent": row.accent,
                }}
              >
                {/* Hover Sweep Fill Background */}
                <div className="capability-row-sweep" aria-hidden="true" />

                {/* Column 1: Index + Tag + Icon */}
                <div className="cap-col-index">
                  <span className="cap-num">{row.num}</span>
                  <div className="cap-icon-box">
                    <Icon size={20} strokeWidth={1.9} />
                  </div>
                  <span className="cap-tag">{row.tag}</span>
                </div>

                {/* Column 2: Title + Editorial Description */}
                <div className="cap-col-main">
                  <h3 className="cap-title">{row.title}</h3>
                  <p className="cap-desc">{row.desc}</p>
                </div>

                {/* Column 3: Technical Spec Pills */}
                <div className="cap-col-specs">
                  {row.specs.map((spec) => (
                    <span key={spec} className="cap-spec-chip">
                      {spec}
                    </span>
                  ))}
                </div>

                {/* Column 4: Live Telemetry Metric + Magnetic Arrow */}
                <div className="cap-col-telemetry">
                  <div className="cap-metric-block">
                    <span className="cap-metric-val">{row.metric}</span>
                    <span className="cap-metric-lbl">{row.metricLabel}</span>
                  </div>
                  <div className="cap-arrow-circle">
                    <ArrowUpRight size={18} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
