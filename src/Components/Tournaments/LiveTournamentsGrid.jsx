import React, { useEffect, useState } from "react";
import "./live-tournaments-grid.css";

export default function LiveTournamentsGrid() {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTournaments = async () => {
        try {
            setError(null);
            const response = await fetch("https://lichess.org/api/tournament");

            if (response.status === 429) {
                setError("Rate limited. Please wait...");
                setLoading(false);
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            const allTournaments = [
                ...(data.started || []),
                ...(data.created || [])
            ];

            setTournaments(allTournaments);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching tournaments:", err);
            setError("Failed to load tournaments");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTournaments();

        const interval = setInterval(() => {
            fetchTournaments();
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const getVariantDisplay = (tournament) => {
        const variant = tournament.variant?.name || "Standard";
        const perf = tournament.perf?.name || "";
        return variant !== "Standard" ? variant : perf || "Standard";
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            created: { text: "Starting Soon", class: "status-created" },
            started: { text: "Live", class: "status-live" },
            finished: { text: "Finished", class: "status-finished" }
        };
        return statusMap[status] || { text: status, class: "" };
    };

    if (loading) {
        return (
            <div className="tournaments-grid-container">
                <div className="tournaments-grid">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="tournament-grid-card skeleton">
                            <div className="skeleton-header"></div>
                            <div className="skeleton-body"></div>
                            <div className="skeleton-footer"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="tournaments-grid-container">
                <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    <p>{error}</p>
                    <button onClick={fetchTournaments} className="retry-btn">Retry</button>
                </div>
            </div>
        );
    }

    const liveTournaments = tournaments;

    return (
        <div className="tournaments-grid-container">
            <div className="tournaments-grid-header">
                <h2>Live Tournaments</h2>
                <p className="tournaments-count">{liveTournaments.length} active tournament{liveTournaments.length !== 1 ? 's' : ''}</p>
            </div>

            {liveTournaments.length === 0 ? (
                <div className="no-tournaments">
                    <span className="no-tournaments-icon">♞</span>
                    <p>No live tournaments at the moment</p>
                    <p className="no-tournaments-subtitle">Check back soon!</p>
                </div>
            ) : (
                <div className="tournaments-grid">
                    {liveTournaments.map((tournament) => {
                        const status = getStatusBadge(tournament.status);
                        const isLive = tournament.status === "started";

                        return (
                            <a
                                key={tournament.id}
                                href={`https://lichess.org/tournament/${tournament.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`tournament-grid-card ${isLive ? 'live' : ''}`}
                            >
                                <div className="tournament-card-header">
                                    <h3 className="tournament-title">{tournament.fullName || "Tournament"}</h3>
                                    <span className={`status-badge ${status.class}`}>
                                        {isLive && <span className="live-dot"></span>}
                                        {status.text}
                                    </span>
                                </div>

                                <div className="tournament-card-body">
                                    <div className="tournament-info-row">
                                        <div className="info-item">
                                            <span className="info-icon">👥</span>
                                            <span className="info-value">{tournament.nbPlayers || 0} players</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-icon">⚡</span>
                                            <span className="info-value">{getVariantDisplay(tournament)}</span>
                                        </div>
                                    </div>

                                    {tournament.clock && (
                                        <div className="tournament-clock">
                                            {tournament.clock.limit / 60} + {tournament.clock.increment}
                                        </div>
                                    )}
                                </div>

                                <div className="tournament-card-footer">
                                    <span className="view-link">View Tournament →</span>
                                </div>
                            </a>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
