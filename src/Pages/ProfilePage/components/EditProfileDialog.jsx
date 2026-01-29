import { useState } from 'react';
import { Button, Input, VStack, Text, Box, Flex } from '@chakra-ui/react';
import api from '../../../config/api';
import { useAuth } from '../../../contexts/AuthContext';

const EditProfileDialog = ({ isOpen, onClose }) => {
    const { user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        country: user?.country || '',
        chesscomUsername: user?.chesscomUsername || '',
        lichessUsername: user?.lichessUsername || ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const { data } = await api.put('/user/profile', formData);
            if (data.success) {
                await refreshUser();
                alert("Profile updated successfully");
                onClose();
            }
        } catch (error) {
            console.error("Update failed", error);
            alert("Failed to update profile: " + (error.response?.data?.message || "Something went wrong"));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Box position="fixed" top="0" left="0" w="100%" h="100%" bg="rgba(0,0,0,0.5)" zIndex="1000" display="flex" alignItems="center" justifyContent="center">
            <Box bg="#1a1a2e" p={6} borderRadius="xl" border="1px solid rgba(255,255,255,0.1)" w="400px" maxW="90%">
                <Text fontSize="xl" fontWeight="bold" mb={4} color="white">Edit Profile</Text>

                <VStack spacing={4} align="stretch">
                    <Box>
                        <Text fontSize="sm" color="gray.400" mb={1}>Country</Text>
                        <Input
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            placeholder="e.g. USA"
                            bg="rgba(255,255,255,0.05)"
                            border="1px solid rgba(255,255,255,0.1)"
                            color="white"
                        />
                    </Box>

                    <Box>
                        <Text fontSize="sm" color="gray.400" mb={1}>Chess.com Username</Text>
                        <Input
                            name="chesscomUsername"
                            value={formData.chesscomUsername}
                            onChange={handleChange}
                            placeholder="Enter username"
                            bg="rgba(255,255,255,0.05)"
                            border="1px solid rgba(255,255,255,0.1)"
                            color="white"
                        />
                    </Box>

                    <Box>
                        <Text fontSize="sm" color="gray.400" mb={1}>Lichess Username</Text>
                        <Input
                            name="lichessUsername"
                            value={formData.lichessUsername}
                            onChange={handleChange}
                            placeholder="Enter username"
                            bg="rgba(255,255,255,0.05)"
                            border="1px solid rgba(255,255,255,0.1)"
                            color="white"
                        />
                    </Box>

                    <Flex justify="flex-end" gap={3} mt={4}>
                        <Button variant="ghost" color="gray.400" onClick={onClose}>Cancel</Button>
                        <Button
                            bg="purple.500"
                            color="white"
                            _hover={{ bg: "purple.600" }}
                            onClick={handleSubmit}
                            loading={loading}
                        >
                            Save Changes
                        </Button>
                    </Flex>
                </VStack>
            </Box>
        </Box>
    );
};

export default EditProfileDialog;
