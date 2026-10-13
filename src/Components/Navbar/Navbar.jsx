import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { PulseBrandMark } from "../Icons/Icons";
import "./navbar.css";

export default function Navbar({ onOpenSandbox }) {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".user-menu-container")) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [userMenuOpen]);

  const handleLinkClick = () => {
    setOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    navigate("/");
  };

  const isNavActive = (path) => {
    if (path === "/") return location.pathname === "/";
    if (path === "/puzzles") {
      return location.pathname.startsWith("/puzzles") && location.pathname !== "/puzzles/curated";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className={`chess-navbar ${open ? "slide-open" : ""}`} role="navigation">
      <div className="chess-navbar__inner">
        <div className="chess-navbar__left">
          <Link to="/" className="chess-navbar__brand" onClick={handleLinkClick}>
            <span className="chess-navbar__emblem">
              <PulseBrandMark size={22} />
            </span>
            <span className="chess-navbar__logo-text">
              Chess<span className="chess-navbar__logo-accent">Pulse</span>
            </span>
            <span className="chess-navbar__telemetry-tag">
              <span className="chess-navbar__telemetry-dot" />
              SF17
            </span>
          </Link>
        </div>

        <div className="chess-navbar__right">
          <button
            className="chess-navbar__toggle"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>

          <ul className={`chess-navbar__links ${open ? "active" : ""}`} role="menu">
            <li role="none">
              <Link
                role="menuitem"
                to="/"
                className={isNavActive("/") ? "active" : ""}
                onClick={handleLinkClick}
              >
                Home
              </Link>
            </li>
            <li role="none">
              <Link
                role="menuitem"
                to="/analysis"
                className={isNavActive("/analysis") ? "active" : ""}
                onClick={handleLinkClick}
              >
                Analysis
              </Link>
            </li>
            <li role="none">
              <Link
                role="menuitem"
                to="/tournaments"
                className={isNavActive("/tournaments") || isNavActive("/game") ? "active" : ""}
                onClick={handleLinkClick}
              >
                Tournaments
              </Link>
            </li>
            <li role="none">
              <Link
                role="menuitem"
                to="/puzzles"
                className={isNavActive("/puzzles") ? "active" : ""}
                onClick={handleLinkClick}
              >
                Puzzles
              </Link>
            </li>
            <li role="none">
              <Link
                role="menuitem"
                to="/puzzles/curated"
                className={location.pathname === "/puzzles/curated" ? "active" : ""}
                onClick={handleLinkClick}
              >
                Pulse AI
              </Link>
            </li>
            <li role="none">
              <Link
                role="menuitem"
                to="/bots"
                className={isNavActive("/bots") ? "active" : ""}
                onClick={handleLinkClick}
              >
                Bots
              </Link>
            </li>
            <li role="none">
              <Link
                role="menuitem"
                to="/play/online"
                className={isNavActive("/play/online") ? "active" : ""}
                onClick={handleLinkClick}
              >
                Play
              </Link>
            </li>
            <li role="none">
              <Link
                role="menuitem"
                to="/customize"
                className={isNavActive("/customize") ? "active" : ""}
                onClick={handleLinkClick}
              >
                Studio
              </Link>
            </li>

            {onOpenSandbox && (
              <li role="none">
                <button
                  type="button"
                  className="navbar-sandbox-pill"
                  onClick={() => {
                    setOpen(false);
                    onOpenSandbox();
                  }}
                >
                  <span>Sandbox</span>
                </button>
              </li>
            )}

            <li role="none">
              <button
                type="button"
                className="theme-toggle-btn"
                onClick={toggleDarkMode}
                aria-label="Toggle color theme"
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                <span className="theme-toggle-icon">{darkMode ? "🌙" : "☀️"}</span>
              </button>
            </li>

            {isAuthenticated ? (
              <li role="none" className="user-menu-container">
                <button
                  className="user-avatar-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserMenuOpen(!userMenuOpen);
                  }}
                  aria-label="User menu"
                >
                  <img
                    src={
                      user?.avatar ||
                      `https://ui-avatars.com/api/?name=${user?.username}&background=random`
                    }
                    alt={user?.username}
                    className="user-avatar"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${user?.username}&background=random`;
                    }}
                  />
                </button>

                {userMenuOpen && (
                  <div className="user-dropdown">
                    <div className="user-info">
                      <img
                        src={user?.avatar}
                        alt={user?.username}
                        className="user-avatar-large"
                      />
                      <div>
                        <div className="user-name">{user?.username}</div>
                        <div className="user-email">{user?.email}</div>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <Link
                      to="/profile"
                      className="dropdown-item"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Profile & Telemetry
                    </Link>
                    <Link
                      to="/customize"
                      className="dropdown-item"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Board Studio
                    </Link>
                    <button className="dropdown-item logout-btn" onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                )}
              </li>
            ) : (
              <li role="none">
                <Link
                  to="/signin"
                  className="auth-btn signin-btn"
                  onClick={handleLinkClick}
                >
                  Sign In
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}