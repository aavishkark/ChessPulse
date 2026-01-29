import axios from 'axios';

const CHESSCOM_API = 'https://api.chess.com/pub';

const chesscomAxios = axios.create({
    baseURL: CHESSCOM_API,
    headers: {
        'Accept': 'application/json'
    }
});

export async function getChesscomUser(username) {
    const cleanUsername = username.replace(/^(?:https?:\/\/)?(?:www\.)?chess\.com\/member\/([^/?#]+).*$/, '$1');

    try {
        const response = await chesscomAxios.get(`/player/${cleanUsername.toLowerCase()}`);
        return response.data;
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error('User not found');
        }
        if (error.response?.status === 429) {
            throw new Error('Rate limited. Please try again later.');
        }
        throw new Error('Failed to fetch user data');
    }
}

export async function getChesscomStats(username) {
    const cleanUsername = username.replace(/^(?:https?:\/\/)?(?:www\.)?chess\.com\/member\/([^/?#]+).*$/, '$1');

    try {
        const response = await chesscomAxios.get(`/player/${cleanUsername.toLowerCase()}/stats`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch stats:', error);
        return null;
    }
}

export async function getRecentGames(username, max = 10) {
    const cleanUsername = username.replace(/^(?:https?:\/\/)?(?:www\.)?chess\.com\/member\/([^/?#]+).*$/, '$1').toLowerCase();

    try {
        const archivesRes = await chesscomAxios.get(`/player/${cleanUsername}/games/archives`);
        const archives = archivesRes.data.archives;

        if (!archives || archives.length === 0) return [];

        const lastArchiveUrl = archives[archives.length - 1];

        const gamesRes = await axios.get(lastArchiveUrl);
        const games = gamesRes.data.games;

        return games.reverse().slice(0, max);
    } catch (error) {
        console.error('Failed to fetch recent games:', error);
        return [];
    }
}

export async function getChesscomUserFull(username) {
    const [profile, stats, games] = await Promise.all([
        getChesscomUser(username),
        getChesscomStats(username),
        getRecentGames(username)
    ]);
    return { profile, stats, games };
}

export const chesscomUserService = {
    getChesscomUser,
    getChesscomStats,
    getRecentGames,
    getChesscomUserFull
};
