import React, { useState } from "react";
import "./tournament-card.css";
import TournamentModal from "./TournamentModal";
import { Radio, Trophy, Globe, Activity } from "lucide-react";

const ACCENT_VARIANTS = ["emerald", "violet", "amber", "cyan"];

export default function TournamentCard({ tournament, showLiveButton, onSelectRound, selectedRoundId }) {
    const { tour, rounds, image, sections } = tournament;
    const [isModalOpen, setIsModalOpen] = useState(false);

    const hasOngoingRounds = rounds?.some(r => r.ongoing) || false;
    const totalRounds = sections
        ? sections.reduce((acc, s) => acc + (s.rounds?.length || 0), 0)
        : rounds?.length || 0;

    // Deterministic visual variation so cards never look identical
    const nameStr = tour?.name || tour?.id || "fide";
    const hash = nameStr.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const variant = hasOngoingRounds ? "emerald" : ACCENT_VARIANTS[hash % ACCENT_VARIANTS.length];
    const FallbackIcon = hasOngoingRounds ? Radio : hash % 2 === 0 ? Trophy : Globe;
    const channelCode = `CH-${String((hash % 89) + 10)} · ${totalRounds} RDS`;

    return (
        <>
            <div
                className={`fide-tournament-card compact variant-${variant} ${hasOngoingRounds ? 'ongoing' : ''}`}
                onClick={() => setIsModalOpen(true)}
            >
                <div className={`tournament-image-compact variant-${variant}`}>
                    {image ? (
                        <img src={image} alt={tour?.name || "Tournament"} />
                    ) : (
                        <div className="tournament-fallback-art" aria-hidden="true">
                            <div className="fallback-grid-pattern" />
                            <div className="fallback-telemetry-center">
                                <div className="fallback-icon-ring">
                                    <FallbackIcon size={22} />
                                </div>
                                <span className="fallback-channel-code">{channelCode}</span>
                            </div>
                        </div>
                    )}
                    <div className="tournament-image-overlay" />
                    <span className="tournament-tier-tag">
                        {tour?.tier ? `TIER ${tour.tier}` : "FIDE RELAY"}
                    </span>
                    {hasOngoingRounds && (
                        <span className="status-badge-compact status-live">
                            <span className="live-dot"></span>
                            LIVE
                        </span>
                    )}
                </div>

                <div className="tournament-card-content">
                    <div className="tournament-header-compact">
                        <h3 className="tournament-title-compact">{tour?.name || "Untitled Tournament"}</h3>
                    </div>

                    <div className="tournament-meta">
                        {sections ? (
                            <span className="meta-item">
                                <span className="meta-dot" />
                                {sections.length} Division{sections.length > 1 ? 's' : ''}
                            </span>
                        ) : null}
                        <span className="meta-item">
                            <span className="meta-dot" />
                            {totalRounds} Round{totalRounds !== 1 ? 's' : ''}
                        </span>
                        {hasOngoingRounds && (
                            <span className="meta-item live-games">
                                <span className="live-dot"></span>
                                Active Boards
                            </span>
                        )}
                    </div>

                    <div className="view-details-btn">
                        <span>Inspect Broadcast</span>
                        <span className="view-details-arrow">→</span>
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
