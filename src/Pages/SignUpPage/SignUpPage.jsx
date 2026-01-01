import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, Input, Button, Heading, Text, VStack, Container } from '@chakra-ui/react';
import { API_BASE_URL } from '../../config/api';
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

    const handleGoogleLogin = () => {
        window.location.href = `${API_BASE_URL}/auth/google`;
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

                    <button onClick={handleGoogleLogin} className="oauth-button google-button" type="button">
                        <svg className="oauth-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </button>

                    <div className="divider">
                        <span className="divider-line"></span>
                        <span className="divider-text">OR</span>
                        <span className="divider-line"></span>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <VStack gap={5}>
                            <div className="input-group">
                                <label className="input-label">Email Address</label>
                                <div className="input-wrapper">
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