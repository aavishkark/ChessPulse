import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ChessLoader from '../ChessLoader/ChessLoader';
import { Center } from '@chakra-ui/react';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <Center h="100vh" w="100%">
                <ChessLoader text="Verifying access..." />
            </Center>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/signin" replace />;
    }

    return children;
};

export default ProtectedRoute;
