import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, Input, Button, Heading, Text, VStack, Container } from '@chakra-ui/react';
import './signup.css';

const SignUpPage = () => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const getPasswordStrength = () => {
        if (!password) return { label: '', color: '', width: '0%' };
        if (password.length < 6) return { label: 'Weak', color: '#ff5858', width: '33%' };
        if (password.length < 10) return { label: 'Medium', color: '#ffa726', width: '66%' };
        return { label: 'Strong', color: '#4caf50', width: '100%' };
    };

    const strength = getPasswordStrength();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);
        const result = await register(email, username, password);

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
                        <Heading size="2xl" className="auth-title">Join ChessPulse</Heading>
                        <Text className="auth-subtitle">Create your account to get started</Text>
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
                                <label className="input-label">Username</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">👤</span>
                                    <Input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Choose a username"
                                        required
                                        minLength={3}
                                        maxLength={20}
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
                                        placeholder="Create a password"
                                        required
                                        minLength={6}
                                        className="auth-input"
                                    />
                                </div>
                                {password && (
                                    <div className="password-strength">
                                        <div className="strength-bar">
                                            <div
                                                className="strength-fill"
                                                style={{ width: strength.width, backgroundColor: strength.color }}
                                            />
                                        </div>
                                        <Text className="strength-label" style={{ color: strength.color }}>
                                            {strength.label}
                                        </Text>
                                    </div>
                                )}
                            </div>

                            <div className="input-group">
                                <label className="input-label">Confirm Password</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">🔒</span>
                                    <Input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm your password"
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
                                {isLoading ? 'Creating Account...' : 'Create Account'}
                            </Button>
                        </VStack>
                    </form>

                    <div className="auth-footer">
                        <Text className="footer-text">
                            Already have an account?{' '}
                            <Link to="/signin" className="auth-link">
                                Sign in instead
                            </Link>
                        </Text>
                    </div>
                </div>
            </Container>
        </div>
    );
};

export default SignUpPage;