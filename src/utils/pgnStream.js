export const fetchRoundGames = async (roundId, onGamesUpdate) => {
    const url = `https://lichess.org/api/stream/broadcast/round/${roundId}.pgn`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const processStream = async () => {
            try {
                const { done, value } = await reader.read();

                if (done) {
                    if (buffer.trim()) {
                        onGamesUpdate(buffer);
                    }
                    return;
                }

                buffer += decoder.decode(value, { stream: true });
                onGamesUpdate(buffer);

                setTimeout(processStream, 100);
            } catch (error) {
                console.error('Stream processing error:', error);
            }
        };

        processStream();

        return () => {
            reader.cancel();
        };
    } catch (error) {
        console.error('Error fetching round games:', error);
        throw error;
    }
};

export const splitGames = (pgnBuffer) => {
    return pgnBuffer
        .split('\n\n\n')
        .filter(game => game.trim().length > 0);
};

export const getGameByIndex = (pgnBuffer, gameIndex) => {
    const games = splitGames(pgnBuffer);
    return games[gameIndex] || null;
};
