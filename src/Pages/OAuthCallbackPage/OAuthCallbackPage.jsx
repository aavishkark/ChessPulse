import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OAuthCallbackPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleOAuthCallback = () => {
            const params = new URLSearchParams(window.location.search);
            const accessToken = params.get('accessToken');
            const refreshToken = params.get('refreshToken');
            const error = params.get('error');

            if (error) {
                console.error('OAuth error:', error);
                navigate('/signin?error=' + encodeURIComponent(error));
                return;
            }

            if (accessToken && refreshToken) {
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);

                window.location.href = '/';
            } else {
                console.error('Missing tokens in OAuth callback');
                navigate('/signin?error=Authentication failed - missing tokens');
            }
        };

        handleOAuthCallback();
    }, [navigate]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            flexDirection: 'column',
            gap: '20px',
            color: 'var(--text)'
        }}>
            <div style={{ fontSize: '48px' }}>♞</div>
            <div style={{ fontSize: '18px' }}>Completing sign in...</div>
        </div>
    );
};

export default OAuthCallbackPage;
