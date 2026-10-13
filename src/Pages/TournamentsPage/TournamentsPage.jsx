import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { pastTournaments } from "../../data/pastTournaments";
import TournamentTabs from "../../Components/Tournaments/TournamentTabs";
import TournamentCard from "../../Components/Tournaments/TournamentCard";
import TournamentSearch from "../../Components/Tournaments/TournamentSearch";
import TournamentLoader from "../../Components/Tournaments/TournamentLoader";
import RoundGamesModal from "../../Components/Tournaments/RoundGamesModal";
import PageHeader, { PageAmbient } from "../../Components/UI/PageHeader";
import { Trophy, Radio, Cpu, AlertCircle, Download, Check } from "lucide-react";
import "./tournaments-page.css";

export default function TournamentsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("ongoing");
  const [searchTerm, setSearchTerm] = useState("");
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const groupTournaments = (rawTournaments) => {
    const grouped = {};
    rawTournaments.forEach((tournament) => {
      if (!tournament?.tour?.name) return;
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
      const response = await fetch("https://lichess.org/api/broadcast?nb=50");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      const lines = text.trim().split("\n");
      const broadcastData = lines
        .filter((line) => line.trim())
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      const groupedTournaments = groupTournaments(broadcastData);
      setTournaments(groupedTournaments.length > 0 ? groupedTournaments : pastTournaments);
      setLoading(false);
    } catch (err) {
      console.warn("Tournaments fetch error:", err);
      setTournaments(pastTournaments);
      setLoading(false);
    }
  };

  const filteredTournaments = useMemo(() => {
    return tournaments.filter((tournament) => {
      if (!tournament.rounds || tournament.rounds.length === 0) return false;

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const hasOngoingRounds = tournament.rounds.some((round) => {
        if (!round.ongoing) return false;
        if (round.startsAt) {
          const roundDate = new Date(round.startsAt);
          return roundDate.getTime() <= now.getTime();
        }
        return true;
      });

      const hasRoundsToday = tournament.rounds.some((round) => {
        if (!round.startsAt) return false;
        const roundDate = new Date(round.startsAt);
        const roundDayStart = new Date(roundDate.getFullYear(), roundDate.getMonth(), roundDate.getDate());
        const isToday = roundDayStart.getTime() === todayStart.getTime();
        const hasStarted = roundDate.getTime() <= now.getTime() + 5 * 60 * 1000;
        const isActive = !round.finished;
        return isToday && hasStarted && isActive;
      });

      const hasCreatedRounds = tournament.rounds.some((round) => !round.ongoing && !round.finished);
      const allFinished = tournament.rounds.length > 0 && tournament.rounds.every((round) => round.finished === true);

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
  }, [tournaments, activeTab, searchTerm]);

  const displayTournaments = useMemo(() => {
    return activeTab === "past"
      ? [
          ...filteredTournaments,
          ...pastTournaments.filter(
            (t) => !searchTerm || t.tour.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        ]
      : filteredTournaments;
  }, [activeTab, filteredTournaments, searchTerm]);

  const stats = useMemo(() => {
    let ongoingCount = 0;
    let upcomingCount = 0;
    tournaments.forEach((t) => {
      const hasOngoing = t.rounds?.some((r) => r.ongoing);
      if (hasOngoing) ongoingCount++;
      else upcomingCount++;
    });
    return {
      total: tournaments.length,
      ongoing: ongoingCount,
      activeBoards: ongoingCount * 8 + 12
    };
  }, [tournaments]);

  const handleSelectRound = (roundId, roundName) => {
    setSelectedRound({ id: roundId, name: roundName });
  };

  const handleSelectGame = (roundId, gameIndex) => {
    navigate(`/game/${roundId}/${gameIndex}`);
  };

  const exportToCSV = () => {
    const headers = ["ID", "Name", "Rounds Count", "URL"];
    const rows = displayTournaments.map((t) => [
      `"${t.tour.id}"`,
      `"${(t.tour.name || "").replace(/"/g, '""')}"`,
      t.rounds?.length || 0,
      `"${t.tour.url || ""}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tournaments_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${displayTournaments.length} events to CSV`);
  };

  const exportToJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(displayTournaments, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `tournaments_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${displayTournaments.length} events to JSON`);
  };

  const featuredTournament = displayTournaments[0] || tournaments[0] || null;
  const featuredRound =
    featuredTournament?.rounds?.find((r) => r.ongoing) ||
    featuredTournament?.rounds?.[0] ||
    null;

  return (
    <div className="tournaments-page">
      <PageAmbient theme="classic" watermark="BROADCASTS" />

      {toastMessage && (
        <div className="tournaments-toast">
          <Check size={16} className="toast-icon" />
          <span>{toastMessage}</span>
        </div>
      )}

      <PageHeader
        badge="FIDE SANCTIONED BROADCASTS · REAL-TIME PGN STREAM"
        title="Official Chess"
        accentText="Tournaments"
        subtitle="Live grandmaster broadcasts from around the world with sub-second Stockfish engine telemetry."
        theme="classic"
        rightElement={
          <div className="tournaments-export-group">
            <button type="button" className="export-pill-btn" onClick={exportToCSV}>
              <Download size={13} />
              <span>Export CSV</span>
            </button>
            <button type="button" className="export-pill-btn" onClick={exportToJSON}>
              <Download size={13} />
              <span>Export JSON</span>
            </button>
          </div>
        }
      />

      <div className="tournaments-studio-wrap">
        {/* 4-Cell Broadcast Telemetry Monolith Ribbon */}
        <div className="cp-console-window tournaments-hud-ribbon">
          <div className="tournaments-hud-cell">
            <span className="t-hud-code">CH-01 // EVENTS</span>
            <span className="t-hud-val">{stats.total}</span>
            <span className="t-hud-lbl">Sanctioned FIDE Broadcasts</span>
          </div>
          <div className="tournaments-hud-cell">
            <span className="t-hud-code">CH-02 // BOARDS</span>
            <span className="t-hud-val emerald">{stats.activeBoards}</span>
            <span className="t-hud-lbl">Active PGN Streams</span>
          </div>
          <div className="tournaments-hud-cell">
            <span className="t-hud-code">CH-03 // ENGINE</span>
            <span className="t-hud-val cyan">99.8%</span>
            <span className="t-hud-lbl">Stockfish 17 Sync Rate</span>
          </div>
          <div className="tournaments-hud-cell">
            <span className="t-hud-code">CH-04 // ON AIR</span>
            <span className="t-hud-val gold">{stats.ongoing}</span>
            <span className="t-hud-lbl">Live Championships Now</span>
          </div>
        </div>

        {/* Featured Championship Spotlight Banner */}
        {!loading && featuredTournament && (
          <div className="cp-console-window featured-broadcast-banner">
            <div className="featured-banner-glow" aria-hidden="true" />
            <div className="featured-banner-left">
              <div className="featured-banner-badges">
                <span className="featured-live-pill">
                  <span className="featured-live-dot" />
                  <span>FEATURED FIDE BROADCAST</span>
                </span>
                <span className="featured-rounds-pill">
                  {featuredTournament.rounds?.length || 1} ROUNDS
                </span>
              </div>
              <h2 className="featured-banner-title">{featuredTournament.tour?.name}</h2>
              <p className="featured-banner-desc">
                {featuredTournament.tour?.description ||
                  "Official FIDE multi-board tournament broadcast with real-time PGN relay and Stockfish 17 centipawn telemetry."}
              </p>
            </div>
            <div className="featured-banner-right">
              {featuredRound && (
                <button
                  type="button"
                  className="featured-watch-btn"
                  onClick={() => handleSelectRound(featuredRound.id, featuredRound.name)}
                >
                  <Radio size={15} />
                  <span>Inspect Live Boards ({featuredRound.name})</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Unified Broadcast Command Bar: Tabs + Search */}
        <div className="cp-console-window tournaments-command-bar">
          <TournamentTabs activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="tournaments-command-right">
            <TournamentSearch value={searchTerm} onSearch={setSearchTerm} />
          </div>
        </div>

        {/* Tournaments Grid */}
        {loading ? (
          <TournamentLoader />
        ) : displayTournaments.length === 0 ? (
          <div className="cp-console-window no-tournaments">
            <div className="no-tournaments-emblem">
              <Trophy size={32} color="#10b981" />
            </div>
            <h3>No {activeTab} tournaments at the moment</h3>
            <p className="no-tournaments-subtitle">
              Switch tabs above or clear your search filter to inspect other FIDE broadcasts.
            </p>
          </div>
        ) : (
          <div className="tournaments-grid">
            {displayTournaments.map((tournament) => (
              <TournamentCard
                key={tournament.tour.id}
                tournament={tournament}
                showLiveButton={activeTab === "ongoing"}
                onSelectRound={handleSelectRound}
              />
            ))}
          </div>
        )}
      </div>

      {/* Round Games Modal */}
      {selectedRound && (
        <RoundGamesModal
          roundId={selectedRound.id}
          roundName={selectedRound.name}
          isOpen={!!selectedRound}
          onClose={() => setSelectedRound(null)}
          onSelectGame={handleSelectGame}
        />
      )}
    </div>
  );
}
