import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useLanguageStore } from '../store/languageStore';
import { Globe, Sun, Moon, LogOut, Settings, LayoutDashboard, Sparkles, BookOpen } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { languages, activeLanguage, setActiveLanguage } = useLanguageStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            V
          </div>
          <div>
            <div className="font-extrabold text-white text-lg tracking-tight flex items-center gap-1.5">
              VaaniTutor
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Indic
              </span>
            </div>
          </div>
        </Link>

        {/* Right Action Menu */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Language Switcher Dropdown */}
              {languages.length > 0 && (
                <div className="relative">
                  <select
                    value={activeLanguage?.languageCode || ''}
                    onChange={(e) => {
                      const selected = languages.find((l) => l.languageCode === e.target.value);
                      if (selected) setActiveLanguage(selected);
                    }}
                    className="bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-white text-xs font-semibold rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                  >
                    {languages.map((l) => (
                      <option key={l.languageCode} value={l.languageCode}>
                        {l.languageCode} • {l.level} (Day {l.currentDayNumber || 1})
                      </option>
                    ))}
                  </select>
                  <Globe className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}

              {/* Navigation Links */}
              <Link
                to="/dashboard"
                className={`p-2 rounded-xl text-sm font-medium transition ${
                  location.pathname === '/dashboard'
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
                title="Dashboard"
              >
                <LayoutDashboard className="w-4 h-4" />
              </Link>

              {activeLanguage && (
                <Link
                  to={`/roadmap/${activeLanguage.languageCode}`}
                  className={`p-2 rounded-xl text-sm font-medium transition ${
                    location.pathname.startsWith('/roadmap')
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                  title="Active Roadmap"
                >
                  <BookOpen className="w-4 h-4" />
                </Link>
              )}

              <Link
                to="/settings"
                className={`p-2 rounded-xl text-sm font-medium transition ${
                  location.pathname === '/settings'
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
                title="Settings & Languages"
              >
                <Settings className="w-4 h-4" />
              </Link>

              {/* Premium Status Badge or Upgrade Link */}
              {user.isPremium ? (
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-md shadow-amber-500/5 cursor-default"
                  title="VaaniTutor Lifetime Premium Active"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">PREMIUM</span>
                </div>
              ) : (
                <Link
                  to="/paywall"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 transition transform hover:scale-102"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Upgrade</span>
                </Link>
              )}

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition"
                title={`Theme: ${theme}`}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* User Avatar & Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center justify-center">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-red-400 p-2 rounded-xl hover:bg-slate-900 transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-slate-300 hover:text-white text-xs font-semibold hover:bg-slate-900 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/20"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
