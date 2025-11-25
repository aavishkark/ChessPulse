import { useState, useEffect } from "react";
import "./Navbar.css";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const pieces = ["Sicilian Defense", "King's Gambit", "French Defense", "Queen's Indian", "Ruy Lopez", "Caro-Kann"];

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  const handleSearch = (value) => {
    setQuery(value);
    if (value.trim() === "") {
      setResults([]);
      return;
    }
    setResults(pieces.filter((p) => p.toLowerCase().includes(value.toLowerCase())));
  };

  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open]);

  return (
    <nav className={`chess-navbar ${open ? "slide-open" : ""}`} role="navigation">
      <div className="chess-navbar__left">
        <div className="chess-navbar__logo">♞ ChessPulse</div>
      </div>

      <div className="chess-navbar__center">
        <div className="search-box">
          <input
            type="text"
            placeholder="Add PGN"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            aria-label="Add PGN"
          />
          <button className="search-box-btn">
            Evaluate
          </button>
        </div>
      </div>

      <div className="chess-navbar__right">
        <button
          className="chess-navbar__toggle"
          onClick={() => { setOpen(!open); }}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

        <ul className={`chess-navbar__links ${open ? "active" : ""}`} role="menu">
          <li role="none"><a role="menuitem" href="/">Home</a></li>
          <li role="none"><a role="menuitem" href="/analysis">Tournaments</a></li>
          <li role="none"><a role="menuitem" href="/games">Games</a></li>
          <li role="none"><a role="menuitem" href="/openings">Customize</a></li>
          <li role="none"><a role="menuitem" href="/profile">Profile</a></li>
          <li  
            onClick={() => { setTheme(theme === "dark" ? "light" : "dark"); playClick(); }}
            role="none"
            tabIndex={0}
          >
            <span className="theme-toggle-icon" role="menuitem">{theme === "dark" ? "🌙" : "☀️"}</span>
          </li>
        </ul>
      </div>
    </nav>
  );
}