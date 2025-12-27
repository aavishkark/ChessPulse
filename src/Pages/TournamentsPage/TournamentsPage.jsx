import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { pastTournaments } from "../../data/pastTournaments";
import TournamentTabs from "../../Components/Tournaments/TournamentTabs";
import TournamentCard from "../../Components/Tournaments/TournamentCard";
import TournamentSearch from "../../Components/Tournaments/TournamentSearch";
import TournamentLoader from "../../Components/Tournaments/TournamentLoader";
import RoundGamesModal from "../../Components/Tournaments/RoundGamesModal";
import "./tournaments-page.css";

export default function TournamentsPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("ongoing");
    const [searchTerm, setSearchTerm] = useState("");
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRound, setSelectedRound] = useState(null);

    useEffect(() => {
        fetchTournaments();
    }, []);

    const groupTournaments = (tournaments) => {
        const grouped = {};

        tournaments.forEach(tournament => {
            const name = tournament.tour.name;
            const baseNameMatch = name.match(/^(.+?)\s*\|/);

            if (baseNameMatch) {
                const baseName = baseNameMatch[1].trim();

                if (!grouped[baseName]) {
                    grouped[baseName] = {
                        tour: {
                            ...tournament.tour,
                            name: baseName,
                            originalName: tournament.tour.name
                        },
                        rounds: [],
                        sections: [],
                        image: tournament.image
                    };
                }

                const sectionName = name.substring(baseNameMatch[0].length).trim();
                grouped[baseName].sections.push({
                    name: sectionName,
                    rounds: tournament.rounds || [],
                    url: tournament.tour.url,
                    id: tournament.tour.id
                });

                if (tournament.rounds) {
                    grouped[baseName].rounds.push(...tournament.rounds);
                }
            } else {
                grouped[name] = {
                    ...tournament,
                    sections: null
                };
            }
        });

        return Object.values(grouped);
    };

    const fetchTournaments = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch("https://lichess.org/api/broadcast?nb=50");

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            const lines = text.trim().split("\n");
            const broadcastData = lines
                .filter(line => line.trim())
                .map(line => {
                    try {
                        return JSON.parse(line);
                    } catch {
                        return null;
                    }
                })
                .filter(Boolean);

            const groupedTournaments = groupTournaments(broadcastData);
            setTournaments(groupedTournaments);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching tournaments:", err);
            setError("Failed to load tournaments");
            setLoading(false);
        }
    };

    const getFilteredTournaments = () => {
        return tournaments.filter(tournament => {
            if (!tournament.rounds || tournament.rounds.length === 0) return false;

            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

            const hasOngoingRounds = tournament.rounds.some(round => {
                if (!round.ongoing) return false;
                if (round.startsAt) {
                    const roundDate = new Date(round.startsAt);
                    return roundDate.getTime() <= now.getTime();
                }
                return true;
            });

            const hasRoundsToday = tournament.rounds.some(round => {
                if (!round.startsAt) return false;
                const roundDate = new Date(round.startsAt);
                const roundDayStart = new Date(roundDate.getFullYear(), roundDate.getMonth(), roundDate.getDate());

                const isToday = roundDayStart.getTime() === todayStart.getTime();
                const hasStarted = roundDate.getTime() <= now.getTime() + (5 * 60 * 1000);
                const isActive = !round.finished;

                return isToday && hasStarted && isActive;
            });

            const hasCreatedRounds = tournament.rounds.some(round => !round.ongoing && !round.finished);
            const allFinished = tournament.rounds.length > 0 && tournament.rounds.every(round => round.finished === true);

            let statusMatch = false;

            if (activeTab === "ongoing") {
                statusMatch = hasOngoingRounds || hasRoundsToday;
            }

            if (activeTab === "upcoming") {
                statusMatch = !hasOngoingRounds && !hasRoundsToday && hasCreatedRounds;
            }

            if (activeTab === "past") {
                statusMatch = allFinished;
            }

            if (!statusMatch) return false;

            if (searchTerm && !tournament.tour.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }

            return true;
        });
    };

    const filteredTournaments = getFilteredTournaments();

    const displayTournaments = activeTab === "past"
        ? [...filteredTournaments, ...pastTournaments.filter(t =>
            !searchTerm || t.tour.name.toLowerCase().includes(searchTerm.toLowerCase())
        )]
        : filteredTournaments;

    const handleSelectRound = (roundId, roundName) => {
        setSelectedRound({ id: roundId, name: roundName });
    };

    const handleSelectGame = (roundId, gameIndex) => {
        navigate(`/game/${roundId}/${gameIndex}`);
    };

    const handleCloseModal = () => {
        setSelectedRound(null);
    };

    if (loading) {
        return (
            <div className="tournaments-page">
                <div className="tournaments-page-header">
                    <h1 className="page-title">Official Chess Tournaments</h1>
                    <p className="page-subtitle">Live broadcasts from around the world</p>
                </div>
                <TournamentLoader />
            </div>
        );
    }

    if (error) {
        return (
            <div className="tournaments-page">
                <div className="tournaments-page-header">
                    <h1 className="page-title">Official Chess Tournaments</h1>
                    <p className="page-subtitle">Live broadcasts from around the world</p>
                </div>
                <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    <p>{error}</p>
                    <button onClick={fetchTournaments} className="retry-btn">Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="tournaments-page">
            <div className="tournaments-page-header">
                <h1 className="page-title">Official Chess Tournaments</h1>
                <p className="page-subtitle">Live broadcasts from around the world</p>
            </div>

            <TournamentTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="tournaments-controls">
                <TournamentSearch value={searchTerm} onSearch={setSearchTerm} />
            </div>

            {displayTournaments.length === 0 ? (
                <div className="no-tournaments">
                    <span className="no-tournaments-icon">♞</span>
                    <p>No {activeTab} tournaments at the moment</p>
                    <p className="no-tournaments-subtitle">Check back soon!</p>
                </div>
            ) : (
                <div className="tournaments-grid">
                    {displayTournaments.map(tournament => (
                        <TournamentCard
                            key={tournament.tour.id}
                            tournament={tournament}
                            showLiveButton={activeTab === "ongoing"}
                            onSelectRound={handleSelectRound}
                        />
                    ))}
                </div>
            )}

            {selectedRound && (
                <RoundGamesModal
                    roundId={selectedRound.id}
                    roundName={selectedRound.name}
                    isOpen={!!selectedRound}
                    onClose={handleCloseModal}
                    onSelectGame={handleSelectGame}
                />
            )}
        </div>
    );
}
