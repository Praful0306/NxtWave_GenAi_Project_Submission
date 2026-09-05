import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Play, TrendingUp, ChevronRight } from 'lucide-react';
import { getLanguageMeta } from '../../store/languageStore';
import { Card, Badge, Button, ProgressBar, cx } from '../ui';

export default function LanguageCard({ userLanguage }) {
  const navigate = useNavigate();
  const meta = getLanguageMeta(userLanguage.languageCode);

  const totalDays = userLanguage.totalDays || userLanguage.goalDurationDays || 30;
  const completedDays = userLanguage.completedDays || 0;
  const currentDay = userLanguage.currentDayNumber || Math.min(completedDays + 1, totalDays);
  const percent = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
  const streak = userLanguage.currentStreak || 0;

  return (
    <Card spotlight className="group flex flex-col overflow-hidden">
      {/* Identity */}
      <div className="flex items-start justify-between gap-3 p-5">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cx(
              'grid size-12 shrink-0 place-items-center rounded-xl font-serif text-2xl leading-none',
              meta.tile
            )}
            aria-hidden="true"
          >
            {meta.script}
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-bold text-ink">{meta.name}</h3>
            <p className="truncate text-[12px] text-ink-faint">
              {meta.nativeName} · {userLanguage.level || 'Basic'}
            </p>
          </div>
        </div>

        {streak > 0 && (
          <Badge tone="accent" icon={Flame} className="shrink-0">
            <span className="tabular">{streak}d</span>
          </Badge>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-2 px-5">
        <div className="flex items-baseline justify-between text-[12px]">
          <span className="font-medium text-ink-soft">
            Day <span className="tabular font-bold text-ink">{currentDay}</span> of{' '}
            <span className="tabular">{totalDays}</span>
          </span>
          <span className="tabular font-mono text-[11px] font-bold text-brand">{percent}%</span>
        </div>
        <ProgressBar value={percent} label={`${meta.name} progress`} />
      </div>

      {/* Actions */}
      <div className="mt-5 flex items-center justify-between gap-2 border-t border-line px-5 py-3">
        <button
          type="button"
          onClick={() => navigate(`/progress/${userLanguage.languageCode}`)}
          className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-[12px] font-semibold text-ink-faint transition-colors hover:bg-surface-hover hover:text-ink"
        >
          <TrendingUp className="size-3.5" aria-hidden="true" />
          Progress
        </button>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/roadmap/${userLanguage.languageCode}`)}
          >
            Roadmap
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Button>
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button size="sm" onClick={() => navigate(`/practice/${userLanguage.languageCode}`)}>
              <Play className="size-3.5 fill-current" aria-hidden="true" />
              Practise
            </Button>
          </motion.div>
        </div>
      </div>
    </Card>
  );
}
