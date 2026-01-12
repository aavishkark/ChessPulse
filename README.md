# Chesspulse

A modern, feature-rich chess platform built with React, Vite, and Stockfish. Chesspulse offers a comprehensive suite of tools for chess enthusiasts, including diverse puzzle modes, live tournament broadcasting, bot games, and deep game analysis.

---

## Overview

`Chesspulse` is a dynamic single-page application designed to enhance the chess learning and playing experience. Users can:
- **Solve Puzzles**: Engage in various puzzle modes like Rated, Rush, Survival, and Themed puzzles.
- **Watch Live**: Follow real-time tournaments with live game broadcasting and evaluation.
- **Analyze**: Use the integrated Stockfish engine to analyze positions and games.
- **Play Bots**: Challenge AI bots of varying difficulty levels.
- **Play Online**: compete in real-time chess matches against friends or guests with custom time controls.
- **Track Progress**: Monitor stats and rankings through a personalized dashboard and leaderboard.

---

## Feature Highlights
- **Diverse Puzzle Ecosystem** — `src/Pages/Puzzle*` offers Rated, Rush, Survival, and Themed modes, plus a "Daily Puzzle" feature.
- **Live Tournament Broadcasting** — `src/Pages/TournamentsPage` & `src/Pages/GameViewPage` provide real-time updates of ongoing chess tournaments.
- **Powerful Analysis Board** — `src/Pages/GameAnalysisPage` integrates Stockfish (WASM) for simplified and deep position analysis.
- **Bot Matches** — `src/Pages/BotGamePage` allows users to play against configured AI opponents.
- **Online Multiplayer** — `src/Pages/OnlineGamePage` features real-time matchmaking, custom challenges, and live gameplay updates via WebSocket.
- **User Dashboard** — `src/Pages/ProfilePage` displays user statistics, favorite games, and history.
- **Modern UI/UX** — Built with **Chakra UI** and **Framer Motion** for a responsive, accessible, and animated interface.

---

## Tech Stack

**Front-End & Core:**  
<p>
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="react" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="vite" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="javascript" />
  <img src="https://img.shields.io/badge/Chakra%20UI-319795?style=for-the-badge&logo=chakra-ui&logoColor=white" alt="chakra ui" />
  <img src="https://img.shields.io/badge/Framer%20Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" alt="framer motion" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="socket.io" />
</p>

**Chess Logic & Tools:**  
<p>
  <img src="https://img.shields.io/badge/Chess.js-000000?style=for-the-badge&logo=chess.com&logoColor=white" alt="chess.js" />
  <img src="https://img.shields.io/badge/Stockfish-FF9900?style=for-the-badge&logo=lischess&logoColor=white" alt="stockfish" />
  <img src="https://img.shields.io/badge/Recharts-22b5bf?style=for-the-badge&logo=codeigniter&logoColor=white" alt="recharts" />
  <img src="https://img.shields.io/badge/React%20Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white" alt="react router" />
</p>

---

## Project Structure

```
src/
 ├─ Pages/                   # Main application views
 │   ├─ Home/                # Landing page
 │   ├─ PuzzlesPage/         # Puzzle mode selection
 │   ├─ GameViewPage/        # Live game observation
 │   ├─ GameAnalysisPage/    # Stockfish analysis board
 │   ├─ OnlineGamePage/      # Real-time online chess matches
 │   ├─ TournamentsPage/     # Tournament listings
 │   └─ ...                  # Other feature pages
 ├─ Components/              # Reusable UI components
 ├─ services/                # API services and external integrations
 ├─ contexts/                # Global state management
 ├─ hooks/                   # Custom React hooks
 ├─ utils/                   # Helper functions
 └─ assets/                  # Static images and assets
```

---

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:5173` (or the port shown in your terminal) to view the app.

3. **Build for production**
   ```bash
   npm run build
   ```

4. **Preview production build**
   ```bash
   npm run preview
   ```

---

## Available Scripts
- `npm run dev` — Launch the development server.
- `npm run build` — Compile the application for production.
- `npm run lint` — Run ESLint to check for code quality issues.
- `npm run preview` — Preview the built application locally.

---