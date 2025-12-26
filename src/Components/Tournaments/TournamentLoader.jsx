import React from 'react';
import './tournament-loader.css';

const TournamentLoader = () => {
    return (
        <div className="tournament-loader-container">
            <div className="pawn-3d-loader">
                <div className="chess-pawn">♟</div>
            </div>
            <div className="loader-text">
                <span className="loading-text">Loading tournaments</span>
            </div>
        </div>
    );
};

export default TournamentLoader;
