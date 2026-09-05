import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore, SUPPORTED_LANGUAGES } from '../store/languageStore';
import Brandmark from './Brandmark';
import ThemeToggle from './ThemeToggle/ThemeToggle';
import { Button, Badge, cx } from './ui';
import {
  LayoutDashboard,
  Map,
  TrendingUp,
  Settings as SettingsIcon,
  LogOut,
  Crown,
  Sparkles,
  Flame,
  ChevronDown,
  Check,
  Menu,
  X,
} from 'lucide-react';

const NAV_LINKS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/roadmap', icon: Map, label: 'Roadmap', needsLang: true },
  { path: '/progress', icon: TrendingUp, label: 'Progress', needsLang: true },
  { path: '/settings', icon: SettingsIcon, label: 'Settings' },
];

function useClickOutside(ref, onClose) {
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const onEsc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', onEsc);
    };
  }, [ref, onClose]);
}

/** Language switcher — a real menu rather than a native select, so the native script renders properly. */
function LanguagePicker() {
  const { languages, activeLanguage, setActiveLanguage } = useLanguageStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));

  if (languages.length === 0) return null;

  const meta = (code) => SUPPORTED_LANGUAGES.find((l) => l.code === code);
  const current = meta(activeLanguage?.languageCode);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface-hover"
      >
        <span className="font-serif text-base leading-none text-brand">{current?.script ?? '—'}</span>
        <span className="hidden lg:inline">{current?.name ?? 'Language'}</span>
        <ChevronDown
          className={cx('size-3.5 text-ink-faint transition-transform duration-200', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 z-50 mt-2 w-60 origin-top-right overflow-hidden rounded-xl border border-line bg-surface-raised p-1 shadow-lg"
          >
            {languages.map((lang) => {
              const m = meta(lang.languageCode);
              const selected = lang.languageCode === activeLanguage?.languageCode;
              return (
                <li key={lang.languageCode}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      setActiveLanguage(lang);
                      setOpen(false);
                    }}
                    className={cx(
                      'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors',
                      selected ? 'bg-brand-soft' : 'hover:bg-surface-hover'
                    )}
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-inset font-serif text-base text-brand">
                      {m?.script ?? '·'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-ink">
                        {m?.name ?? lang.languageCode}
                      </span>
                      <span className="block text-[11px] text-ink-faint">
                        Day {lang.currentDayNumber || 1} · {lang.level || 'Basic'}
                      </span>
                    </span>
                    {selected && <Check className="size-4 shrink-0 text-brand" aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function AccountMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));

  const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="grid size-9 cursor-pointer place-items-center rounded-full bg-brand-700 font-display text-[13px] font-bold text-white transition-transform hover:scale-105 dark:bg-brand-500 dark:text-brand-950"
      >
        {initial}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 z-50 mt-2 w-60 origin-top-right overflow-hidden rounded-xl border border-line bg-surface-raised shadow-lg"
          >
            <div className="border-b border-line px-3.5 py-3">
              <p className="truncate text-[13px] font-semibold text-ink">{user?.name || 'Learner'}</p>
              <p className="truncate text-[12px] text-ink-faint">{user?.email}</p>
              <div className="mt-2">
                {user?.isPremium ? (
                  <Badge tone="accent" icon={Crown}>
                    Premium
                  </Badge>
                ) : (
                  <Badge tone="neutral">
                    {user?.freeSessionsUsed ?? 0} of 2 free sessions used
                  </Badge>
                )}
              </div>
            </div>
            <div className="p-1">
              <Link
                to="/settings"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-surface-hover hover:text-ink"
              >
                <SettingsIcon className="size-4" aria-hidden="true" /> Settings
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-critical transition-colors hover:bg-critical-soft"
              >
                <LogOut className="size-4" aria-hidden="true" /> Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { languages, activeLanguage } = useLanguageStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const resolvePath = (link) =>
    link.needsLang && activeLanguage ? `${link.path}/${activeLanguage.languageCode}` : link.path;

  const visibleLinks = NAV_LINKS.filter((l) => !l.needsLang || activeLanguage);
  const streak = languages.reduce((max, l) => Math.max(max, l.currentStreak || 0), 0);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Brandmark to={user ? '/dashboard' : '/'} />

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {user &&
              visibleLinks.map((link) => {
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={resolvePath(link)}
                    aria-current={active ? 'page' : undefined}
                    className={cx(
                      'relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors',
                      active ? 'text-ink' : 'text-ink-faint hover:text-ink'
                    )}
                  >
                    <link.icon className="size-4" aria-hidden="true" />
                    {link.label}
                    {active && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute inset-x-2 -bottom-[13px] h-0.5 rounded-full bg-brand"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                  </Link>
                );
              })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {streak > 0 && (
                <span
                  className="hidden items-center gap-1.5 rounded-lg bg-accent-soft px-2.5 py-1.5 text-[12px] font-bold text-accent-softfg sm:inline-flex"
                  title={`${streak} day streak`}
                >
                  <Flame className="size-3.5" aria-hidden="true" />
                  <span className="tabular">{streak}</span>
                </span>
              )}

              <div className="hidden sm:block">
                <LanguagePicker />
              </div>

              {!user.isPremium && (
                <Button as={Link} to="/paywall" variant="accent" size="sm" className="hidden sm:inline-flex">
                  <Sparkles className="size-3.5" aria-hidden="true" />
                  Upgrade
                </Button>
              )}

              <div className="hidden lg:block">
                <ThemeToggle size="sm" />
              </div>

              <div className="hidden sm:block">
                <AccountMenu user={user} onLogout={handleLogout} />
              </div>
            </>
          ) : (
            <>
              <ThemeToggle size="sm" className="hidden sm:inline-flex" />
              <Button as={Link} to="/login" variant="ghost" size="sm">
                Sign in
              </Button>
              <Button as={Link} to="/register" size="sm">
                Get started
              </Button>
            </>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className="grid size-10 cursor-pointer place-items-center rounded-lg text-ink-soft transition-colors hover:bg-surface-hover hover:text-ink md:hidden"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-line bg-surface md:hidden"
          >
            <div className="space-y-1 px-4 py-4 sm:px-6">
              {user ? (
                <>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{user.name || 'Learner'}</p>
                      <p className="truncate text-[12px] text-ink-faint">{user.email}</p>
                    </div>
                    <ThemeToggle size="sm" />
                  </div>

                  {visibleLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={resolvePath(link)}
                      className={cx(
                        'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors',
                        isActive(link.path)
                          ? 'bg-brand-soft text-brand-softfg'
                          : 'text-ink-soft hover:bg-surface-hover'
                      )}
                    >
                      <link.icon className="size-4.5" aria-hidden="true" />
                      {link.label}
                    </Link>
                  ))}

                  {!user.isPremium && (
                    <Button as={Link} to="/paywall" variant="accent" className="mt-2 w-full">
                      <Sparkles className="size-4" aria-hidden="true" />
                      Upgrade to Premium
                    </Button>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-critical transition-colors hover:bg-critical-soft"
                  >
                    <LogOut className="size-4.5" aria-hidden="true" /> Sign out
                  </button>
                </>
              ) : (
                <>
                  <ThemeToggle size="sm" className="mb-2" />
                  <Button as={Link} to="/login" variant="outline" className="w-full">
                    Sign in
                  </Button>
                  <Button as={Link} to="/register" className="w-full">
                    Get started
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
