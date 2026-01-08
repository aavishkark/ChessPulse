import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { puzzleStatsService } from '../../services/puzzleStatsService';
import { TargetIcon } from '../Icons/Icons';
import './AICoachCard.css';

const AICoachCard = ({ onRefresh }) => {
    const { isAuthenticated } = useAuth();
    const [advice, setAdvice] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const cardRef = useRef(null);
    const particlesRef = useRef([]);

    const createParticle = useCallback((x, y) => {
        if (!cardRef.current) return;

        const particle = document.createElement('div');
        particle.className = 'cursor-particle';

        const symbols = ['♟', '♞', '♝', '♜', '✦', '✧', '⬡', '◇'];
        particle.textContent = symbols[Math.floor(Math.random() * symbols.length)];

        // Random offset for spread effect
        const offsetX = (Math.random() - 0.5) * 30;
        const offsetY = (Math.random() - 0.5) * 30;

        particle.style.left = `${x + offsetX}px`;
        particle.style.top = `${y + offsetY}px`;
        particle.style.setProperty('--dx', `${(Math.random() - 0.5) * 40}px`);
        particle.style.setProperty('--dy', `${-20 - Math.random() * 30}px`);

        cardRef.current.appendChild(particle);
        particlesRef.current.push(particle);

        // Remove after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
            particlesRef.current = particlesRef.current.filter(p => p !== particle);
        }, 1000);
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (Math.random() > 0.7) {
            createParticle(x, y);
        }
    }, [createParticle]);

    useEffect(() => {
        return () => {
            particlesRef.current.forEach(p => {
                if (p.parentNode) p.parentNode.removeChild(p);
            });
        };
    }, []);

    const fetchAdvice = async () => {
        if (!isAuthenticated) return;

        setLoading(true);
        setError(null);
        try {
            const response = await puzzleStatsService.getRecommendations();
            if (response.success) {
                setAdvice(response.data);
            }
        } catch (err) {
            setError('Could not load AI advice');
            console.error('Error fetching AI advice:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdvice();
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        return (
            <div className="ai-coach-card guest" ref={cardRef} onMouseMove={handleMouseMove}>
                <div className="ai-glow"></div>
                <div className="matrix-bg"></div>
                <div className="coach-content-wrapper">
                    <div className="ai-brain">
                        <div className="brain-core"></div>
                        <div className="brain-ring ring-1"></div>
                        <div className="brain-ring ring-2"></div>
                        <div className="brain-ring ring-3"></div>
                        <div className="neural-dots">
                            <span></span><span></span><span></span><span></span>
                        </div>
                    </div>
                    <h3 className="ai-title">Pulse AI</h3>
                    <p className="ai-tagline">Your personal chess intelligence</p>
                    <div className="coach-actions">
                        <Link to="/puzzles/curated" className="ai-cta practice">
                            <span>Free Session</span>
                        </Link>
                        <Link to="/signin" className="ai-cta">
                            <span>Sign In</span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="ai-coach-card loading" ref={cardRef} onMouseMove={handleMouseMove}>
                <div className="ai-glow"></div>
                <div className="coach-header">
                    <div className="ai-badge">
                        <span className="pulse"></span>
                        AI
                    </div>
                    <h3>Pulse AI</h3>
                </div>
                <div className="coach-loading">
                    <div className="scan-line"></div>
                    <span>Reading your patterns...</span>
                </div>
            </div>
        );
    }

    if (error || !advice) {
        return (
            <div className="ai-coach-card error" ref={cardRef} onMouseMove={handleMouseMove}>
                <div className="ai-glow"></div>
                <div className="coach-header">
                    <div className="ai-badge">AI</div>
                    <h3>Pulse AI</h3>
                </div>
                <p className="coach-error">{error || 'Solve puzzles to unlock insights'}</p>
                <button className="coach-retry" onClick={fetchAdvice}>Retry</button>
            </div>
        );
    }

    return (
        <div className="ai-coach-card active" ref={cardRef} onMouseMove={handleMouseMove}>
            <div className="ai-glow"></div>
            <div className="coach-header">
                <div className="ai-badge active">
                    <span className="pulse"></span>
                    AI
                </div>
                <h3>Pulse AI</h3>
                <button className="coach-refresh" onClick={fetchAdvice} title="Refresh">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                    </svg>
                </button>
            </div>

            <div className="ai-advice">
                {advice.dailyTip && (
                    <p className="advice-tip">{advice.dailyTip}</p>
                )}

                {advice.focusArea && (
                    <div className="advice-focus">
                        <span className="focus-label">Practice</span>
                        <span className="focus-tag">{advice.focusArea}</span>
                    </div>
                )}

                {advice.motivation && (
                    <p className="advice-motivation">"{advice.motivation}"</p>
                )}

                {advice.weeklyGoal && (
                    <div className="advice-goal">
                        <span className="goal-icon"><TargetIcon size={16} /></span>
                        <span>{advice.weeklyGoal}</span>
                    </div>
                )}

                <Link to="/puzzles/curated" className="curated-practice-btn">
                    <span>Start Curated Session</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>
        </div>
    );
};

export default AICoachCard;
