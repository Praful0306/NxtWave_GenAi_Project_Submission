import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Languages,
} from 'lucide-react';
import { useState } from 'react';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import useAuthStore from '../../store/authStore';
import './AppShell.css';

/**
 * AppShell — Responsive navigation wrapper.
 * Desktop: sidebar nav. Mobile: bottom nav + hamburger top bar.
 */
export default function AppShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="app-shell">
      {/* ─── Desktop Sidebar ─── */}
      <aside className="app-shell__sidebar">
        <div className="app-shell__sidebar-header">
          <div className="app-shell__logo">
            <Languages size={28} />
            <span>VaaniTutor</span>
          </div>
        </div>

        <nav className="app-shell__nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `app-shell__nav-item ${isActive ? 'app-shell__nav-item--active' : ''}`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="app-shell__sidebar-footer">
          <ThemeToggle />
          <div className="app-shell__user-info">
            <span className="app-shell__user-name">{user?.name || 'User'}</span>
            <span className="app-shell__user-email">{user?.email || ''}</span>
          </div>
          <button className="btn-ghost app-shell__logout" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* ─── Mobile Top Bar ─── */}
      <header className="app-shell__topbar">
        <div className="app-shell__logo">
          <Languages size={24} />
          <span>VaaniTutor</span>
        </div>

        <div className="app-shell__topbar-actions">
          <ThemeToggle />
          <button
            className="btn-ghost"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* ─── Mobile Slide-down Menu ─── */}
      {mobileMenuOpen && (
        <div className="app-shell__mobile-menu animate-fade-in">
          <div className="app-shell__mobile-user">
            <span className="app-shell__user-name">{user?.name || 'User'}</span>
            <span className="app-shell__user-email">{user?.email || ''}</span>
          </div>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `app-shell__nav-item ${isActive ? 'app-shell__nav-item--active' : ''}`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
          <button className="btn-ghost app-shell__logout" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      )}

      {/* ─── Main Content ─── */}
      <main className="app-shell__main">
        <Outlet />
      </main>

      {/* ─── Mobile Bottom Nav ─── */}
      <nav className="app-shell__bottomnav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `app-shell__bottomnav-item ${isActive ? 'app-shell__bottomnav-item--active' : ''}`
            }
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
