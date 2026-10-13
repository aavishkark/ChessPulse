import React from 'react';
import { Link } from 'react-router-dom';
import './page-header.css';

/**
 * Clean architectural ambient background layer with radial spotlight,
 * perspective grid floor, and subtle typographic watermark.
 */
export function PageAmbient({
  theme = 'classic',
  watermark = 'CHESSPULSE',
}) {
  const resolvedTheme = theme === 'engine' ? 'blitz' : theme;
  return (
    <div className={`cp-page-ambient theme-${resolvedTheme}`} aria-hidden="true">
      <div className="cp-ambient-glow cp-ambient-glow-1" />
      <div className="cp-ambient-glow cp-ambient-glow-2" />
      <div className="cp-ambient-grid" />
      {watermark && <div className="cp-ambient-watermark">{watermark}</div>}
    </div>
  );
}

/**
 * Lumora × Soda Editorial Split Page Header used across all subpages.
 */
export default function PageHeader({
  badge = 'LIVE TELEMETRY · STOCKFISH 17 WASM',
  badgeColor,
  title,
  accentText,
  accent,
  titleAccent,
  subtitle,
  backTo,
  backLabel = 'Back',
  theme = 'classic',
  rightElement = null,
}) {
  const resolvedAccent = accentText || accent || titleAccent;
  const resolvedTheme =
    theme === 'engine' || badgeColor === 'violet'
      ? 'blitz'
      : badgeColor === 'gold'
      ? 'gold'
      : badgeColor === 'emerald'
      ? 'classic'
      : theme;

  return (
    <header className={`cp-page-header theme-${resolvedTheme}`}>
      <div className="cp-page-header-topbar">
        <div className="cp-header-top-left">
          {backTo && (
            <Link to={backTo} className="cp-back-pill">
              <span className="cp-back-arrow">←</span>
              <span>{backLabel}</span>
            </Link>
          )}
          <div className="cp-status-pill">
            <span className="cp-status-dot" />
            <span>{badge}</span>
          </div>
        </div>
        {rightElement && <div className="cp-page-header-actions">{rightElement}</div>}
      </div>

      <div className="cp-page-header-split">
        <h1 className="cp-page-title">
          {title}{' '}
          {resolvedAccent && <span className="cp-page-title-accent">{resolvedAccent}</span>}
        </h1>

        {subtitle && <p className="cp-page-subtitle">{subtitle}</p>}
      </div>
    </header>
  );
}
