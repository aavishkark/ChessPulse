import axios from 'axios';

const LICHESS_API = 'https://lichess.org/api';

const lichessAxios = axios.create({
    baseURL: LICHESS_API,
    headers: {
        'Accept': 'application/json'
    }
});

/**
 * Fetch a Lichess user's public data
 * @param {string} username - Lichess username
 * @returns {Promise<Object>} User data including ratings, game counts, etc.
 */
export async function getLichessUser(username) {
    try {
        const response = await lichessAxios.get(`/user/${username}`);
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

/**
 * Fetch a Lichess user's recent games
 * @param {string} username - Lichess username
 * @param {number} max - Maximum number of games to fetch (default: 10)
 * @returns {Promise<Array>} Array of recent games
 */
export async function getUserRecentGames(username, max = 10) {
    try {
        const response = await lichessAxios.get(`/user/${username}/rating-history`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch rating history:', error);
        return [];
    }
}

/**
 * Fetch user's activity feed
 * @param {string} username - Lichess username
 * @returns {Promise<Array>} Activity data
 */
export async function getUserActivity(username) {
    try {
        const response = await lichessAxios.get(`/user/${username}/activity`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch activity:', error);
        return [];
    }
}

export const lichessUserService = {
    getLichessUser,
    getUserRecentGames,
    getUserActivity
};
