import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Button, ProgressBar, cx } from '../ui';
import {
  Check,
  Lock,
  Play,
  ChevronDown,
  MessageSquare,
  ListChecks,
  BookOpen,
  X,
  MapPin,
} from 'lucide-react';

function DayCard({ day, state, onOpen, onStart }) {
  const isDone = state === 'done';
  const isToday = state === 'today';
  const isLocked = state === 'locked';

  return (
    <motion.div
      initial={{ y: 8 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.25 }}
      className={cx(
        'group relative rounded-xl border p-4 transition-[border-color,box-shadow] duration-200',
        isToday
          ? 'border-brand bg-brand-soft shadow-sm'
          : isDone
            ? 'border-line bg-surface'
            : isLocked
              ? 'border-line bg-surface-inset'
              : 'border-line bg-surface hover:border-line-strong'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cx(
              'tabular grid size-7 place-items-center rounded-lg font-mono text-[11px] font-bold',
              isDone
                ? 'bg-positive-soft text-positive'
                : isToday
                  ? 'bg-brand-700 text-white dark:bg-brand-500 dark:text-brand-950'
                  : 'bg-surface-inset text-ink-faint'
            )}
          >
            {isDone ? <Check className="size-3.5" aria-hidden="true" /> : day.dayNumber}
          </span>
          {isToday && <Badge tone="accent">Today</Badge>}
          {isLocked && <Lock className="size-3.5 text-ink-faint" aria-hidden="true" />}
        </div>

        {!isLocked && (
          <button
            type="button"
            onClick={() => onStart(day.dayNumber)}
            aria-label={`Practise day ${day.dayNumber}`}
            className={cx(
              'grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg transition-colors',
              isToday
                ? 'bg-brand-700 text-white hover:bg-brand-800 dark:bg-brand-500 dark:text-brand-950 dark:hover:bg-brand-400'
                : 'bg-surface-inset text-ink-soft hover:bg-surface-hover hover:text-ink'
            )}
          >
            <Play className="size-3.5 fill-current" aria-hidden="true" />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => onOpen(day)}
        className="mt-3 block w-full cursor-pointer text-left"
      >
        <h4 className="line-clamp-1 text-sm font-bold text-ink">{day.topic}</h4>
        <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-ink-soft">
          {day.scenario || day.grammarFocus}
        </p>
      </button>

      <div className="mt-3 flex items-center gap-3 border-t border-line pt-2.5 font-mono text-[11px] text-ink-faint">
        <span className="inline-flex items-center gap-1">
          <MessageSquare className="size-3" aria-hidden="true" />
          {day.targetPhrases?.length || 0}
        </span>
        <span className="inline-flex items-center gap-1">
          <ListChecks className="size-3" aria-hidden="true" />
          {day.quiz?.length || 0}
        </span>
      </div>
    </motion.div>
  );
}

export default function RoadmapTimeline({ roadmap, currentDayNumber = 1, languageCode }) {
  const navigate = useNavigate();
  const firstIncompleteWeek =
    roadmap?.weeks?.find((w) => (w.days || []).some((d) => !d.completedAt))?.weekNumber ?? 1;
  const [openWeek, setOpenWeek] = useState(firstIncompleteWeek);
  const [preview, setPreview] = useState(null);

  if (!roadmap?.weeks?.length) return null;

  const startPractice = () => navigate(`/practice/${languageCode}`);

  const allDays = roadmap.weeks.flatMap((w) => w.days || []);
  const doneCount = allDays.filter((d) => d.completedAt).length;
  const percent = allDays.length ? Math.round((doneCount / allDays.length) * 100) : 0;

  const stateFor = (day) => {
    if (day.completedAt) return 'done';
    if (day.dayNumber === currentDayNumber) return 'today';
    if (day.dayNumber > currentDayNumber) return 'locked';
    return 'open';
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="grain overflow-hidden">
        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">{roadmap.generatedBy || 'AI generated'}</Badge>
              <Badge tone="neutral">{roadmap.startLevel || 'Basic'}</Badge>
            </div>
            <h2 className="font-display text-lg font-bold text-ink">
              <span className="tabular">{roadmap.totalDays}</span>{' '}
              {roadmap.totalDays === 1 ? 'day' : 'days'} ·{' '}
              <span className="tabular">{roadmap.weeks.length}</span>{' '}
              {roadmap.weeks.length === 1 ? 'week' : 'weeks'}
            </h2>
            <div className="max-w-xs space-y-1.5">
              <ProgressBar value={percent} label="Roadmap completion" />
              <p className="text-[12px] text-ink-soft">
                <span className="tabular font-bold text-ink">{doneCount}</span> of{' '}
                <span className="tabular">{allDays.length}</span> days complete
              </p>
            </div>
          </div>

          <Button size="lg" onClick={startPractice} className="shrink-0">
            <Play className="size-4 fill-current" aria-hidden="true" />
            Continue day {currentDayNumber}
          </Button>
        </div>
      </Card>

      {/* Weeks */}
      <div className="space-y-3">
        {roadmap.weeks.map((week) => {
          const days = week.days || [];
          const done = days.filter((d) => d.completedAt).length;
          const expanded = openWeek === week.weekNumber;

          return (
            <Card key={week.weekNumber} className="overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenWeek(expanded ? null : week.weekNumber)}
                aria-expanded={expanded}
                className="flex w-full cursor-pointer items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-surface-hover sm:p-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="tabular grid size-10 shrink-0 place-items-center rounded-xl bg-surface-inset font-mono text-[13px] font-bold text-ink-soft">
                    W{week.weekNumber}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-display text-[15px] font-bold text-ink">{week.theme}</div>
                    <div className="tabular text-[12px] text-ink-faint">
                      {done} / {days.length} days complete
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  {done === days.length && days.length > 0 && (
                    <Badge tone="positive" icon={Check}>
                      Done
                    </Badge>
                  )}
                  <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="size-4 text-ink-faint" aria-hidden="true" />
                  </motion.span>
                </div>
              </button>

              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="grid gap-3 border-t border-line p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
                      {days.map((day) => (
                        <DayCard
                          key={day.dayNumber}
                          day={day}
                          state={stateFor(day)}
                          onOpen={setPreview}
                          onStart={startPractice}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>

      {/* Day preview */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            role="dialog"
            aria-modal="true"
            aria-label={`Day ${preview.dayNumber} preview`}
            onClick={(e) => e.target === e.currentTarget && setPreview(null)}
            className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-sand-950/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-lg rounded-2xl border border-line bg-surface-raised shadow-lg"
            >
              <div className="flex items-start justify-between gap-3 border-b border-line p-5">
                <div className="min-w-0">
                  <Badge tone="brand">Day {preview.dayNumber}</Badge>
                  <h3 className="mt-2 font-display text-lg font-bold text-ink">{preview.topic}</h3>
                  {preview.scenario && (
                    <p className="mt-1 flex items-start gap-1.5 text-[13px] text-ink-soft">
                      <MapPin className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden="true" />
                      {preview.scenario}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  aria-label="Close"
                  className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-ink-faint transition-colors hover:bg-surface-hover hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="space-y-3 p-5">
                <div className="rounded-xl border border-line bg-surface-inset p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                    Phrase to speak
                  </p>
                  <p className="mt-1.5 font-display text-lg font-bold text-ink">{preview.promptText}</p>
                  {preview.translationEnglish && (
                    <p className="mt-1 text-[13px] italic text-ink-soft">“{preview.translationEnglish}”</p>
                  )}
                </div>

                {preview.grammarFocus && (
                  <div className="rounded-xl border border-line p-4">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                      <BookOpen className="size-3.5" aria-hidden="true" /> Grammar focus
                    </p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{preview.grammarFocus}</p>
                  </div>
                )}

                {preview.quiz?.length > 0 && (
                  <div className="rounded-xl border border-line p-4">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                      <ListChecks className="size-3.5" aria-hidden="true" /> {preview.quiz.length} quiz questions
                    </p>
                    <p className="mt-1.5 text-[13px] text-ink-soft">
                      Recall check on today’s vocabulary and grammar.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t border-line p-4">
                <Button variant="ghost" onClick={() => setPreview(null)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setPreview(null);
                    startPractice();
                  }}
                >
                  Start practice
                  <Play className="size-3.5 fill-current" aria-hidden="true" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
