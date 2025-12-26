import React, { useState } from "react";
import "./tournament-modal.css";

export default function TournamentModal({ tournament, onClose, showLiveButton, onSelectRound, selectedRoundId }) {
    const { tour, rounds, image, sections } = tournament;
    const [expandedSections, setExpandedSections] = useState(new Set());

    const toggleSection = (sectionName) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(sectionName)) {
            newExpanded.delete(sectionName);
        } else {
            newExpanded.add(sectionName);
        }
        setExpandedSections(newExpanded);
    };

    const formatTime = (dateString) => {
        if (!dateString) return "";

        const roundDate = new Date(dateString);
        const now = new Date();

        const diffTime = roundDate.getTime() - now.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        const time = roundDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });

        if (roundDate.toDateString() === now.toDateString()) {
            return `Today ${time}`;
        }

        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (roundDate.toDateString() === tomorrow.toDateString()) {
            return `Tomorrow ${time}`;
        }

        const date = roundDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
        return `${date}, ${time}`;
    };

    return (
        <div className="tournament-modal-overlay" onClick={onClose}>
            <div className="tournament-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>

                <div className="modal-header">
                    {image && (
                        <div className="modal-image">
                            <img src={image} alt={tour?.name || "Tournament"} />
                        </div>
                    )}
                    <h2 className="modal-title">{tour?.name || "Tournament"}</h2>
                    {tour?.description && (
                        <p className="modal-description">{tour.description}</p>
                    )}
                </div>

                <div className="modal-body">
                    {sections ? (
                        <div className="modal-sections">
                            <h3 className="modal-subtitle">{sections.length} Divisions</h3>
                            {sections.map((section, idx) => (
                                <div key={idx} className="modal-section-item">
                                    <div
                                        className="modal-section-header"
                                        onClick={() => toggleSection(section.name)}
                                    >
                                        <div className="modal-section-title">
                                            <span>{section.name}</span>
                                            {section.rounds.some(r => r.ongoing) && (
                                                <span className="section-live-badge">LIVE</span>
                                            )}
                                        </div>
                                        <span className="section-toggle">
                                            {expandedSections.has(section.name) ? '▼' : '▶'}
                                        </span>
                                    </div>

                                    {expandedSections.has(section.name) && (
                                        <div className="modal-section-rounds">
                                            {section.rounds.map((round) => (
                                                <div key={round.id} className="modal-round-item">
                                                    <div className="modal-round-info">
                                                        <span className="modal-round-name">{round.name}</span>
                                                        {round.ongoing && <span className="round-live-badge">LIVE</span>}
                                                        {!round.ongoing && !round.finished && round.startsAt && (
                                                            <span className="round-upcoming-badge">
                                                                {formatTime(round.startsAt)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {showLiveButton && (round.ongoing || !round.finished) && (
                                                        <button
                                                            className={`modal-watch-btn ${!round.ongoing ? 'upcoming' : ''}`}
                                                            onClick={() => {
                                                                onSelectRound && onSelectRound(round.id, `${tour?.name} - ${section.name}`);
                                                                onClose();
                                                            }}
                                                            disabled={!round.ongoing}
                                                        >
                                                            {round.ongoing ? "Watch" : "Starting Soon"}
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        rounds && rounds.length > 0 && (
                            <div className="modal-rounds">
                                <h3 className="modal-subtitle">Rounds</h3>
                                {rounds.map((round) => (
                                    <div key={round.id} className="modal-round-item">
                                        <div className="modal-round-info">
                                            <span className="modal-round-name">{round.name}</span>
                                            {round.ongoing && <span className="round-live-badge">LIVE</span>}
                                            {!round.ongoing && !round.finished && round.startsAt && (
                                                <span className="round-upcoming-badge">
                                                    {formatTime(round.startsAt)}
                                                </span>
                                            )}
                                        </div>
                                        {showLiveButton && (round.ongoing || !round.finished) && (
                                            <button
                                                className={`modal-watch-btn ${!round.ongoing ? 'upcoming' : ''}`}
                                                onClick={() => {
                                                    onSelectRound && onSelectRound(round.id, tour?.name);
                                                    onClose();
                                                }}
                                                disabled={!round.ongoing}
                                            >
                                                {round.ongoing ? "Watch" : "Starting Soon"}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>

                <div className="modal-footer">
                    {tour?.url && (
                        <a
                            href={tour.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="modal-lichess-link"
                        >
                            View on Lichess →
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
