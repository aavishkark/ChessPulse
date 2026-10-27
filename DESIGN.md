# ChessPulse — Design Direction & System Specifications

> Dial: ENERGY 2 / RHYTHM 2 / MOTION 2

## 1. Product Identity & Character
ChessPulse is a high-performance in-browser chess intelligence platform. It couples Stockfish 17 NNUE WebAssembly with telemetry workstations, interactive tactical training, and real-time FIDE tournament broadcasts.

## 2. Color Palette Discipline (R-29)
- **Primary Surfaces**: Obsidian Slate (`#0B0F19`), Panel Charcoal (`#111827`), Card Slate (`#1E293B`)
- **Core Accent**: Electric Violet (`#8B5CF6`) & Deep Indigo (`#6366F1`)
- **Semantic Accents**:
  - Emerald (`#10B981`): Advantage / correct puzzle move / engine online
  - Rose (`#EF4444`): Blunder / puzzle strike / checkmate threat
  - Gold (`#F59E0B`): Time warning / grandmaster milestone

## 3. Typography (R-06)
- **Primary UI**: `Inter` (sans-serif) for interface elements, headers, and clean readability.
- **Telemetry & Engine Data**: `JetBrains Mono` for FEN, PGN notations, centipawn evaluations, and chess clocks.

## 4. Visual Hierarchy & Elevation (R-12, R-31)
- Layered slate elevations (`--bg` -> `--bg-soft` -> `--bg2`) with hairline borders (`rgba(255, 255, 255, 0.08)` in dark mode, `rgba(15, 23, 42, 0.1)` in light mode).
- Glassmorphism is restrained to floating navigation and primary analysis HUDs only, adhering to the dose cap.
