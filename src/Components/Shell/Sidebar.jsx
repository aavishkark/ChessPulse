import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  Trophy,
  Zap,
  Sparkles,
  Bot,
  Swords,
  BarChart3,
  User,
  Palette,
  LogOut,
  LogIn,
  ChevronRight,
  FlaskConical,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const NAV_ITEMS = [
  { name: 'Analysis Workstation', path: '/analysis', icon: Activity, badge: 'Stockfish' },
  { name: 'Live Tournaments', path: '/tournaments', icon: Trophy, badge: 'Live' },
  { name: 'Tactical Puzzles', path: '/puzzles', icon: Zap },
  { name: 'Pulse AI Coach', path: '/puzzles/curated', icon: Sparkles, badge: 'AI' },
  { name: 'Bot Arena', path: '/bots', icon: Bot },
  { name: 'Play Online', path: '/play/online', icon: Swords },
  { name: 'Leaderboard', path: '/puzzles/leaderboard', icon: BarChart3 },
  { name: 'Personal Profile', path: '/profile', icon: User },
  { name: 'Board Studio', path: '/customize', icon: Palette }
];

export default function Sidebar({ isOpen, onClose, onOpenSandbox }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-[#0B0F19] border-r border-gray-200 dark:border-white/[0.08] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Brand Section */}
        <div className="p-5 border-b border-gray-200 dark:border-white/[0.08] flex items-center justify-between">
          <NavLink to="/" onClick={onClose} className="flex flex-col group">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-violet-500/30">
                <Activity className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-gray-100 group-hover:text-violet-500 transition-colors">
                ChessPulse
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-[10px] font-mono tracking-wider uppercase font-semibold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                GRANDMASTER ENGINE
              </span>
            </div>
          </NavLink>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Recruiter Sandbox Quick Banner */}
        <div className="p-3">
          <button
            onClick={() => {
              if (onClose) onClose();
              if (onOpenSandbox) onOpenSandbox();
            }}
            className="w-full text-left p-3 rounded-xl bg-gradient-to-r from-violet-500/15 via-indigo-500/10 to-cyan-500/10 hover:from-violet-500/25 hover:via-indigo-500/20 hover:to-cyan-500/20 border border-violet-500/25 transition-all group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-violet-600 dark:text-violet-300 font-semibold text-xs tracking-wide">
                <FlaskConical className="w-3.5 h-3.5 text-violet-500 animate-bounce" />
                <span>Recruiter Sandbox</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              1-Click GM match simulations & engine pipelines
            </p>
          </button>
        </div>

        {/* Middle Navigation Section */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-3 pb-1.5 pt-1 text-[11px] font-mono font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Platform Modules
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400 font-semibold border-r-2 border-violet-500 shadow-sm shadow-violet-500/10'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.04] hover:text-gray-900 dark:hover:text-gray-200'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                    item.badge === 'Live'
                      ? 'bg-rose-500/15 text-rose-500 border border-rose-500/20 animate-pulse'
                      : item.badge === 'Stockfish'
                      ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                      : 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/20'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-gray-200 dark:border-white/[0.08] space-y-2">
          {isAuthenticated ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="truncate">
                  <div className="text-xs font-medium text-gray-900 dark:text-gray-200 truncate">
                    {user?.username || 'Player'}
                  </div>
                  <div className="text-[10px] font-mono text-gray-400 truncate">
                    {user?.email || 'Verified GM'}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                if (onClose) onClose();
                navigate('/signin');
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/[0.08] transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </button>
          )}

          <div className="px-2 pt-1 flex items-center justify-between text-[10px] font-mono text-gray-400">
            <span>STOCKFISH v17.1</span>
            <span className="flex items-center gap-1 text-emerald-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              WASM READY
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
