import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState("dark");
  const location = useLocation();

  const pieces = ["Sicilian Defense", "King's Gambit", "French Defense", "Queen's Indian", "Ruy Lopez", "Caro-Kann"];

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open]);

  const handleLinkClick = () => {
    setOpen(false);
  };

  return (
    <nav className={`chess-navbar ${open ? "slide-open" : ""}`} role="navigation">
      <div className="chess-navbar__left">
        <div className="chess-navbar__logo">♞ ChessPulse</div>
      </div>

      <div className="chess-navbar__right">
        <button
          className="chess-navbar__toggle"
          onClick={() => { console.log(1); setOpen(!open); }}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

        <ul className={`chess-navbar__links ${open ? "active" : ""}`} role="menu">
          <li role="none">
            <Link role="menuitem" to="/" className={location.pathname === "/" ? "active" : ""} onClick={handleLinkClick}>Home</Link>
          </li>
          <li role="none">
            <Link role="menuitem" to="/tournaments" className={location.pathname === "/tournaments" ? "active" : ""} onClick={handleLinkClick}>Tournaments</Link>
          </li>
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