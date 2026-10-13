import React, { useState, useEffect, useRef } from "react";
import "./metricsstrip.css";

const METRICS = [
  {
    code: "SYS-01",
    target: 1450000,
    prefix: "",
    suffix: "+",
    label: "Positions Evaluated",
    detail: "In-browser NNUE neural evaluations",
    barFill: 94,
    accent: "#a855f7",
    format: (n) => (n / 1000000).toFixed(2) + "M",
  },
  {
    code: "SYS-02",
    target: 22,
    prefix: "PLY ",
    suffix: "",
    label: "Stockfish WASM Depth",
    detail: "Multi-threaded search horizon",
    barFill: 88,
    accent: "#06b6d4",
    format: (n) => String(Math.floor(n)),
  },
  {
    code: "SYS-03",
    target: 14,
    prefix: "< ",
    suffix: "ms",
    label: "Compute Latency",
    detail: "Zero server round-trip overhead",
    barFill: 96,
    accent: "#10b981",
    format: (n) => String(Math.floor(n)),
  },
  {
    code: "SYS-04",
    target: 2500,
    prefix: "",
    suffix: "+",
    label: "Grandmaster Tactics",
    detail: "Verified tactical puzzle corpus",
    barFill: 90,
    accent: "#f59e0b",
    format: (n) => (n / 1000).toFixed(1) + "k",
  },
  {
    code: "SYS-05",
    target: 100,
    prefix: "",
    suffix: "%",
    label: "Client-Side Privacy",
    detail: "100% local WASM binary execution",
    barFill: 100,
    accent: "#38bdf8",
    format: (n) => String(Math.floor(n)),
  },
];

export default function MetricsStrip() {
  const [animated, setAnimated] = useState(false);
  const [values, setValues] = useState(METRICS.map(() => 0));
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !animated) {
          setAnimated(true);

          const startTime = performance.now();
          const duration = 1800;

          const updateCounter = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

            setValues(METRICS.map((m) => m.target * eased));

            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            }
          };

          requestAnimationFrame(updateCounter);
        }
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [animated]);

  return (
    <section className="metrics-strip-section" ref={containerRef}>
      <div className="metrics-strip-container">
        <div className="metrics-monolith">
          <div className="metrics-monolith-topbar">
            <div className="metrics-topbar-left">
              <span className="metrics-live-dot" />
              <span>REALTIME TELEMETRY BENCHMARKS · STOCKFISH 17 WASM CLUSTER</span>
            </div>
            <div className="metrics-topbar-right">
              <span>SIMD128 ENABLED</span>
              <span className="metrics-sep">·</span>
              <span>60 FPS RENDERING</span>
            </div>
          </div>

          <div className="metrics-grid">
            {METRICS.map((m, i) => (
              <div key={m.code} className="metric-box" style={{ "--m-accent": m.accent }}>
                <div className="metric-cell-top">
                  <span className="metric-code">{m.code}</span>
                  <span className="metric-status-tag">VERIFIED</span>
                </div>

                <div className="metric-number-row">
                  <span className="metric-prefix">{m.prefix}</span>
                  <span className="metric-number">{m.format(values[i])}</span>
                  <span className="metric-suffix">{m.suffix}</span>
                </div>

                <div className="metric-label">{m.label}</div>
                <div className="metric-detail">{m.detail}</div>

                <div className="metric-bar-track" aria-hidden="true">
                  <div
                    className="metric-bar-fill"
                    style={{
                      width: animated ? `${m.barFill}%` : "0%",
                      background: m.accent,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
