import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const puzzleStatsAPI = axios.create({
    baseURL: `${API_BASE_URL}/puzzles`,
    headers: {
        'Content-Type': 'application/json'
    }
});

puzzleStatsAPI.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const puzzleStatsService = {
    recordAttempt: async (data) => {
        try {
            const response = await puzzleStatsAPI.post('/attempt', data);
            return response.data;
        } catch (error) {
            console.error('Error recording attempt:', error);
            throw error;
        }
    },

    getRating: async () => {
        try {
            const response = await puzzleStatsAPI.get('/rating');
            return response.data;
        } catch (error) {
            console.error('Error fetching rating:', error);
            throw error;
        }
    },

    getStats: async () => {
        try {
            const response = await puzzleStatsAPI.get('/stats');
            return response.data;
        } catch (error) {
            console.error('Error fetching stats:', error);
            throw error;
        }
    },

    getHistory: async (options = {}) => {
        try {
            const params = new URLSearchParams();
            if (options.page) params.append('page', options.page);
            if (options.limit) params.append('limit', options.limit);
            if (options.mode) params.append('mode', options.mode);
            if (options.theme) params.append('theme', options.theme);

            const response = await puzzleStatsAPI.get(`/history?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching history:', error);
            throw error;
        }
    },

    getLeaderboard: async (type = 'rating', limit = 50) => {
        try {
            const response = await puzzleStatsAPI.get(`/leaderboard?type=${type}&limit=${limit}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            throw error;
        }
    },

    getUserRank: async (type = 'rating') => {
        try {
            const response = await puzzleStatsAPI.get(`/leaderboard/rank?type=${type}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching rank:', error);
            throw error;
        }
    },

    getRecommendations: async () => {
        try {
            const response = await puzzleStatsAPI.get('/recommend');
            return response.data;
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            throw error;
        }
    },

    explainPuzzle: async (puzzleData) => {
        try {
            const response = await puzzleStatsAPI.post('/explain', puzzleData);
            return response.data;
        } catch (error) {
            console.error('Error explaining puzzle:', error);
            throw error;
        }
    },

    getTrainingPlan: async () => {
        try {
            const response = await puzzleStatsAPI.get('/training-plan');
            return response.data;
        } catch (error) {
            console.error('Error fetching training plan:', error);
            throw error;
        }
    },

    getMotivation: async () => {
        try {
            const response = await puzzleStatsAPI.get('/motivation');
            return response.data;
        } catch (error) {
            console.error('Error fetching motivation:', error);
            throw error;
        }
    },

    getSessionFeedback: async (sessionData) => {
        try {
            const response = await puzzleStatsAPI.post('/session-feedback', sessionData);
            return response.data;
        } catch (error) {
            console.error('Error fetching session feedback:', error);
            throw error;
        }
    }
};

export default puzzleStatsService;
