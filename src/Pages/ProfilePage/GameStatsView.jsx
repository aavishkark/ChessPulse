import { Box, SimpleGrid, Grid, GridItem, Heading, NativeSelect, Flex, Text } from '@chakra-ui/react';
import { useState } from 'react';
import StatCard from './components/StatCard';
import RatingChart from './components/RatingChart';
import OutcomeChart from './components/OutcomeChart';
import { Trophy, Flame, Target, Zap, Clock, Hash } from 'lucide-react';

const GameStatsView = ({ ratings }) => {
    const [selectedMode, setSelectedMode] = useState('blitz');

    const currentStats = ratings?.[selectedMode] || {
        rating: 1200,
        highestRating: 1200,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        currentStreak: 0,
        bestStreak: 0,
        ratingHistory: []
    };

    const totalGames = currentStats.gamesPlayed;
    const winRate = totalGames > 0
        ? Math.round((currentStats.wins / totalGames) * 100)
        : 0;

    return (
        <Box>
            <Flex justify="space-between" align="center" mb={6}>
                <Heading size="md" color="white">Game Performance</Heading>
                <NativeSelect.Root
                    size="sm"
                    width="150px"
                    variant="subtle"
                >
                    <NativeSelect.Field
                        value={selectedMode}
                        onChange={(e) => setSelectedMode(e.target.value)}
                        bg="rgba(255,255,255,0.05)"
                        borderColor="rgba(255,255,255,0.1)"
                        color="white"
                        _hover={{ borderColor: "rgba(255,255,255,0.2)" }}
                    >
                        <option value="bullet" style={{ color: 'black' }}>Bullet</option>
                        <option value="blitz" style={{ color: 'black' }}>Blitz</option>
                        <option value="rapid" style={{ color: 'black' }}>Rapid</option>
                    </NativeSelect.Field>
                    <NativeSelect.Indicator color="white" />
                </NativeSelect.Root>
            </Flex>

            <SimpleGrid columns={{ base: 2, md: 4 }} gap={6} mb={8}>
                <StatCard
                    label="Current Rating"
                    value={currentStats.rating}
                    icon={Zap}
                    subtext={`Peak: ${currentStats.highestRating}`}
                />
                <StatCard
                    label="Games Played"
                    value={currentStats.gamesPlayed}
                    icon={Hash}
                />
                <StatCard
                    label="Win Rate"
                    value={`${winRate}%`}
                    icon={Trophy}
                    trend="up" 
                />
                <StatCard
                    label="Best Streak"
                    value={currentStats.bestStreak}
                    icon={Flame}
                    subtext={`Current: ${currentStats.currentStreak}`}
                />
            </SimpleGrid>

            <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
                <GridItem>
                    <Box
                        bg="rgba(0,0,0,0.2)"
                        p={6}
                        borderRadius="xl"
                        border="1px solid rgba(255,255,255,0.05)"
                    >
                        <Heading size="sm" mb={6} color="gray.300">Rating History</Heading>
                        <RatingChart data={currentStats.ratingHistory} color="#3b82f6" />
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
                        <Heading size="sm" mb={2} color="gray.300">Outcomes</Heading>
                        <OutcomeChart
                            wins={currentStats.wins}
                            losses={currentStats.losses}
                            draws={currentStats.draws}
                        />
                    </Box>
                </GridItem>
            </Grid>
        </Box>
    );
};

export default GameStatsView;
