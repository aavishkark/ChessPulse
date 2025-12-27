import { Chess } from 'chess.js';

export const parsePlayerNames = (pgn) => {
    const whiteMatch = pgn.match(/\[White "(.+?)"\]/);
    const blackMatch = pgn.match(/\[Black "(.+?)"\]/);

    return {
        white: whiteMatch ? whiteMatch[1] : 'Unknown',
        black: blackMatch ? blackMatch[1] : 'Unknown'
    };
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
