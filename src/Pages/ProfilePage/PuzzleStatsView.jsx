import { Box, SimpleGrid, Grid, GridItem, Heading, Flex, Text, Spinner, Center } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import StatCard from './components/StatCard';
import RatingChart from './components/RatingChart';
import ThemeChart from './components/ThemeChart';
import { Target, Zap, Clock, TrendingUp } from 'lucide-react';

const PuzzleStatsView = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:3000/api/puzzles/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data.success) {
                    setStats(response.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch puzzle stats", err);
                setError("Could not load puzzle stats");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <Center h="300px">
                <Spinner size="xl" color="var(--accent)" thickness="4px" />
            </Center>
        );
    }

    if (error || !stats) {
        return (
            <Box textAlign="center" py={12} color="gray.500">
                <Text>{error || "No puzzle history found. Start training to see stats!"}</Text>
            </Box>
        );
    }

    const themeData = stats.topThemes?.map(([theme, data]) => ({
        theme: theme.charAt(0).toUpperCase() + theme.slice(1).replace(/_/g, ' '),
        accuracy: data.accuracy,
        attempted: data.attempted
    })) || [];

    return (
        <Box animation="fadeIn 0.5s ease">
            <Heading size="md" mb={6} color="white">Puzzle Training</Heading>

            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={8}>
                <StatCard
                    label="Puzzle Rating"
                    value={stats.rating}
                    icon={Target}
                    subtext={`Peak: ${stats.peakRating}`}
                />
                <StatCard
                    label="Solved / Total"
                    value={`${stats.totalSolved} / ${stats.totalAttempted}`}
                    icon={Zap}
                />
                <StatCard
                    label="Accuracy"
                    value={`${stats.accuracy}%`}
                    icon={TrendingUp}
                    trend={stats.accuracy >= 50 ? 'up' : 'down'}
                />
                <StatCard
                    label="Current Streak"
                    value={stats.streak?.current || 0}
                    icon={Clock}
                    subtext={`Best: ${stats.streak?.best || 0}`}
                />
            </SimpleGrid>

            <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
                <GridItem>
                    <Box
                        bg="rgba(0,0,0,0.2)"
                        p={6}
                        borderRadius="xl"
                        border="1px solid rgba(255,255,255,0.05)"
                    >
                        <Heading size="sm" mb={6} color="gray.300">Rating Progress</Heading>
                        <RatingChart data={stats.ratingHistory} color="#10b981" />
                    </Box>
                </GridItem>
                <GridItem>
                    <Box
                        bg="rgba(0,0,0,0.2)"
                        p={6}
                        borderRadius="xl"
                        border="1px solid rgba(255,255,255,0.05)"
                        h="100%"
                    >
                        <Heading size="sm" mb={2} color="gray.300">Theme Performance</Heading>
                        <ThemeChart data={themeData} />
                    </Box>
                </GridItem>
            </Grid>
        </Box>
    );
};

export default PuzzleStatsView;
