import { useState } from "react";
import { Box, Button, Heading, Input, Stack, Text } from "@chakra-ui/react";
import Navbar from "./Components/Navbar/Navbar";
import axios from "axios";
import { Chess } from "chess.js";
import './index.css';
import Home from "./Pages/Home/Home";

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
      <Home />
      {/* <Box maxW="600px" mx="auto" mt={10} p={6} borderWidth={1} borderRadius="lg">
      <Heading size="md" mb={4}>PGN → Evaluation Bar</Heading>
      <Stack>
        <Input placeholder="Paste PGN here" value={pgn} onChange={(e) => setPgn(e.target.value)} />
        <Button onClick={handleEvaluate}>Evaluate</Button>
        {evaluation !== null && (
          <>
            <Text fontWeight="bold">Eval: {evaluation}</Text>
            <Box h="40px" borderRadius="full" bg="gray.700" overflow="hidden" position="relative">
              <Box h="100%" bg="white" width={width} transition="width 0.4s" />
              <Box position="absolute" inset="0" display="flex" alignItems="center" justifyContent="center" fontWeight="bold">
                {evaluation.toFixed(1)}
              </Box>
            </Box>
          </>
        )}
      </Stack>
      </Box> */}
    </>
  );
}