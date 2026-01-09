import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BOT_PROFILES } from '../../data/botProfiles';
import { TrophyIcon, CheckIcon } from '../../Components/Icons/Icons';
import { useBotStats } from '../../hooks/useBotStats';
import { useAuth } from '../../contexts/AuthContext';
import './bots.css';

const BotsPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { isBeaten, getBotStats } = useBotStats();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [playerColor, setPlayerColor] = useState('random');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [swipeDirection, setSwipeDirection] = useState(null);

    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    const totalBots = BOT_PROFILES.length;

    const visibleBots = useMemo(() => {
        const prev = currentIndex === 0 ? totalBots - 1 : currentIndex - 1;
        const next = currentIndex === totalBots - 1 ? 0 : currentIndex + 1;
        return {
            prev: BOT_PROFILES[prev],
            current: BOT_PROFILES[currentIndex],
            next: BOT_PROFILES[next]
        };
    }, [currentIndex, totalBots]);

    const handlePlayBot = () => {
        const color = playerColor === 'random'
            ? (Math.random() > 0.5 ? 'white' : 'black')
            : playerColor;
        navigate(`/bots/play/${visibleBots.current.id}?color=${color}`);
    };

    const goToPrevious = () => {
        if (isTransitioning) return;
        setSwipeDirection('right');
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentIndex(prev => prev === 0 ? totalBots - 1 : prev - 1);
            setIsTransitioning(false);
            setSwipeDirection(null);
        }, 400);
    };

    const goToNext = () => {
        if (isTransitioning) return;
        setSwipeDirection('left');
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentIndex(prev => prev === totalBots - 1 ? 0 : prev + 1);
            setIsTransitioning(false);
            setSwipeDirection(null);
        }, 400);
    };

    const goToIndex = (index) => {
        if (isTransitioning || index === currentIndex) return;
        setSwipeDirection(index > currentIndex ? 'left' : 'right');
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentIndex(index);
            setIsTransitioning(false);
            setSwipeDirection(null);
        }, 400);
    };

    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        const swipeDistance = touchStartX.current - touchEndX.current;
        const minSwipeDistance = 50;

        if (Math.abs(swipeDistance) > minSwipeDistance) {
            if (swipeDistance > 0) {
                goToNext();
            } else {
                goToPrevious();
            }
        }
        touchStartX.current = 0;
        touchEndX.current = 0;
    };

    const handleMouseDown = (e) => {
        touchStartX.current = e.clientX;
    };

    const handleMouseUp = (e) => {
        const swipeDistance = touchStartX.current - e.clientX;
        const minSwipeDistance = 50;

        if (Math.abs(swipeDistance) > minSwipeDistance) {
            if (swipeDistance > 0) {
                goToNext();
            } else {
                goToPrevious();
            }
        }
        touchStartX.current = 0;
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') goToPrevious();
            if (e.key === 'ArrowRight') goToNext();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isTransitioning]);

    const getEloTier = (elo) => {
        if (elo < 600) return 'beginner';
        if (elo < 1000) return 'casual';
        if (elo < 1400) return 'intermediate';
        if (elo < 1800) return 'advanced';
        if (elo < 2200) return 'expert';
        return 'master';
    };

    const getDifficultyLabel = (elo) => {
        if (elo < 600) return 'Easy';
        if (elo < 1000) return 'Casual';
        if (elo < 1400) return 'Medium';
        if (elo < 1800) return 'Hard';
        if (elo < 2200) return 'Expert';
        return 'Master';
    };

    return (
        <div className="bots-page">
            <div className="bg-text">PLAY VS BOT</div>

            <div className="bots-header">
                <Link to="/" className="bots-back-link">
                    ← Back to Home
                </Link>
                <h1 className="page-title">Choose Your Opponent</h1>
            </div>

            <div
                className="carousel-section"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => { touchStartX.current = 0; }}
            >
                <div className={`carousel-track ${isTransitioning ? 'transitioning' : ''} ${swipeDirection ? `swipe-${swipeDirection}` : ''}`}>
                    <div
                        className="carousel-card side-card left"
                        onClick={goToPrevious}
                    >
                        <img
                            src={visibleBots.prev.avatar}
                            alt={visibleBots.prev.name}
                            className="card-image"
                            onError={(e) => { e.target.src = '/assets/bots/default.png'; }}
                        />
                    </div>

                    <div className={`carousel-card center-card tier-${getEloTier(visibleBots.current.elo)}`}>
                        <div className="card-avatar-section">
                            <img
                                src={visibleBots.current.avatar}
                                alt={visibleBots.current.name}
                                className="card-avatar"
                                onError={(e) => { e.target.src = '/assets/bots/default.png'; }}
                            />
                            <div className={`elo-badge tier-${getEloTier(visibleBots.current.elo)}`}>
                                <TrophyIcon size={14} />
                                <span>{visibleBots.current.elo}</span>
                            </div>
                            {isAuthenticated && isBeaten(visibleBots.current.id) && (
                                <div className="beaten-badge" title="You've beaten this bot!">
                                    <CheckIcon size={16} />
                                    <span>Defeated</span>
                                </div>
                            )}
                        </div>

                        <div className="card-content">
                            <h2 className="bot-name">{visibleBots.current.name}</h2>
                            <span className={`difficulty-tag tier-${getEloTier(visibleBots.current.elo)}`}>
                                {getDifficultyLabel(visibleBots.current.elo)}
                            </span>
                            <p className="bot-bio">{visibleBots.current.bio}</p>
                            <p className="bot-quote">"{visibleBots.current.catchphrases[0]}"</p>
                        </div>

                        <div className="card-color-selector">
                            <button
                                className={`color-btn ${playerColor === 'white' ? 'active' : ''}`}
                                onClick={() => setPlayerColor('white')}
                            >
                                <span className="color-dot white"></span>
                            </button>
                            <button
                                className={`color-btn ${playerColor === 'random' ? 'active' : ''}`}
                                onClick={() => setPlayerColor('random')}
                            >
                                <span className="color-dot random"></span>
                            </button>
                            <button
                                className={`color-btn ${playerColor === 'black' ? 'active' : ''}`}
                                onClick={() => setPlayerColor('black')}
                            >
                                <span className="color-dot black"></span>
                            </button>
                        </div>

                        <button className="play-btn" onClick={handlePlayBot}>
                            Challenge
                        </button>
                    </div>

                    <div
                        className="carousel-card side-card right"
                        onClick={goToNext}
                    >
                        <img
                            src={visibleBots.next.avatar}
                            alt={visibleBots.next.name}
                            className="card-image"
                            onError={(e) => { e.target.src = '/assets/bots/default.png'; }}
                        />
                    </div>
                </div>

                <div className="carousel-dots">
                    {BOT_PROFILES.map((bot, i) => (
                        <button
                            key={bot.id}
                            className={`dot ${i === currentIndex ? 'active' : ''} tier-${getEloTier(bot.elo)}`}
                            onClick={() => goToIndex(i)}
                            aria-label={`Select ${bot.name}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BotsPage;
