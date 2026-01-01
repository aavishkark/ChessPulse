import { useAuth } from '../../contexts/AuthContext';
import { Container, Heading, Text, VStack, Box } from '@chakra-ui/react';
import './profile.css';

const ProfilePage = () => {
    const { user } = useAuth();

    if (!user) {
        return (
            <div className="profile-page">
                <Container maxW="800px">
                    <Text>Loading...</Text>
                </Container>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <Container maxW="800px" py={8}>
                <VStack spacing={6} align="stretch">
                    <Box className="profile-header">
                        <img
                            src={user.avatar}
                            alt={user.username}
                            className="profile-avatar"
                        />
                        <Heading size="xl" mt={4}>{user.username}</Heading>
                        <Text color="gray.500" fontSize="lg">{user.email}</Text>
                    </Box>

                    <Box className="profile-card">
                        <Heading size="md" mb={4}>Account Information</Heading>
                        <VStack align="stretch" spacing={3}>
                            <Box className="profile-info-row">
                                <Text fontWeight="600">Provider:</Text>
                                <Text>{user.provider || 'Local'}</Text>
                            </Box>
                            <Box className="profile-info-row">
                                <Text fontWeight="600">Country:</Text>
                                <Text>{user.country || 'Not set'}</Text>
                            </Box>
                            <Box className="profile-info-row">
                                <Text fontWeight="600">Member since:</Text>
                                <Text>{new Date(user.createdAt).toLocaleDateString()}</Text>
                            </Box>
                            <Box className="profile-info-row">
                                <Text fontWeight="600">Last login:</Text>
                                <Text>{new Date(user.lastLogin).toLocaleDateString()}</Text>
                            </Box>
                        </VStack>
                    </Box>
                </VStack>
            </Container>
        </div>
    );
};

export default ProfilePage;
