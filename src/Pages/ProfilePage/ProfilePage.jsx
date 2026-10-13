import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Container, Heading, Text, VStack, Box, Tabs, Flex, Tag, Avatar, Button } from '@chakra-ui/react';
import { Calendar, MapPin, Shield, Search, Edit2 } from 'lucide-react';
import GameStatsView from './GameStatsView';
import PuzzleStatsView from './PuzzleStatsView';
import LichessUserCard from '../../Components/LichessUserCard';
import ChesscomUserCard from '../../Components/ChesscomUserCard';
import EditProfileDialog from './components/EditProfileDialog';
import { PageAmbient } from '../../Components/UI/PageHeader';
import './profile.css';

const ProfilePage = () => {
    const { user } = useAuth();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    if (!user) {
        return (
            <div className="profile-page">
                <PageAmbient watermark="PROFILE" theme="engine" />
                <Container maxW="1200px" py={12} position="relative" zIndex={2}>
                    <Text className="loading-text">Loading profile...</Text>
                </Container>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <PageAmbient watermark="PROFILE" theme="engine" />
            <Container maxW="1200px" py={8} position="relative" zIndex={2}>
                <Box className="profile-header-card" mb={8}>
                    <Flex direction={{ base: 'column', md: 'row' }} align="center" gap={8}>
                        <Box className="avatar-wrapper">
                            <Avatar.Root size="2xl" className="profile-avatar-lg">
                                <Avatar.Fallback name={user.username} />
                                <Avatar.Image src={user.avatar} />
                            </Avatar.Root>
                            <Box className="online-indicator" />
                        </Box>

                        <VStack align={{ base: 'center', md: 'start' }} gap={3} flex={1}>
                            <Flex width="100%" justify={{ base: 'center', md: 'space-between' }} align="center" gap={4}>
                                <Heading size="2xl" className="profile-username">{user.username}</Heading>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    colorPalette="purple"
                                    onClick={() => setIsEditDialogOpen(true)}
                                    color="white"
                                    borderColor="rgba(255,255,255,0.2)"
                                    _hover={{ bg: 'rgba(255,255,255,0.1)' }}
                                >
                                    <Edit2 size={14} style={{ marginRight: '6px' }} />
                                    Edit Profile
                                </Button>
                            </Flex>

                            <Flex gap={4} wrap="wrap" justify={{ base: 'center', md: 'start' }}>
                                {user.country && (
                                    <Tag.Root size="lg" variant="subtle" colorPalette="purple">
                                        <Tag.StartElement>
                                            <MapPin size={14} />
                                        </Tag.StartElement>
                                        <Tag.Label>{user.country}</Tag.Label>
                                    </Tag.Root>
                                )}
                                <Tag.Root size="lg" variant="subtle" colorPalette="blue">
                                    <Tag.StartElement>
                                        <Calendar size={14} />
                                    </Tag.StartElement>
                                    <Tag.Label>Joined {new Date(user.createdAt).toLocaleDateString()}</Tag.Label>
                                </Tag.Root>
                                <Tag.Root size="lg" variant="subtle" colorPalette="green">
                                    <Tag.StartElement>
                                        <Shield size={14} />
                                    </Tag.StartElement>
                                    <Tag.Label>{user.provider || 'Local'} Account</Tag.Label>
                                </Tag.Root>
                            </Flex>
                        </VStack>
                    </Flex>
                </Box>
                <Tabs.Root variant="enclosed" colorPalette="purple" defaultValue="game">
                    <Tabs.List className="profile-tabs" borderBottom="1px solid rgba(255,255,255,0.1)">
                        <Tabs.Trigger value="game" _selected={{ color: 'white', bg: 'var(--accent)', borderColor: 'var(--accent)' }} className="tab-item">
                            Game Stats
                        </Tabs.Trigger>
                        <Tabs.Trigger value="puzzle" _selected={{ color: 'white', bg: 'var(--accent)', borderColor: 'var(--accent)' }} className="tab-item">
                            Puzzle Training
                        </Tabs.Trigger>
                        <Tabs.Trigger value="lichess" _selected={{ color: 'white', bg: 'var(--accent)', borderColor: 'var(--accent)' }} className="tab-item">
                            <Search size={14} style={{ marginRight: '6px' }} />
                            {user.lichessUsername ? 'Lichess Stats' : 'Lichess Lookup'}
                        </Tabs.Trigger>
                        <Tabs.Trigger value="chesscom" _selected={{ color: 'white', bg: 'var(--accent)', borderColor: 'var(--accent)' }} className="tab-item">
                            <Search size={14} style={{ marginRight: '6px' }} />
                            {user.chesscomUsername ? 'Chess.com Stats' : 'Chess.com Lookup'}
                        </Tabs.Trigger>
                    </Tabs.List>

                    <Tabs.Content value="game" mt={6} p={0}>
                        <GameStatsView ratings={user.ratings} />
                    </Tabs.Content>
                    <Tabs.Content value="puzzle" mt={6} p={0}>
                        <PuzzleStatsView />
                    </Tabs.Content>
                    <Tabs.Content value="lichess" mt={6} p={0}>
                        <LichessUserCard
                            key={user.lichessUsername || 'lichess-empty'}
                            initialUsername={user.lichessUsername}
                        />
                    </Tabs.Content>
                    <Tabs.Content value="chesscom" mt={6} p={0}>
                        <ChesscomUserCard
                            key={user.chesscomUsername || 'chesscom-empty'}
                            initialUsername={user.chesscomUsername}
                        />
                    </Tabs.Content>
                </Tabs.Root>

                <EditProfileDialog
                    isOpen={isEditDialogOpen}
                    onClose={() => setIsEditDialogOpen(false)}
                />
            </Container>
        </div>
    );
};

export default ProfilePage;
