import axios from 'axios';

const LICHESS_API = 'https://lichess.org/api';

const lichessAxios = axios.create({
    baseURL: LICHESS_API,
    headers: {
        'Accept': 'application/json'
    }
});

/**
 * @param {string} username
 * @returns {Promise<Object>}
 */
export async function getLichessUser(username) {
    const cleanUsername = username.replace(/^(?:https?:\/\/)?(?:www\.|en\.)?lichess\.org\/@\/([^/?#]+).*$/, '$1');

    try {
        const response = await lichessAxios.get(`/user/${cleanUsername}`);
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
 * 
 * @param {string} username
 * @param {number} max
 * @returns {Promise<Array>}
 */
export async function getUserRecentGames(username, max = 5) {
    const cleanUsername = username.replace(/^(?:https?:\/\/)?(?:www\.|en\.)?lichess\.org\/@\/([^/?#]+).*$/, '$1');

    try {
        const response = await lichessAxios.get(`/games/user/${cleanUsername}`, {
            params: {
                max: max,
                perfType: 'bullet,blitz,rapid,classical',
                opening: true
            },
            headers: {
                'Accept': 'application/x-ndjson'
            },
            responseType: 'text'
        });

        if (!response.data) return [];

        return response.data.trim().split('\n').map(line => {
            try {
                return JSON.parse(line);
            } catch (e) {
                return null;
            }
        }).filter(g => g !== null);

    } catch (error) {
        console.error('Failed to fetch recent games:', error);
        return [];
    }
}

/**
 * @param {string} username
 * @returns {Promise<Array>}
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
