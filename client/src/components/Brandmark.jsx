import { Link } from 'react-router-dom';
import { cx } from './ui';

/** The waveform glyph — same shape as the favicon so the tab and header agree. */
export function BrandGlyph({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={cx('size-9', className)} aria-hidden="true">
      <rect width="64" height="64" rx="16" className="fill-brand-700 dark:fill-brand-500" />
      <g className="fill-white dark:fill-brand-950">
        <rect x="16" y="26" width="6" height="12" rx="3" />
        <rect x="26" y="17" width="6" height="30" rx="3" />
        <rect x="46" y="22" width="6" height="20" rx="3" />
      </g>
      <rect x="36" y="12" width="6" height="40" rx="3" className="fill-accent-400" />
    </svg>
  );
}

export default function Brandmark({ to = '/', showWordmark = true, className }) {
  return (
    <Link
      to={to}
      className={cx('group flex items-center gap-2.5', className)}
      aria-label="VaaniTutor home"
    >
      <BrandGlyph className="size-9 transition-transform duration-300 group-hover:-rotate-3" />
      {showWordmark && (
        <span className="font-display text-[17px] font-bold tracking-tight text-ink">
          Vaani<span className="text-brand">Tutor</span>
        </span>
      )}
    </Link>
  );
}
