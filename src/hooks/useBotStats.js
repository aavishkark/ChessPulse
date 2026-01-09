import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = 'https://chesspulse-backend.onrender.com/api';

export function useBotStats() {
    const { isAuthenticated, token } = useAuth();
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchStats = useCallback(async () => {
        if (!isAuthenticated || !token) {
            setStats({});
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/bot-games/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch bot stats');
            }

            const data = await response.json();

            const statsMap = {};
            if (Array.isArray(data)) {
                data.forEach(stat => {
                    statsMap[stat.botId] = {
                        wins: stat.wins || 0,
                        losses: stat.losses || 0,
                        draws: stat.draws || 0,
                        totalGames: stat.totalGames || 0,
                        winRate: stat.winRate || 0,
                        beaten: stat.wins > 0
                    };
                });
            }

            setStats(statsMap);
            setError(null);
        } catch (err) {
            console.error('Error fetching bot stats:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, token]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const isBeaten = useCallback((botId) => {
        return stats[botId]?.beaten || false;
    }, [stats]);

    const getBotStats = useCallback((botId) => {
        return stats[botId] || { wins: 0, losses: 0, draws: 0, totalGames: 0, beaten: false };
    }, [stats]);

    return {
        stats,
        loading,
        error,
        isBeaten,
        getBotStats,
        refetch: fetchStats
    };
}

export default useBotStats;
