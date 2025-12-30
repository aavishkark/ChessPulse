import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, Input, Button, Heading, Text, VStack, Container } from '@chakra-ui/react';
import './signin.css';

const SignInPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(email, password);

        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
        }

        setIsLoading(false);
    };

    return (
        <div className="auth-page">
            <Container maxW="440px" className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="chess-icon">♞</div>
                        <Heading size="2xl" className="auth-title">Welcome Back</Heading>
                        <Text className="auth-subtitle">Sign in to continue to ChessPulse</Text>
                    </div>

                    {error && (
                        <div className="error-banner">
                            <span className="error-icon">⚠️</span>
                            <Text>{error}</Text>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <VStack gap={5}>
                            <div className="input-group">
                                <label className="input-label">Email Address</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">📧</span>
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        required
                                        className="auth-input"
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Password</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">🔒</span>
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        required
                                        className="auth-input"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                w="full"
                                size="lg"
                                className="submit-button"
                                loading={isLoading}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Signing in...' : 'Sign In'}
                            </Button>
                        </VStack>
                    </form>

                    <div className="auth-footer">
                        <Text className="footer-text">
                            Don't have an account?{' '}
                            <Link to="/signup" className="auth-link">
                                Create one now
                            </Link>
                        </Text>
                    </div>
                </div>
            </Container>
        </div>
    );
};

export default SignInPage;