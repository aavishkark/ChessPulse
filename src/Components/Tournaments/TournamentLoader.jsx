import React from 'react';
import ChessLoader from '../ChessLoader/ChessLoader';
import './tournament-loader.css';

const TournamentLoader = () => {
    return (
        <div className="tournament-loader-container">
            <ChessLoader text="Loading tournaments" />
        </div>
    );
};

export default TournamentLoader;
