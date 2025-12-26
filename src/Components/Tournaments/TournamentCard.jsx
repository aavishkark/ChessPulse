import React, { useState } from "react";
import "./tournament-card.css";
import TournamentModal from "./TournamentModal";

export default function TournamentCard({ tournament, showLiveButton, onSelectRound, selectedRoundId }) {
    const { tour, rounds, image, sections } = tournament;
    const [isModalOpen, setIsModalOpen] = useState(false);

    const hasOngoingRounds = rounds?.some(r => r.ongoing) || false;
    const totalRounds = sections
        ? sections.reduce((acc, s) => acc + (s.rounds?.length || 0), 0)
        : rounds?.length || 0;

    return (
        <>
            <div
                className={`fide-tournament-card compact ${hasOngoingRounds ? 'ongoing' : ''}`}
                onClick={() => setIsModalOpen(true)}
            >
                {image && (
                    <div className="tournament-image-compact">
                        <img src={image} alt={tour?.name || "Tournament"} />
                    </div>
                )}

                <div className="tournament-card-content">
                    <div className="tournament-header-compact">
                        <h3 className="tournament-title-compact">{tour?.name || "Untitled Tournament"}</h3>
                        {hasOngoingRounds && (
                            <span className="status-badge-compact status-live">
                                <span className="live-dot"></span>
                                LIVE
                            </span>
                        )}
                    </div>

                    <div className="tournament-meta">
                        {sections ? (
                            <span className="meta-item">
                                <span className="meta-icon">📂</span>
                                {sections.length} Division{sections.length > 1 ? 's' : ''}
                            </span>
                        ) : null}
                        <span className="meta-item">
                            <span className="meta-icon">♟️</span>
                            {totalRounds} Round{totalRounds > 1 ? 's' : ''}
                        </span>
                        {hasOngoingRounds && (
                            <span className="meta-item live-games">
                                <span className="meta-icon">🔴</span>
                                Live Games
                            </span>
                        )}
                    </div>

                    <div className="view-details-btn">
                        View Details →
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <TournamentModal
                    tournament={tournament}
                    onClose={() => setIsModalOpen(false)}
                    showLiveButton={showLiveButton}
                    onSelectRound={onSelectRound}
                    selectedRoundId={selectedRoundId}
                />
            )}
        </>
    );
}
