import axios from 'axios';

// Dynamic API Base URL resolution:
// 1. If VITE_API_URL is explicitly set, use it.
// 2. In browser on any non-localhost domain (Render, custom domain, etc.), use same-origin relative path '/api'.
// 3. In production mode (Vite build), use '/api'.
// 4. In local development on localhost, default to 'http://localhost:5001/api'.
const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.hostname === '[::1]'
);

export const API_BASE_URL = import.meta.env.VITE_API_URL || 
    (!isLocalhost && isBrowser ? '/api' : (import.meta.env.PROD ? '/api' : 'http://localhost:5001/api'));

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;