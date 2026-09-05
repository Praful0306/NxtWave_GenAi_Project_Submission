import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AppShell from '../components/AppShell/AppShell';
import LanguageCard from '../components/LanguageCard/LanguageCard';
import OnboardingWizard from '../components/OnboardingWizard/OnboardingWizard';
import { useLanguageStore, SUPPORTED_LANGUAGES, getLanguageMeta } from '../store/languageStore';
import { useAuthStore } from '../store/authStore';
import {
  Button,
  Card,
  Badge,
  StatTile,
  Skeleton,
  Eyebrow,
  CountUp,
  stagger,
  riseItem,
  cx,
} from '../components/ui';
import {
  Plus,
  Globe,
  Flame,
  Target,
  CalendarCheck,
  Mic,
  Puzzle,
  ListChecks,
  ArrowRight,
  X,
  Crown,
} from 'lucide-react';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const SESSION_STEPS = [
  {
    icon: Mic,
    step: '01',
    title: 'Speak',
    body: 'Say the day’s phrase out loud. You get a transcript, a correction and a fluency score in seconds.',
  },
  {
    icon: Puzzle,
    step: '02',
    title: 'Word order',
    body: 'Rebuild the same sentence from scrambled words — the fastest way to internalise Indic syntax.',
  },
  {
    icon: ListChecks,
    step: '03',
    title: 'Recall quiz',
    body: 'A short retention check. Finish it and tomorrow’s day unlocks.',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { languages, isLoading, fetchLanguages } = useLanguageStore();

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardLang, setWizardLang] = useState('kn-IN');

  const stats = useMemo(() => {
    const streak = languages.reduce((m, l) => Math.max(m, l.currentStreak || 0), 0);
    const sessions = languages.reduce((a, l) => a + (l.sessionsCount || 0), 0);
    const days = languages.reduce((a, l) => a + (l.completedDays || 0), 0);
    return { streak, sessions, days };
  }, [languages]);

  const openWizard = (code) => {
    setWizardLang(code);
    setWizardOpen(true);
  };

  const hasLanguages = languages.length > 0;
  const showSkeleton = isLoading && !hasLanguages;

  return (
    <AppShell width="wide" className="space-y-8">
      {/* ── Masthead ── */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Eyebrow>{greeting()}</Eyebrow>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {user?.name?.split(' ')[0] || 'Learner'}
            <span className="text-brand">.</span>
          </h1>
          <p className="max-w-xl text-sm text-ink-soft">
            {hasLanguages
              ? 'Pick up where you left off — every session resumes at the exact activity you stopped on.'
              : 'Choose a language and we’ll build you a day-by-day speaking plan.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {user && !user.isPremium && (
            <Button variant="outline" onClick={() => navigate('/paywall')}>
              <Crown className="size-4 text-accent" aria-hidden="true" />
              Go Premium
            </Button>
          )}
          <Button onClick={() => openWizard('kn-IN')}>
            <Plus className="size-4" aria-hidden="true" />
            Add a language
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      >
        {[
          { label: 'Active languages', value: <CountUp value={languages.length} />, icon: Globe, tone: 'brand' },
          { label: 'Longest streak', value: <CountUp value={`${stats.streak}d`} />, icon: Flame, tone: 'accent' },
          { label: 'Sessions done', value: <CountUp value={stats.sessions} />, icon: Target, tone: 'positive' },
          { label: 'Days completed', value: <CountUp value={stats.days} />, icon: CalendarCheck, tone: 'neutral' },
        ].map((s) => (
          <motion.div key={s.label} variants={riseItem}>
            <StatTile {...s} />
          </motion.div>
        ))}
      </motion.div>

      {/* ── Roadmaps ── */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">
              {hasLanguages ? 'Your roadmaps' : 'Start a language'}
            </h2>
            <p className="mt-0.5 text-[13px] text-ink-soft">
              {hasLanguages
                ? 'Each language keeps its own pace, level and streak.'
                : 'Kannada, Hindi and English are our most thoroughly tested.'}
            </p>
          </div>
          {hasLanguages && (
            <Badge tone="neutral">
              <span className="tabular">{languages.length}</span> active
            </Badge>
          )}
        </div>

        {showSkeleton ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Card key={i} className="space-y-4 p-5">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
                <Skeleton className="h-1.5 w-full" />
                <Skeleton className="h-9 w-full" />
              </Card>
            ))}
          </div>
        ) : hasLanguages ? (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {languages.map((lang) => (
              <motion.div key={lang.languageCode} variants={riseItem}>
                <LanguageCard userLanguage={lang} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {SUPPORTED_LANGUAGES.map((lang) => {
              const meta = getLanguageMeta(lang.code);
              return (
                <motion.button
                  key={lang.code}
                  variants={riseItem}
                  type="button"
                  onClick={() => openWizard(lang.code)}
                  className="group flex cursor-pointer flex-col gap-3 rounded-2xl border border-line bg-surface p-4 text-left transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={cx(
                        'grid size-11 place-items-center rounded-xl font-serif text-xl leading-none',
                        meta.tile
                      )}
                      aria-hidden="true"
                    >
                      {lang.script}
                    </span>
                    {lang.tier === 1 && <Badge tone="brand">Tier 1</Badge>}
                  </div>

                  <div>
                    <h3 className="font-display text-[15px] font-bold text-ink">{lang.name}</h3>
                    <p className="text-[12px] text-ink-faint">{lang.nativeName}</p>
                  </div>

                  <p className="rounded-lg bg-surface-inset px-3 py-2 text-[13px] leading-relaxed text-ink-soft">
                    {lang.sample}
                  </p>

                  <span className="mt-auto inline-flex items-center gap-1 text-[12px] font-bold text-brand">
                    Start {lang.name}
                    <ArrowRight
                      className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </section>

      {/* ── How a session works ── */}
      {!hasLanguages && !showSkeleton && (
        <section className="space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">How a day works</h2>
            <p className="mt-0.5 text-[13px] text-ink-soft">
              Three short activities, in order. Leave any time — you come back to the same spot.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {SESSION_STEPS.map((s) => (
              <Card key={s.step} className="p-5">
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand-softfg">
                    <s.icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="tabular font-mono text-[11px] font-bold text-ink-faint">{s.step}</span>
                </div>
                <h3 className="mt-4 font-display text-base font-bold text-ink">{s.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{s.body}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ── Add-language modal ── */}
      <AnimatePresence>
        {wizardOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-sand-950/60 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Add a language"
            onClick={(e) => e.target === e.currentTarget && setWizardOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              className="relative mx-auto my-8 w-full max-w-3xl"
            >
              <button
                type="button"
                onClick={() => setWizardOpen(false)}
                aria-label="Close"
                className="absolute -top-2 right-0 z-10 grid size-9 cursor-pointer place-items-center rounded-lg border border-line bg-surface text-ink-soft transition-colors hover:text-ink sm:-right-2"
              >
                <X className="size-4" />
              </button>

              <OnboardingWizard
                isModal
                initialLanguage={wizardLang}
                onComplete={(code) => {
                  setWizardOpen(false);
                  fetchLanguages();
                  navigate(`/roadmap/${code}`);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
