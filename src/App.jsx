import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Box, Button, Heading, Input, Stack, Text } from "@chakra-ui/react";
import Navbar from "./Components/Navbar/Navbar";
import ProtectedRoute from "./Components/ProtectedRoute/ProtectedRoute";
import { Footer } from "./Components/Footer/Footer";
import axios from "axios";
import { Chess } from "chess.js";
import './index.css';
import Home from "./Pages/Home/Home";
import TournamentsPage from "./Pages/TournamentsPage/TournamentsPage";
import GameViewPage from "./Pages/GameViewPage/GameViewPage";
import SignInPage from "./Pages/SignInPage/SignInPage";
import SignUpPage from "./Pages/SignUpPage/SignUpPage";
import OAuthCallbackPage from "./Pages/OAuthCallbackPage/OAuthCallbackPage";
import ProfilePage from "./Pages/ProfilePage/ProfilePage";
import PuzzlesPage from "./Pages/PuzzlesPage";
import PuzzleRushPage from "./Pages/PuzzleRushPage";
import PuzzleSurvivalPage from "./Pages/PuzzleSurvivalPage";
import PuzzleRatedPage from "./Pages/PuzzleRatedPage";
import PuzzleThemedPage from "./Pages/PuzzleThemedPage";
import PuzzleStatsPage from "./Pages/PuzzleStatsPage";
import LeaderboardPage from "./Pages/LeaderboardPage";
import PuzzleCuratedPage from "./Pages/PuzzleCuratedPage";
import BotsPage from "./Pages/BotsPage";
import BotGamePage from "./Pages/BotGamePage";
import GameAnalysisPage from "./Pages/GameAnalysisPage";
import OnlineGamePage from "./Pages/OnlineGamePage";
import CustomizePage from "./Pages/CustomizePage";
import { BoardCustomizationProvider } from "./contexts/BoardCustomizationContext";

const API = "https://chesspulse-backend.onrender.com/evaluate?fen=";

export default function App() {
  const [pgn, setPgn] = useState("");
  const [evaluation, setEvaluation] = useState(null);

  const handleEvaluate = async () => {
    if (!pgn.trim()) return;
    const chess = new Chess();
    chess.loadPgn(pgn);
    const fen = chess.fen();

    const res = await axios.get(`${API}${encodeURIComponent(fen)}`);
    setEvaluation(res.data.evaluation);
  };

  const width = evaluation === null ? "50%" : `${50 + Math.max(-5, Math.min(5, evaluation)) * 10}%`;

  return (
    <BoardCustomizationProvider>
      <div className="app-container">
        <Navbar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tournaments" element={<TournamentsPage />} />
            <Route path="/game/:roundId/:gameIndex" element={<GameViewPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/puzzles" element={<PuzzlesPage />} />
            <Route path="/puzzles/rush" element={<PuzzleRushPage />} />
            <Route path="/puzzles/survival" element={<PuzzleSurvivalPage />} />
            <Route path="/puzzles/rating" element={<PuzzleRatedPage />} />
            <Route path="/puzzles/themed" element={<PuzzleThemedPage />} />
            <Route path="/puzzles/stats" element={<PuzzleStatsPage />} />
            <Route path="/puzzles/leaderboard" element={<LeaderboardPage />} />
            <Route
              path="/puzzles/curated"
              element={
                <ProtectedRoute>
                  <PuzzleCuratedPage />
                </ProtectedRoute>
              }
            />
            <Route path="/bots" element={<BotsPage />} />
            <Route path="/bots/play/:botId" element={<BotGamePage />} />
            <Route path="/analysis" element={<GameAnalysisPage />} />
            <Route path="/play/online" element={<OnlineGamePage />} />
            <Route path="/customize" element={<CustomizePage />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BoardCustomizationProvider>
  );
}