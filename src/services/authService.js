import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const authAPI = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const authService = {
  register: async (email, username, password) => {
    const response = await authAPI.post('/register', { email, username, password });
    return response.data;
  },

  login: async (email, password) => {
    const response = await authAPI.post('/login', { email, password });
    return response.data;
  },

  logout: async (refreshToken) => {
    const response = await authAPI.post('/logout', { refreshToken });
    return response.data;
  },

  verifyToken: async () => {
    const response = await authAPI.get('/verify');
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await authAPI.post('/refresh', { refreshToken });
    return response.data;
  }
};