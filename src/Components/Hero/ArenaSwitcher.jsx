import React from "react";
import { ChevronLeft, ChevronRight, Layers, Cpu, Zap, Shield } from "lucide-react";
import "./arenaswitcher.css";

const ARENAS = [
  {
    id: "classic",
    Icon: Cpu,
    name: "Deep Classical",
    sub: "Depth 22 • Positional",
    accent: "#10b981",
    tag: "NNUE",
  },
  {
    id: "blitz",
    Icon: Zap,
    name: "Cyber Blitz",
    sub: "< 12ms • Live Streams",
    accent: "#a855f7",
    tag: "LIVE",
  },
  {
    id: "gold",
    Icon: Shield,
    name: "Neural Master",
    sub: "3,500+ Elo • Tactics",
    accent: "#f59e0b",
    tag: "GM",
  },
];

export default function ArenaSwitcher({ currentArena, onSelectArena }) {
  const handlePrev = () => {
    const idx = ARENAS.findIndex((a) => a.id === currentArena);
    const prevIdx = (idx - 1 + ARENAS.length) % ARENAS.length;
    onSelectArena(ARENAS[prevIdx].id);
  };

  const handleNext = () => {
    const idx = ARENAS.findIndex((a) => a.id === currentArena);
    const nextIdx = (idx + 1) % ARENAS.length;
    onSelectArena(ARENAS[nextIdx].id);
  };

  return (
    <div className="arena-carousel-root">
      <div className="arena-header-bar">
        <div className="arena-header-title">
          <Layers size={13} className="arena-header-icon" />
          <span>SELECT ARENA TELEMETRY MODE</span>
        </div>

        <div className="arena-nav-buttons">
          <button
            type="button"
            className="arena-arrow-btn"
            onClick={handlePrev}
            aria-label="Previous Arena"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            className="arena-arrow-btn"
            onClick={handleNext}
            aria-label="Next Arena"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="arena-cards-row">
        {ARENAS.map((arena) => {
          const isActive = arena.id === currentArena;
          const ArenaIcon = arena.Icon;

          return (
            <button
              key={arena.id}
              type="button"
              className={`arena-card ${isActive ? "active" : ""}`}
              onClick={() => onSelectArena(arena.id)}
              style={{
                "--card-accent": arena.accent,
              }}
            >
              <div className="arena-card-top">
                <span className="arena-icon-box" style={{ color: arena.accent }}>
                  <ArenaIcon size={16} strokeWidth={2} />
                </span>
                <div className="arena-card-badge">{arena.tag}</div>
              </div>

              <div className="arena-card-info">
                <span className="arena-card-name">{arena.name}</span>
                <span className="arena-card-sub">{arena.sub}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
