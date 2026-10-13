import React, { useEffect, useRef } from "react";
import "./notationsparks.css";

const GLYPHS = [
  "e4", "Nf3", "c5", "+1.85", "O-O", "d4", "Qh5#", "Nxd5", "Kxg7", "99.8%",
  "Bb5", "exd5", "+M3", "Bxf7+", "Rxe8#", "0-1", "1-0", "15ms", "NNUE"
];

export default function NotationSparks() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let intervalId = setInterval(() => {
      if (!container) return;

      const spark = document.createElement("div");
      spark.className = "notation-spark-item";

      const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      spark.textContent = glyph;

      const leftPct = Math.random() * 96 + 2;
      const size = Math.random() * 8 + 11; // 11px to 19px
      const duration = Math.random() * 5 + 5; // 5s to 10s
      const drift = (Math.random() - 0.5) * 60; // -30px to 30px
      const opacity = Math.random() * 0.35 + 0.15;

      spark.style.left = `${leftPct}%`;
      spark.style.fontSize = `${size}px`;
      spark.style.setProperty("--drift-x", `${drift}px`);
      spark.style.animationDuration = `${duration}s`;
      spark.style.opacity = `${opacity}`;

      container.appendChild(spark);

      setTimeout(() => {
        if (spark.parentElement) {
          spark.remove();
        }
      }, duration * 1000);
    }, 450);

    return () => clearInterval(intervalId);
  }, []);

  return <div id="notation-sparks-container" ref={containerRef} aria-hidden="true" />;
}
