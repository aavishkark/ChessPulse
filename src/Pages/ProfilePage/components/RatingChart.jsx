import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Box, Text } from '@chakra-ui/react';

const RatingChart = ({ data, color = "#8884d8", height = 300 }) => {
    if (!data || data.length === 0) {
        return (
            <Box h={`${height}px`} display="flex" alignItems="center" justifyContent="center" bg="rgba(0,0,0,0.2)" borderRadius="xl">
                <Text color="gray.500">No rating history available</Text>
            </Box>
        );
    }

    const minRating = Math.min(...data.map(d => d.rating));
    const maxRating = Math.max(...data.map(d => d.rating));
    const padding = (maxRating - minRating) * 0.1 || 50;

    return (
        <Box h={`${height}px`} w="100%">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`color${color}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="rgba(255,255,255,0.3)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis
                        stroke="rgba(255,255,255,0.3)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        domain={[minRating - padding, maxRating + padding]}
                        hide={false}
                        width={40}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1a1a1a',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                        }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: '#888' }}
                        labelFormatter={(str) => new Date(str).toLocaleDateString()}
                    />
                    <Area
                        type="monotone"
                        dataKey="rating"
                        stroke={color}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill={`url(#color${color})`}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default RatingChart;
