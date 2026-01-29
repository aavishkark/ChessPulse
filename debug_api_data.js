import axios from 'axios';

async function fetchData() {
    try {
        console.log("--- Lichess Data (hikaru) ---");
        const lichess = await axios.get('https://lichess.org/api/user/hikaru');
        console.log(JSON.stringify(lichess.data, null, 2));

        console.log("\n--- Chess.com Profile (hikaru) ---");
        const chesscomProfile = await axios.get('https://api.chess.com/pub/player/hikaru');
        console.log(JSON.stringify(chesscomProfile.data, null, 2));

        console.log("\n--- Chess.com Stats (hikaru) ---");
        const chesscomStats = await axios.get('https://api.chess.com/pub/player/hikaru/stats');
        console.log(JSON.stringify(chesscomStats.data, null, 2));

    } catch (error) {
        console.error("Error fetching data:", error.message);
    }
}

fetchData();
