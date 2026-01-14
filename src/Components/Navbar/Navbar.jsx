import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./navbar.css";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.user-menu-container')) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [userMenuOpen]);

  const handleLinkClick = () => {
    setOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className={`chess-navbar ${open ? "slide-open" : ""}`} role="navigation">
      <div className="chess-navbar__left">
        <div className="chess-navbar__logo">♞ ChessPulse</div>
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
          <li role="none">
            <Link role="menuitem" to="/" className={location.pathname === "/" ? "active" : ""} onClick={handleLinkClick}>Home</Link>
          </li>
          <li role="none">
            <Link role="menuitem" to="/tournaments" className={location.pathname === "/tournaments" ? "active" : ""} onClick={handleLinkClick}>Tournaments</Link>
          </li>
          <li role="none">
            <Link role="menuitem" to="/puzzles" className={location.pathname === "/puzzles" ? "active" : ""} onClick={handleLinkClick}>Puzzles</Link>
          </li>
          <li role="none">
            <Link role="menuitem" to="/puzzles/curated" className={location.pathname === "/puzzles/curated" ? "active" : ""} onClick={handleLinkClick}>Pulse AI</Link>
          </li>
          <li role="none">
            <Link role="menuitem" to="/play/online" className={location.pathname === "/play/online" ? "active" : ""} onClick={handleLinkClick}>Play</Link>
          </li>

          <li
            onClick={() => { setTheme(theme === "dark" ? "light" : "dark"); }}
            role="none"
            tabIndex={0}
          >
            <span className="theme-toggle-icon" role="menuitem">{theme === "dark" ? "🌙" : "☀️"}</span>
          </li>

          {isAuthenticated ? (
            <li role="none" className="user-menu-container">
              <button
                className="user-avatar-btn"
                onClick={(e) => { e.stopPropagation(); setUserMenuOpen(!userMenuOpen); }}
                aria-label="User menu"
              >
                <img
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username}&background=random`}
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
                    <img src={user?.avatar} alt={user?.username} className="user-avatar-large" />
                    <div>
                      <div className="user-name">{user?.username}</div>
                      <div className="user-email">{user?.email}</div>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link to="/profile" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                    Profile
                  </Link>
                  <button className="dropdown-item logout-btn" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </li>
          ) : (
            <li role="none">
              <Link to="/signin" className="auth-btn signin-btn" onClick={handleLinkClick}>Sign In</Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}