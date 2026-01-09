import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const botGameAPI = axios.create({
    baseURL: `${API_BASE_URL}/bot-games`,
    headers: {
        'Content-Type': 'application/json'
    }
});

botGameAPI.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const botGameService = {
    recordGame: async (gameData) => {
        try {
            const response = await botGameAPI.post('/record', gameData);
            return response.data;
        } catch (error) {
            console.error('Error recording bot game:', error);
            throw error;
        }
    },

    getHistory: async (options = {}) => {
        try {
            const params = new URLSearchParams();
            if (options.page) params.append('page', options.page);
            if (options.limit) params.append('limit', options.limit);
            if (options.botId) params.append('botId', options.botId);

            const response = await botGameAPI.get(`/history?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching bot game history:', error);
            throw error;
        }
    },

    getStats: async () => {
        try {
            const response = await botGameAPI.get('/stats');
            return response.data;
        } catch (error) {
            console.error('Error fetching bot game stats:', error);
            throw error;
        }
    },

    getGame: async (gameId) => {
        try {
            const response = await botGameAPI.get(`/${gameId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching bot game:', error);
            throw error;
        }
    }
};

export default botGameService;
