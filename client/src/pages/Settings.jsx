import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AppShell from '../components/AppShell/AppShell';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useLanguageStore, getLanguageMeta } from '../store/languageStore';
import api from '../services/api';
import { PREMIUM_PRICE_LABEL } from '../config/pricing';
import {
  Button,
  Card,
  Badge,
  Alert,
  Field,
  inputClass,
  PageHeader,
  EmptyState,
  LoadingState,
  ProgressBar,
  cx,
} from '../components/ui';
import {
  Globe,
  User,
  CreditCard,
  Sun,
  Moon,
  Monitor,
  RefreshCw,
  TriangleAlert,
  CheckCircle2,
  Crown,
  Check,
  Receipt,
} from 'lucide-react';

const TABS = [
  { id: 'languages', icon: Globe, label: 'Languages' },
  { id: 'account', icon: User, label: 'Account' },
  { id: 'billing', icon: CreditCard, label: 'Membership' },
];

const THEMES = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
];

const PERKS = [
  'Unlimited daily sessions',
  '5-turn AI roleplay in Speak',
  'Adaptive difficulty',
  'All 11 languages',
];

export default function Settings() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { languages, regenerateRoadmap, isLoading } = useLanguageStore();

  const [tab, setTab] = useState('languages');
  const [name, setName] = useState(user?.name || '');
  const [notice, setNotice] = useState(null);

  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const [editing, setEditing] = useState(null);
  const [newLevel, setNewLevel] = useState('Basic');
  const [newDays, setNewDays] = useState(30);
  const [regenError, setRegenError] = useState(null);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  useEffect(() => {
    if (tab !== 'billing') return;
    let cancelled = false;
    setLoadingPayments(true);
    api
      .get('/payments/history')
      .then((res) => !cancelled && setPayments(res.data?.data ?? []))
      .catch(() => !cancelled && setPayments([]))
      .finally(() => !cancelled && setLoadingPayments(false));
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const flash = (tone, text) => {
    setNotice({ tone, text });
    setTimeout(() => setNotice(null), 3500);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.patch('/auth/profile', { name, themePreference: theme });
      if (res.data?.user) updateUser(res.data.user);
      flash('positive', 'Profile saved.');
    } catch (err) {
      flash('critical', err.response?.data?.error || 'Couldn’t save your profile.');
    }
  };

  const changeTheme = async (next) => {
    setTheme(next);
    try {
      const res = await api.patch('/auth/profile', { themePreference: next });
      if (res.data?.user) updateUser(res.data.user);
    } catch {
      // Theme still applies locally; syncing it to the profile is best-effort.
    }
  };

  const openRegen = (lang) => {
    setEditing(lang);
    setNewLevel(lang.level || 'Basic');
    setNewDays(lang.goalDurationDays || lang.totalDays || 30);
    setRegenError(null);
  };

  const confirmRegen = async () => {
    if (!editing) return;
    setRegenError(null);
    try {
      await regenerateRoadmap(editing.languageCode, {
        newLevel,
        newGoalDurationDays: parseInt(newDays, 10),
      });
      const label = getLanguageMeta(editing.languageCode).name;
      setEditing(null);
      flash('positive', `${label} roadmap rebuilt from day 1.`);
    } catch (err) {
      setRegenError(err.response?.data?.error || err.message || 'Regeneration failed.');
    }
  };

  return (
    <AppShell className="space-y-6">
      <PageHeader
        title="Settings"
        description="Your languages, your account, and your membership."
      />

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Settings sections"
        className="inline-flex w-full gap-1 overflow-x-auto rounded-xl border border-line bg-surface-inset p-1 sm:w-auto"
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setTab(t.id)}
              className={cx(
                'relative flex min-h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[13px] font-semibold transition-colors sm:flex-none',
                active ? 'text-ink' : 'text-ink-faint hover:text-ink'
              )}
            >
              {active && (
                <motion.span
                  layoutId="settings-tab"
                  className="absolute inset-0 rounded-lg bg-surface shadow-xs"
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                />
              )}
              <t.icon className="relative size-4" aria-hidden="true" />
              <span className="relative">{t.label}</span>
            </button>
          );
        })}
      </div>

      {notice && (
        <Alert
          tone={notice.tone}
          icon={notice.tone === 'positive' ? CheckCircle2 : TriangleAlert}
        >
          {notice.text}
        </Alert>
      )}

      {/* ── Languages ── */}
      {tab === 'languages' &&
        (languages.length === 0 ? (
          <EmptyState
            icon={Globe}
            title="No languages yet"
            description="Add your first language to get a personalised roadmap."
            action={<Button onClick={() => navigate('/onboarding')}>Add a language</Button>}
          />
        ) : (
          <div className="space-y-3">
            {languages.map((lang) => {
              const meta = getLanguageMeta(lang.languageCode);
              const total = lang.totalDays || lang.goalDurationDays || 30;
              const done = lang.completedDays || 0;
              return (
                <Card key={lang.languageCode} className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={cx(
                          'grid size-11 shrink-0 place-items-center rounded-xl font-serif text-xl leading-none',
                          meta.tile
                        )}
                        aria-hidden="true"
                      >
                        {meta.script}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-[15px] font-bold text-ink">{meta.name}</h3>
                          <Badge tone="brand">{lang.level || 'Basic'}</Badge>
                        </div>
                        <p className="tabular mt-0.5 text-[12px] text-ink-faint">
                          {total} days · day {lang.currentDayNumber || 1} · {lang.currentStreak || 0}d streak
                        </p>
                      </div>
                    </div>

                    <Button variant="outline" size="sm" onClick={() => openRegen(lang)} className="shrink-0">
                      <RefreshCw className="size-3.5" aria-hidden="true" />
                      Change level or length
                    </Button>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <ProgressBar
                      value={total ? Math.round((done / total) * 100) : 0}
                      label={`${meta.name} completion`}
                    />
                    <p className="tabular text-[12px] text-ink-faint">
                      {done} of {total} days complete
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        ))}

      {/* ── Account ── */}
      {tab === 'account' && (
        <div className="max-w-lg space-y-6">
          <Card className="p-5">
            <form onSubmit={saveProfile} className="space-y-4">
              <Field label="Full name" htmlFor="name">
                <input
                  id="name"
                  type="text"
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>

              <Field label="Email" htmlFor="email" hint="Your email address can’t be changed.">
                <input id="email" type="email" className={inputClass} value={user?.email || ''} disabled />
              </Field>

              <Button type="submit">Save changes</Button>
            </form>
          </Card>

          <Card className="p-5">
            <h3 className="font-display text-[15px] font-bold text-ink">Appearance</h3>
            <p className="mt-0.5 text-[13px] text-ink-soft">Saved to your profile, so it follows you across devices.</p>

            <div role="radiogroup" aria-label="Theme" className="mt-4 grid grid-cols-3 gap-2">
              {THEMES.map((t) => {
                const active = theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => changeTheme(t.id)}
                    className={cx(
                      'flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-4 transition-[border-color,background-color,box-shadow] duration-200',
                      active
                        ? 'border-brand bg-brand-soft ring-3 ring-[var(--brand-ring)]'
                        : 'border-line bg-surface hover:border-line-strong hover:bg-surface-hover'
                    )}
                  >
                    <t.icon className={cx('size-5', active ? 'text-brand' : 'text-ink-faint')} aria-hidden="true" />
                    <span className={cx('text-[12px] font-bold', active ? 'text-ink' : 'text-ink-soft')}>
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ── Billing ── */}
      {tab === 'billing' && (
        <div className="max-w-2xl space-y-5">
          <Card className={cx('overflow-hidden', user?.isPremium && 'border-accent-300 dark:border-accent-500/40')}>
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={cx(
                    'grid size-12 place-items-center rounded-xl',
                    user?.isPremium ? 'bg-accent-soft text-accent-softfg' : 'bg-surface-inset text-ink-faint'
                  )}
                >
                  <Crown className="size-6" aria-hidden="true" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-bold text-ink">
                      {user?.isPremium ? 'Premium' : 'Free'}
                    </h3>
                    {user?.isPremium && <Badge tone="accent">Lifetime</Badge>}
                  </div>
                  <p className="mt-0.5 text-[13px] text-ink-soft">
                    {user?.isPremium
                      ? `Active since ${new Date(user.premiumSince || user.createdAt).toLocaleDateString()}`
                      : `${user?.freeSessionsUsed ?? 0} of 2 free sessions used`}
                  </p>
                </div>
              </div>

              {!user?.isPremium && (
                <Button variant="accent" onClick={() => navigate('/paywall')} className="shrink-0">
                  <Crown className="size-4" aria-hidden="true" />
                  Upgrade — {PREMIUM_PRICE_LABEL}
                </Button>
              )}
            </div>

            <div className="grid gap-2 border-t border-line p-5 sm:grid-cols-2">
              {PERKS.map((perk) => (
                <div key={perk} className="flex items-center gap-2 text-[13px]">
                  <Check
                    className={cx('size-4 shrink-0', user?.isPremium ? 'text-positive' : 'text-ink-faint')}
                    aria-hidden="true"
                  />
                  <span className={user?.isPremium ? 'text-ink' : 'text-ink-faint'}>{perk}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-[13px] font-bold text-ink">
              <Receipt className="size-4 text-ink-faint" aria-hidden="true" />
              Payment history
            </h3>

            {loadingPayments ? (
              <LoadingState label="Loading transactions…" />
            ) : payments.length === 0 ? (
              <Card className="px-5 py-8 text-center text-[13px] text-ink-faint">No transactions yet.</Card>
            ) : (
              <Card className="overflow-x-auto">
                <table className="w-full min-w-[32rem] text-left text-[13px]">
                  <thead className="border-b border-line text-[11px] uppercase tracking-wider text-ink-faint">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold">Date</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Order</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Amount</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {payments.map((p) => (
                      <tr key={p._id || p.razorpayOrderId}>
                        <td className="px-4 py-3 text-ink-soft">
                          {new Date(p.capturedAt || p.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-ink-faint">{p.razorpayOrderId}</td>
                        <td className="tabular px-4 py-3 font-bold text-ink">₹{(p.amount / 100).toFixed(0)}</td>
                        <td className="px-4 py-3">
                          <Badge
                            tone={
                              p.status === 'captured' ? 'positive' : p.status === 'failed' ? 'critical' : 'caution'
                            }
                          >
                            {p.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ── Regenerate modal ── */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            role="dialog"
            aria-modal="true"
            aria-label="Regenerate roadmap"
            onClick={(e) => e.target === e.currentTarget && !isLoading && setEditing(null)}
            className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-sand-950/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md rounded-2xl border border-line bg-surface-raised shadow-lg"
            >
              <div className="flex items-start gap-3 border-b border-line p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-caution-soft text-caution">
                  <TriangleAlert className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-ink">Rebuild this roadmap?</h3>
                  <p className="mt-0.5 text-[13px] text-ink-soft">
                    {getLanguageMeta(editing.languageCode).name} restarts at day 1. Your practice history and stats
                    are kept.
                  </p>
                </div>
              </div>

              <div className="space-y-4 p-5">
                {regenError && (
                  <Alert tone="critical" icon={TriangleAlert}>
                    {regenError}
                  </Alert>
                )}

                <Field label="Level" htmlFor="regen-level">
                  <select
                    id="regen-level"
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value)}
                    className={cx(inputClass, 'cursor-pointer')}
                  >
                    <option value="Basic">Basic</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </Field>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="regen-days" className="text-[13px] font-semibold text-ink">
                      Length
                    </label>
                    <span className="tabular font-mono text-[13px] font-bold text-brand">{newDays} days</span>
                  </div>
                  <input
                    id="regen-days"
                    type="range"
                    min={3}
                    max={180}
                    value={newDays}
                    onChange={(e) => setNewDays(parseInt(e.target.value, 10))}
                    className="w-full cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-line p-4">
                <Button variant="ghost" onClick={() => setEditing(null)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button variant="accent" onClick={confirmRegen} loading={isLoading}>
                  {isLoading ? 'Rebuilding…' : 'Rebuild roadmap'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
