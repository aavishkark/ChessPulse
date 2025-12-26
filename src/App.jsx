import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Box, Button, Heading, Input, Stack, Text } from "@chakra-ui/react";
import Navbar from "./Components/Navbar/Navbar";
import { Footer } from "./Components/Footer/Footer";
import axios from "axios";
import { Chess } from "chess.js";
import './index.css';
import Home from "./Pages/Home/Home";
import TournamentsPage from "./Pages/TournamentsPage/TournamentsPage";

const API = "https://chesspulse-backend.onrender.com/evaluate?fen=";

export default function App() {
  const [pgn, setPgn] = useState("");
  const [evaluation, setEvaluation] = useState(null);

  const handleEvaluate = async () => {
    if (!pgn.trim()) return;
    const chess = new Chess();
    chess.loadPgn(pgn);
    const fen = chess.fen();
    console.log(fen);
    const res = await axios.get(`${API}${encodeURIComponent(fen)}`);
    setEvaluation(res.data.evaluation);
  };

  const width = evaluation === null ? "50%" : `${50 + Math.max(-5, Math.min(5, evaluation)) * 10}%`;

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tournaments" element={<TournamentsPage />} />
      </Routes>
      <Footer />
    </>
  );
}