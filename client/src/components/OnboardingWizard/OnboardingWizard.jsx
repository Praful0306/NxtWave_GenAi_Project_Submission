import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SUPPORTED_LANGUAGES, getLanguageMeta, useLanguageStore } from '../../store/languageStore';
import { Button, Card, Badge, Alert, ProgressBar, cx } from '../ui';
import {
  Globe,
  GraduationCap,
  CalendarRange,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

const LEVELS = [
  {
    id: 'Basic',
    title: 'Starting from scratch',
    blurb: 'Greetings, numbers, polite phrases and the sentences you need to get by.',
  },
  {
    id: 'Intermediate',
    title: 'I can hold a simple conversation',
    blurb: 'Longer sentences, everyday social situations, and speaking with less hesitation.',
  },
  {
    id: 'Advanced',
    title: 'I’m comfortable, I want polish',
    blurb: 'Idiom, register, professional discussion and a more native rhythm.',
  },
];

const PRESETS = [
  { days: 7, label: '1 week', note: 'Crash course' },
  { days: 14, label: '2 weeks', note: 'Steady' },
  { days: 30, label: '30 days', note: 'Recommended' },
  { days: 60, label: '60 days', note: 'Deep dive' },
];

const STEPS = [
  { n: 1, icon: Globe, label: 'Language' },
  { n: 2, icon: GraduationCap, label: 'Level' },
  { n: 3, icon: CalendarRange, label: 'Timeframe' },
];

// Transform only, and no exit stage: each step is keyed so React swaps it
// directly. Waiting on an exit animation can strand the wizard if the browser
// throttles requestAnimationFrame (background/unfocused tab).
const slide = {
  enter: { x: 22 },
  center: { x: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

export default function OnboardingWizard({ onComplete, isModal = false, initialLanguage = 'kn-IN' }) {
  const navigate = useNavigate();
  const { generateRoadmap, isLoading } = useLanguageStore();

  const [step, setStep] = useState(1);
  const [language, setLanguage] = useState(initialLanguage);
  const [level, setLevel] = useState('Basic');
  const [days, setDays] = useState(30);
  const [error, setError] = useState(null);

  const langMeta = getLanguageMeta(language);

  const finish = async () => {
    setError(null);
    try {
      await generateRoadmap({
        languageCode: language,
        level,
        goalDurationDays: Math.min(Math.max(parseInt(days, 10) || 30, 3), 180),
      });
      if (onComplete) onComplete(language);
      else navigate(`/roadmap/${language}`);
    } catch (err) {
      // A raw axios timeout string ("timeout of 15000ms exceeded") tells a
      // learner nothing about what to do next.
      const timedOut = err.code === 'ECONNABORTED' || /timeout/i.test(err.message || '');
      setError(
        err.response?.data?.error ||
          (timedOut
            ? 'That took longer than expected — the service may have been asleep. Press Generate again; the second attempt is usually quick.'
            : 'We couldn’t generate your roadmap. Please try again.')
      );
    }
  };

  return (
    <Card className={cx('overflow-hidden', isModal && 'shadow-lg')}>
      {/* Stepper */}
      <div className="border-b border-line bg-surface-inset px-5 py-4 sm:px-7">
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((s, i) => {
            const done = step > s.n;
            const active = step === s.n;
            return (
              <div key={s.n} className="flex flex-1 items-center gap-2">
                <span
                  className={cx(
                    'grid size-8 shrink-0 place-items-center rounded-lg transition-colors duration-300',
                    done
                      ? 'bg-positive-soft text-positive'
                      : active
                        ? 'bg-brand-700 text-white dark:bg-brand-500 dark:text-brand-950'
                        : 'bg-surface text-ink-faint'
                  )}
                >
                  {done ? <Check className="size-4" /> : <s.icon className="size-4" />}
                </span>
                <span
                  className={cx(
                    'hidden text-[12px] font-semibold sm:block',
                    active ? 'text-ink' : 'text-ink-faint'
                  )}
                >
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <span
                    className={cx(
                      'h-px flex-1 transition-colors duration-300',
                      done ? 'bg-positive' : 'bg-line-strong'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
        <ProgressBar value={(step / 3) * 100} className="mt-4" label="Setup progress" />
      </div>

      <div className="p-5 sm:p-7">
        {error && (
          <Alert tone="critical" icon={AlertCircle} className="mb-5">
            {error}
          </Alert>
        )}

        <>
          {/* ── Step 1 ── */}
          {step === 1 && (
            <motion.div key="s1" variants={slide} initial="enter" animate="center" className="space-y-5">
              <header className="space-y-1">
                <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">
                  Which language do you want to speak?
                </h2>
                <p className="text-[13px] text-ink-soft">
                  You can add more later — each one gets its own independent plan.
                </p>
              </header>

              <div
                role="radiogroup"
                aria-label="Target language"
                className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
              >
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const meta = getLanguageMeta(lang.code);
                  const selected = language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setLanguage(lang.code)}
                      className={cx(
                        'flex cursor-pointer flex-col gap-2.5 rounded-xl border p-3.5 text-left transition-[border-color,background-color,box-shadow] duration-200',
                        selected
                          ? 'border-brand bg-brand-soft ring-3 ring-[var(--brand-ring)]'
                          : 'border-line bg-surface hover:border-line-strong hover:bg-surface-hover'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={cx(
                            'grid size-10 place-items-center rounded-lg font-serif text-lg leading-none',
                            meta.tile
                          )}
                          aria-hidden="true"
                        >
                          {lang.script}
                        </span>
                        {selected ? (
                          <Check className="size-4 text-brand" aria-hidden="true" />
                        ) : lang.tier === 1 ? (
                          <Badge tone="neutral">Tier 1</Badge>
                        ) : null}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-ink">{lang.name}</div>
                        <div className="text-[12px] text-ink-faint">{lang.nativeName}</div>
                      </div>
                      <p className="truncate text-[12px] text-ink-soft">{lang.sample}</p>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end border-t border-line pt-4">
                <Button onClick={() => setStep(2)}>
                  Continue
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <motion.div key="s2" variants={slide} initial="enter" animate="center" className="space-y-5">
              <header className="space-y-1">
                <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">
                  How much {langMeta.name} do you have already?
                </h2>
                <p className="text-[13px] text-ink-soft">
                  This sets the difficulty of your prompts and how strictly we mark you.
                </p>
              </header>

              <div role="radiogroup" aria-label="Starting level" className="space-y-2.5">
                {LEVELS.map((lvl, i) => {
                  const selected = level === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setLevel(lvl.id)}
                      className={cx(
                        'flex w-full cursor-pointer items-start gap-3.5 rounded-xl border p-4 text-left transition-[border-color,background-color,box-shadow] duration-200',
                        selected
                          ? 'border-brand bg-brand-soft ring-3 ring-[var(--brand-ring)]'
                          : 'border-line bg-surface hover:border-line-strong hover:bg-surface-hover'
                      )}
                    >
                      <span
                        className={cx(
                          'tabular grid size-9 shrink-0 place-items-center rounded-lg font-mono text-[13px] font-bold',
                          selected ? 'bg-brand-700 text-white dark:bg-brand-500 dark:text-brand-950' : 'bg-surface-inset text-ink-faint'
                        )}
                        aria-hidden="true"
                      >
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-bold text-ink">{lvl.title}</span>
                          <Badge tone={selected ? 'brand' : 'neutral'}>{lvl.id}</Badge>
                        </span>
                        <span className="mt-1 block text-[13px] leading-relaxed text-ink-soft">{lvl.blurb}</span>
                      </span>
                      {selected && <Check className="mt-1 size-4 shrink-0 text-brand" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between border-t border-line pt-4">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Back
                </Button>
                <Button onClick={() => setStep(3)}>
                  Continue
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3 ── */}
          {step === 3 && (
            <motion.div key="s3" variants={slide} initial="enter" animate="center" className="space-y-5">
              <header className="space-y-1">
                <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">
                  How long are you giving yourself?
                </h2>
                <p className="text-[13px] text-ink-soft">
                  We’ll split the material evenly across this many days. Anywhere from 3 to 180.
                </p>
              </header>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {PRESETS.map((p) => {
                  const selected = days === p.days;
                  return (
                    <button
                      key={p.days}
                      type="button"
                      onClick={() => setDays(p.days)}
                      aria-pressed={selected}
                      className={cx(
                        'cursor-pointer rounded-xl border p-3 text-center transition-[border-color,background-color,box-shadow] duration-200',
                        selected
                          ? 'border-brand bg-brand-soft ring-3 ring-[var(--brand-ring)]'
                          : 'border-line bg-surface hover:border-line-strong hover:bg-surface-hover'
                      )}
                    >
                      <div className="font-display text-sm font-bold text-ink">{p.label}</div>
                      <div className="mt-0.5 text-[11px] text-ink-faint">{p.note}</div>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-xl border border-line bg-surface-inset p-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="goal-days" className="text-[13px] font-semibold text-ink">
                    Custom length
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="goal-days"
                      type="number"
                      min={3}
                      max={180}
                      value={days}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!Number.isNaN(v)) setDays(Math.min(Math.max(v, 3), 180));
                      }}
                      className="tabular h-9 w-20 rounded-lg border border-line-strong bg-surface text-center font-mono text-sm font-bold text-ink outline-none focus:border-brand focus:ring-3 focus:ring-[var(--brand-ring)]"
                    />
                    <span className="text-[12px] font-semibold text-ink-faint">days</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={3}
                  max={180}
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value, 10))}
                  aria-label="Goal duration in days"
                  className="mt-3 w-full cursor-pointer"
                />
                <div className="mt-1 flex justify-between font-mono text-[11px] text-ink-faint">
                  <span>3</span>
                  <span>90</span>
                  <span>180</span>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-line bg-brand-soft p-4">
                <span
                  className={cx('grid size-10 shrink-0 place-items-center rounded-lg font-serif text-lg', langMeta.tile)}
                  aria-hidden="true"
                >
                  {langMeta.script}
                </span>
                <div className="text-[13px]">
                  <p className="font-bold text-ink">
                    {langMeta.name} · {level} · {days} days
                  </p>
                  <p className="mt-0.5 text-ink-soft">
                    Each day: speak a phrase, rebuild it, then a short quiz.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-line pt-4">
                <Button variant="ghost" onClick={() => setStep(2)} disabled={isLoading}>
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Back
                </Button>
                <Button onClick={finish} loading={isLoading} size="lg">
                  {isLoading ? 'Building your plan… this can take a minute' : 'Generate my roadmap'}
                  {!isLoading && <Sparkles className="size-4" aria-hidden="true" />}
                </Button>
              </div>
            </motion.div>
          )}
        </>
      </div>
    </Card>
  );
}
