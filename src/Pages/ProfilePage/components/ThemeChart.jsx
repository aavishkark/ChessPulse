import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { Box, Text } from '@chakra-ui/react';

const ThemeChart = ({ data, height = 300 }) => {
    if (!data || data.length === 0) {
        return (
            <Box h={`${height}px`} display="flex" alignItems="center" justifyContent="center" bg="rgba(0,0,0,0.2)" borderRadius="xl">
                <Text color="gray.500">No theme data available</Text>
            </Box>
        );
    }

    return (
        <Box h={`${height}px`} w="100%">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis
                        dataKey="theme"
                        type="category"
                        stroke="rgba(255,255,255,0.7)"
                        fontSize={12}
                        width={100}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{
                            backgroundColor: '#1a1a1a',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px'
                        }}
                        formatter={(value) => [`${value}% Accuracy`]}
                    />
                    <Bar dataKey="accuracy" radius={[0, 4, 4, 0]} barSize={20}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.accuracy >= 70 ? '#4ade80' : entry.accuracy >= 50 ? '#fbbf24' : '#f87171'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default ThemeChart;
