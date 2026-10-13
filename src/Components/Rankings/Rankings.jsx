import { useEffect, useState } from "react";
import axios from "axios";
import "./rankings.css";
import fide from "../../assets/fide.jpg";
import { Trophy, Globe, TrendingUp, TrendingDown } from "lucide-react";

const ENDPOINTS = {
  general: {
    standard: "https://2700chess.com/ajax/index-json?sort=standard&per-page=100",
    rapid: "https://2700chess.com/ajax/index-json?sort=live_rapid_pos&per-page=100",
    blitz: "https://2700chess.com/ajax/index-json?sort=live_blitz_pos&per-page=100",
    juniors: "https://2700chess.com/ajax/index-json?sort=live_juniors_pos&per-page=100",
  },
  women: {
    standard: "https://2700chess.com/ajax/index-json-women?sort=standard&per-page=100",
    rapid: "https://2700chess.com/ajax/index-json-women?sort=live_rapid_pos&per-page=100",
    blitz: "https://2700chess.com/ajax/index-json-women?sort=live_blitz_pos&per-page=100",
    girls: "https://2700chess.com/ajax/index-json-women?sort=live_girls_pos&per-page=100",
  },
};

export default function Rankings() {
  const [section, setSection] = useState("general");
  const [type, setType] = useState("standard");
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setPlayers([]);

    axios
      .get(ENDPOINTS[section][type])
      .then((res) => {
        const responseData = res.data;

        if (Array.isArray(responseData)) {
          setPlayers(responseData);
        } else if (responseData && Array.isArray(responseData.data)) {
          setPlayers(responseData.data);
        } else {
          setPlayers([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching rankings:", err);
        setPlayers([]);
      })
      .finally(() => setLoading(false));
  }, [section, type]);

  const topThree = players.slice(0, 3);
  const restPlayers = players.slice(3, 10);

  const getFlagInfo = (p) => {
    const isFide =
      p.flag === "ff" || (p.country_name && p.country_name.includes("FIDE"));
    const flagSrc = isFide
      ? fide
      : `https://flagsapi.com/${
          p.flag ? p.flag.toUpperCase() : "XX"
        }/flat/32.png`;
    const displayCountry = isFide ? "FIDE" : p.country_name;
    return { isFide, flagSrc, displayCountry };
  };

  return (
    <section className="cp-studio-section rankings-wrapper">
      <div className="cp-studio-container">
        {/* Lumora Editorial Chapter Header */}
        <div className="cp-chapter-header">
          <div className="cp-chapter-meta">
            <span className="cp-chapter-index">
              <span className="cp-chapter-index-dot" />
              03 // FIDE LEADERBOARD
            </span>
            <span className="cp-chapter-subtag">2700CHESS LIVE FEDERATION FEED</span>
          </div>
          <div className="cp-chapter-main">
            <h2 className="cp-chapter-title">
              World Grandmaster{" "}
              <span className="cp-chapter-title-accent">Standings</span>
            </h2>
            <p className="cp-chapter-desc">
              Live official Elo ratings and real-time point deltas tracking the world&apos;s top 10 competitors across divisions.
            </p>
          </div>
          <div className="cp-chapter-actions">
            <div className="rankings-controls-wrap">
              <div className="segment-group">
                {["general", "women"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`segment-btn ${section === s ? "active" : ""}`}
                    onClick={() => {
                      setSection(s);
                      setType("standard");
                    }}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>

              <div className="segment-group">
                {Object.keys(ENDPOINTS[section]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`segment-btn ${type === t ? "active" : ""}`}
                    onClick={() => setType(t)}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="cp-console-window rankings-card">
            <div className="skeleton-container">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="skeleton-row" />
              ))}
            </div>
          </div>
        ) : players.length > 0 ? (
          <>
            {/* Top-3 Grandmaster Podium Spotlight Cards */}
            <div className="rankings-podium-grid">
              {topThree.map((p, idx) => {
                const { isFide, flagSrc, displayCountry } = getFlagInfo(p);
                const rankLabel = `0${idx + 1}`;
                const tierClass =
                  idx === 0 ? "podium-gold" : idx === 1 ? "podium-silver" : "podium-bronze";

                return (
                  <div key={p.fideid || idx} className={`podium-spotlight-card ${tierClass}`}>
                    <div className="podium-card-top">
                      <span className="podium-rank-pill">
                        <Trophy size={13} />
                        <span>WORLD #{rankLabel}</span>
                      </span>
                      <span
                        className={`diff-pill ${
                          p.raitingDiff > 0
                            ? "diff-up"
                            : p.raitingDiff < 0
                            ? "diff-down"
                            : "diff-neutral"
                        }`}
                      >
                        {p.raitingDiff > 0 ? (
                          <TrendingUp size={12} />
                        ) : p.raitingDiff < 0 ? (
                          <TrendingDown size={12} />
                        ) : null}
                        <span>
                          {p.raitingDiff > 0 ? `+${p.raitingDiff}` : p.raitingDiff || "0.0"}
                        </span>
                      </span>
                    </div>

                    <div className="podium-player-row">
                      <img
                        className="podium-flag-img"
                        src={flagSrc}
                        alt={displayCountry || "Flag"}
                        onError={(e) => {
                          if (!isFide) e.target.style.display = "none";
                        }}
                      />
                      <div>
                        <h3 className="podium-player-name">{p.name}</h3>
                        <span className="podium-player-meta">
                          {displayCountry} {p.age ? `· ${p.age} YRS` : ""}
                        </span>
                      </div>
                    </div>

                    <div className="podium-elo-footer">
                      <span className="podium-elo-label">LIVE FIDE ELO</span>
                      <span className="podium-elo-val">{p.raiting}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ranks #04 — #10 High-Density Telemetry Table */}
            <div className="cp-console-window rankings-card">
              <div className="rankings-table-head">
                <div className="col-rank">RANK</div>
                <div className="col-player">GRANDMASTER</div>
                <div className="col-rating">LIVE ELO</div>
                <div className="col-diff">DELTA</div>
              </div>

              <div className="rankings-table-body">
                {restPlayers.map((p, idx) => {
                  const { isFide, flagSrc, displayCountry } = getFlagInfo(p);
                  const pos = p.live_pos || idx + 4;

                  return (
                    <div key={p.fideid || idx} className="rankings-row-item">
                      <div className="col-rank">
                        <span className="rank-badge">
                          {pos < 10 ? `0${pos}` : pos}
                        </span>
                      </div>

                      <div className="col-player">
                        <img
                          className="player-flag-img"
                          src={flagSrc}
                          alt={displayCountry || "Flag"}
                          onError={(e) => {
                            if (!isFide) e.target.style.display = "none";
                          }}
                        />
                        <div className="player-details">
                          <span className="player-full-name">{p.name}</span>
                          <span className="player-country-meta">
                            {displayCountry} {p.age ? `• ${p.age} y/o` : ""}
                          </span>
                        </div>
                      </div>

                      <div className="col-rating">
                        <span className="rating-mono-val">{p.raiting}</span>
                      </div>

                      <div className="col-diff">
                        <span
                          className={`diff-pill ${
                            p.raitingDiff > 0
                              ? "diff-up"
                              : p.raitingDiff < 0
                              ? "diff-down"
                              : "diff-neutral"
                          }`}
                        >
                          {p.raitingDiff > 0 ? `+${p.raitingDiff}` : p.raitingDiff || "0.0"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="cp-console-window rankings-card">
            <div className="rankings-empty-state">
              <Globe size={28} />
              <span>No rankings data available for this category.</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}