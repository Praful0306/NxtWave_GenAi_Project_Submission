import { Sun, Moon, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';
import useThemeStore from '../../store/themeStore';
import { cx } from '../ui';

const OPTIONS = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'system', icon: Monitor, label: 'System' },
  { value: 'dark', icon: Moon, label: 'Dark' },
];

/** Segmented Light / System / Dark control with a sliding thumb. */
export default function ThemeToggle({ size = 'md', className }) {
  const { theme, setTheme } = useThemeStore();
  const btn = size === 'sm' ? 'size-7' : 'size-8';

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cx(
        'inline-flex items-center gap-0.5 rounded-xl border border-line bg-surface-inset p-0.5',
        className
      )}
    >
      {OPTIONS.map(({ value, icon: Icon, label }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${label} theme`}
            title={label}
            onClick={() => setTheme(value)}
            className={cx(
              'relative grid cursor-pointer place-items-center rounded-lg transition-colors duration-200',
              btn,
              active ? 'text-brand-softfg' : 'text-ink-faint hover:text-ink'
            )}
          >
            {active && (
              <motion.span
                layoutId="theme-thumb"
                className="absolute inset-0 rounded-lg bg-surface shadow-xs"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <Icon className="relative size-3.5" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
