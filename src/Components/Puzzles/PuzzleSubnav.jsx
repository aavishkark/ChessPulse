import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Sparkles,
  Zap,
  Flame,
  TrendingUp,
  Target,
  Cpu,
  BarChart3,
  Trophy
} from 'lucide-react';
import './PuzzleSubnav.css';

const PUZZLE_TABS = [
  {
    path: '/puzzles',
    label: 'Daily Lab',
    tag: 'HUB',
    icon: Sparkles,
    exact: true
  },
  {
    path: '/puzzles/rush',
    label: 'Puzzle Rush',
    tag: 'SPRINT',
    icon: Zap
  },
  {
    path: '/puzzles/survival',
    label: '3-Life Survival',
    tag: 'ENDURANCE',
    icon: Flame
  },
  {
    path: '/puzzles/rating',
    label: 'Rated ELO Track',
    tag: 'COMPETITIVE',
    icon: TrendingUp
  },
  {
    path: '/puzzles/themed',
    label: '11 Motif Lab',
    tag: 'PATTERNS',
    icon: Target
  },
  {
    path: '/puzzles/curated',
    label: 'Pulse AI Set',
    tag: 'NEURAL',
    icon: Cpu
  },
  {
    path: '/puzzles/stats',
    label: 'Analytics',
    tag: 'TELEMETRY',
    icon: BarChart3
  },
  {
    path: '/puzzles/leaderboard',
    label: 'Standings',
    tag: 'TOP 50',
    icon: Trophy
  }
];

export default function PuzzleSubnav({ activeCode }) {
  return (
    <nav className="puzzle-subnav-strip" aria-label="Tactical Training Modes">
      <div className="puzzle-subnav-scroll">
        {PUZZLE_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.exact}
              className={({ isActive }) =>
                `puzzle-subnav-pill ${isActive ? 'active' : ''}`
              }
            >
              <span className="subnav-pill-icon">
                <Icon size={14} />
              </span>
              <span className="subnav-pill-label">{tab.label}</span>
              <span className="subnav-pill-tag">{tab.tag}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
