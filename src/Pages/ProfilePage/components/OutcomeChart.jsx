import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Box, Text } from '@chakra-ui/react';

const OutcomeChart = ({ wins, losses, draws, height = 300 }) => {
    const data = [
        { name: 'Wins', value: wins, color: '#4ade80' },
        { name: 'Draws', value: draws, color: '#94a3b8' },
        { name: 'Losses', value: losses, color: '#f87171' },
    ].filter(item => item.value > 0);

    if (data.length === 0) {
        return (
            <Box h={`${height}px`} display="flex" alignItems="center" justifyContent="center" bg="rgba(0,0,0,0.2)" borderRadius="xl">
                <Text color="gray.500">No games played yet</Text>
            </Box>
        );
    }

    return (
        <Box h={`${height}px`} w="100%">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1a1a1a',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px'
                        }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                </PieChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default OutcomeChart;
