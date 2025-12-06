import React from "react";
import "./tournament-card.css";

export default function TournamentCard({ tournament, onSelectRound, selectedRoundId }) {
    const { tour, rounds, image } = tournament;

    return (
        <div className="tournament-card">
            {image && (
                <div className="tournament-card-image">
                    <img src={image} alt={tour?.name || "Tournament"} />
                </div>
            )}

            <div className="tournament-card-content">
                <h3 className="tournament-card-title">{tour?.name || "Untitled Tournament"}</h3>

                {tour?.description && (
                    <p className="tournament-card-description">
                        {tour.description.length > 120
                            ? tour.description.substring(0, 120) + "..."
                            : tour.description}
                    </p>
                )}

                {rounds && rounds.length > 0 && (
                    <div className="tournament-card-rounds">
                        <h4 className="rounds-title">Rounds:</h4>
                        {rounds.map((round) => (
                            <div key={round.id} className="round-item">
                                <div className="round-info">
                                    <span className="round-name">{round.name}</span>
                                    {round.ongoing && <span className="live-badge">LIVE</span>}
                                </div>
                                <button
                                    className={`round-select-btn ${selectedRoundId === round.id ? "active" : ""}`}
                                    onClick={() => {
                                        console.log("🖱️ Watch button clicked!", { roundId: round.id, tournamentName: tour?.name });
                                        onSelectRound(round.id, tour?.name);
                                    }}
                                    disabled={!round.ongoing}
                                >
                                    {selectedRoundId === round.id ? "Watching" : "Watch"}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {tour?.url && (
                    <a
                        href={tour.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tournament-card-link"
                    >
                        View on Lichess →
                    </a>
                )}
            </div>
        </div>
    );
}
