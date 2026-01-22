import axios from 'axios';

const CHESSCOM_API = 'https://api.chess.com/pub';

const chesscomAxios = axios.create({
    baseURL: CHESSCOM_API,
    headers: {
        'Accept': 'application/json'
    }
});

export async function getChesscomUser(username) {
    try {
        const response = await chesscomAxios.get(`/player/${username.toLowerCase()}`);
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
    try {
        const response = await chesscomAxios.get(`/player/${username.toLowerCase()}/stats`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch stats:', error);
        return null;
    }
}

export async function getChesscomUserFull(username) {
    const [profile, stats] = await Promise.all([
        getChesscomUser(username),
        getChesscomStats(username)
    ]);
    return { profile, stats };
}

export const chesscomUserService = {
    getChesscomUser,
    getChesscomStats,
    getChesscomUserFull
};
