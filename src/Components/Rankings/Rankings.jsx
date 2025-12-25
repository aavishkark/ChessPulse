import { useEffect, useState } from "react";
import axios from "axios";
import "./rankings.css";
import fide from "../../assets/fide.jpg";

const ENDPOINTS = {
  general: {
    standard: "https://2700chess.com/ajax/index-json?sort=standard&per-page=100",
    rapid: "https://2700chess.com/ajax/index-json?sort=live_rapid_pos&per-page=100",
    blitz: "https://2700chess.com/ajax/index-json?sort=live_blitz_pos&per-page=100",
    juniors: "https://2700chess.com/ajax/index-json?sort=live_juniors_pos&per-page=100"
  },
  women: {
    standard: "https://2700chess.com/ajax/index-json-women?sort=standard&per-page=100",
    rapid: "https://2700chess.com/ajax/index-json-women?sort=live_rapid_pos&per-page=100",
    blitz: "https://2700chess.com/ajax/index-json-women?sort=live_blitz_pos&per-page=100",
    girls: "https://2700chess.com/ajax/index-json-women?sort=live_girls_pos&per-page=100"
  }
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
          console.warn("Unexpected API response:", responseData);
          setPlayers([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching rankings:", err);
        setPlayers([]);
      })
      .finally(() => setLoading(false));
  }, [section, type]);

  return (
    <section className="rankings-wrapper">
      <header className="rankings-header">
        <div className="header-title">
          <h2>World Rankings</h2>
          <span className="live-badge">● LIVE</span>
        </div>
        <div className="rankings-controls">
          <div className="segment-group">
            {["general", "women"].map((s) => (
              <button
                key={s}
                className={`segment-btn ${section === s ? "active" : ""}`}
                onClick={() => setSection(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <div className="segment-group">
            {Object.keys(ENDPOINTS[section]).map((t) => (
              <button
                key={t}
                className={`segment-btn ${type === t ? "active" : ""}`}
                onClick={() => setType(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>
      <div className="rankings-table-container">
        <div className="table-row table-head">
          <div className="col-rank">#</div>
          <div className="col-player">Player</div>
          <div className="col-rating">Rating</div>
          <div className="col-diff">Change</div>
        </div>
        {loading && (
          <div className="skeleton-container">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="skeleton-row"></div>
            ))}
          </div>
        )}
        <div className="table-body">
          {!loading && Array.isArray(players) && players.length > 0 ? (
            players.slice(0, 30).map((p) => {
              const isFide = p.flag === "ff" || p.country_name.includes("FIDE");

              const flagSrc = isFide
                ? fide
                : `https://flagsapi.com/${p.flag ? p.flag.toUpperCase() : 'XX'}/flat/32.png`;

              const displayCountry = isFide ? "FIDE" : p.country_name;

              return (
                <div key={p.fideid || Math.random()} className="table-row player-row">

                  <div className="col-rank">
                    <span className={`rank-number rank-${p.live_pos}`}>
                      {p.live_pos}
                    </span>
                  </div>

                  <div className="col-player">
                    <img
                      className="player-flag"
                      src={flagSrc}
                      alt={displayCountry}
                      onError={(e) => {
                        if (!isFide) e.target.style.display = "none";
                      }}
                    />
                    <div className="player-info">
                      <span className="player-name">{p.name}</span>
                      <span className="player-meta">
                        {displayCountry} • {p.age} y/o
                      </span>
                    </div>
                  </div>

                  <div className="col-rating">
                    {p.raiting}
                  </div>

                  <div className="col-diff">
                    <span className={`diff-tag ${p.raitingDiff > 0 ? "up" : p.raitingDiff < 0 ? "down" : "neutral"
                      }`}>
                      {p.raitingDiff > 0 ? `+${p.raitingDiff}` : p.raitingDiff}
                    </span>

                    {p.pos_change && (
                      <span className={`pos-change ${p.pos_change.includes("↑") ? "up" : "down"}`}>
                        {p.pos_change}
                      </span>
                    )}
                  </div>

                </div>
              );
            })
          ) : (
            !loading && <div className="no-data">No data available for this category.</div>
          )}
        </div>
      </div>
    </section>
  );
}