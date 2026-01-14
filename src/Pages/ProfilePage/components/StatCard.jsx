import { Box, Text, Icon, Flex } from '@chakra-ui/react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({ label, value, icon: IconComponent, trend, trendValue, subtext }) => {
    let TrendIcon = Minus;
    let trendColor = "gray.400";

    if (trend === 'up') {
        TrendIcon = TrendingUp;
        trendColor = "green.400";
    } else if (trend === 'down') {
        TrendIcon = TrendingDown;
        trendColor = "red.400";
    }

    return (
        <Box
            bg="rgba(255, 255, 255, 0.03)"
            border="1px solid rgba(255, 255, 255, 0.08)"
            p={4}
            borderRadius="xl"
            transition="all 0.2s"
            _hover={{
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                borderColor: 'rgba(255, 255, 255, 0.15)'
            }}
        >
            <Flex justify="space-between" align="start" mb={2}>
                <Text color="gray.400" fontSize="sm" fontWeight="500">{label}</Text>
                {IconComponent && <Icon as={IconComponent} color="var(--accent)" boxSize={5} opacity={0.8} />}
            </Flex>

            <Text fontSize="2xl" fontWeight="700" color="white">
                {value}
            </Text>

            {(trendValue || subtext) && (
                <Flex align="center" mt={2} gap={2}>
                    {trendValue && (
                        <Flex align="center" color={trendColor} fontSize="sm" fontWeight="500">
                            <Icon as={TrendIcon} boxSize={3} mr={1} />
                            {trendValue}
                        </Flex>
                    )}
                    {subtext && (
                        <Text color="gray.500" fontSize="xs">
                            {subtext}
                        </Text>
                    )}
                </Flex>
            )}
        </Box>
    );
};

export default StatCard;
