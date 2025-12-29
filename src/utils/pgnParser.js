import { Chess } from 'chess.js';

export const parsePlayerNames = (pgn) => {
    const whiteMatch = pgn.match(/\[White "(.+?)"\]/);
    const blackMatch = pgn.match(/\[Black "(.+?)"\]/);

    return {
        white: whiteMatch ? whiteMatch[1] : 'Unknown',
        black: blackMatch ? blackMatch[1] : 'Unknown'
    };
};

export const parsePlayerRatings = (pgn) => {
    const whiteEloMatch = pgn.match(/\[WhiteElo "(.+?)"\]/);
    const blackEloMatch = pgn.match(/\[BlackElo "(.+?)"\]/);

    return {
        white: whiteEloMatch ? whiteEloMatch[1] : '-',
        black: blackEloMatch ? blackEloMatch[1] : '-'
    };
};

export const parseClockInfo = (pgn) => {
    try {
        const moveText = pgn
            .split('\n')
            .filter(line => !line.startsWith('['))
            .join(' ')
            .trim();

        const clockPattern = /\{\s*\[%clk\s+(\d+):(\d+):(\d+)\]\s*\}/g;
        const matches = [...moveText.matchAll(clockPattern)];

        if (matches.length === 0) {
            console.log('GameView: No clock data found in PGN');
            return { white: 0, black: 0 };
        }

        let whiteClock = 0;
        let blackClock = 0;

        if (matches.length >= 2) {
            const lastTwoClocks = matches.slice(-2);

            const whiteMatch = lastTwoClocks[0];
            whiteClock = parseInt(whiteMatch[1]) * 3600 + parseInt(whiteMatch[2]) * 60 + parseInt(whiteMatch[3]);

            const blackMatch = lastTwoClocks[1];
            blackClock = parseInt(blackMatch[1]) * 3600 + parseInt(blackMatch[2]) * 60 + parseInt(blackMatch[3]);
        } else if (matches.length === 1) {
            const match = matches[0];
            whiteClock = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]);
        }

        console.log('GameView: Parsed clocks -', { white: whiteClock, black: blackClock, totalMatches: matches.length });
        return { white: whiteClock, black: blackClock };
    } catch (error) {
        console.error('Error parsing clock info:', error);
        return { white: 0, black: 0 };
    }
};

export const getCurrentFEN = (pgn) => {
    try {
        const chess = new Chess();
        const cleanPgn = pgn
            .split('\n')
            .filter(line => !line.startsWith('['))
            .join(' ')
            .replace(/ \{.*?\}/g, '')
            .trim();

        chess.loadPgn(cleanPgn);
        return chess.fen();
    } catch (error) {
        console.error('Error parsing PGN:', error);
        return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    }
};

export const getMoveList = (pgn) => {
    try {
        const chess = new Chess();
        const cleanPgn = pgn
            .split('\n')
            .filter(line => !line.startsWith('['))
            .join(' ')
            .replace(/ \{.*?\}/g, '')
            .trim();

        chess.loadPgn(cleanPgn);
        return chess.history();
    } catch (error) {
        console.error('Error getting move list:', error);
        return [];
    }
};

export const getGameResult = (pgn) => {
    const resultMatch = pgn.match(/\[Result "(.+?)"\]/);
    if (resultMatch) {
        const result = resultMatch[1];
        if (result === '1-0') return 'White wins';
        if (result === '0-1') return 'Black wins';
        if (result === '1/2-1/2') return 'Draw';
    }
    return null;
};

export const getMoveNumber = (pgn) => {
    const moves = getMoveList(pgn);
    return Math.ceil(moves.length / 2);
};
