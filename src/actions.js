        async function fetchGamePGN(gameId) {
            if (!gameId) {
                alert('Please enter a game ID');
                return;
            }
            try {
                const response = await fetch(`https://lichess.org/game/export/${gameId}.pgn?clocks=true&moves=true`);
                if (!response.ok) throw new Error('Game not found');
                const pgn = await response.text();
                console.log(pgn);
            } catch (error) {
                console.log(error.message)
            }
        }

        async function getTournaments(includeFinished = false) {
            
            try {
                const url = includeFinished
                    ? 'https://lichess.org/api/broadcast?nb=10&finished=true'
                    : 'https://lichess.org/api/broadcast?nb=10';
                const response = await fetch(url);
                const text = await response.text();
                
                const tournaments = text
                    .trim()
                    .split('\n')
                    .filter(line => line.trim())
                    .map(line => JSON.parse(line));

                console.log(tournaments);
                
                const filtered = includeFinished
                    ? tournaments.filter(t => t.rounds && t.rounds.length)
                    : tournaments.filter(t => 
                        t.rounds && t.rounds.some(r => r.ongoing === true)
                    );
                
                if (filtered.length === 0) {
                    console.log('No tournaments found');
                    return;
                }
                
                filtered.forEach((tournament, index) => {
                    const round = includeFinished
                        ? tournament.rounds[tournament.rounds.length - 1]
                        : tournament.rounds.find(r => r.ongoing);
                    if (!round) return;
                });
                
            } catch (error) {
                console.log(error.message);
            }
        }

        export default getTournaments;