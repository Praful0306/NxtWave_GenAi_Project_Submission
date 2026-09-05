import { forwardRef, useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export const cx = (...parts) => parts.filter(Boolean).join(' ');

/* ─────────────────────────── Button ─────────────────────────── */

const BUTTON_VARIANTS = {
  primary:
    'bg-brand-700 text-white hover:bg-brand-800 dark:bg-brand-500 dark:text-brand-950 dark:hover:bg-brand-400 shadow-sm',
  accent:
    'bg-accent-600 text-white hover:bg-accent-700 dark:bg-accent-500 dark:hover:bg-accent-400 dark:text-accent-950 shadow-sm',
  outline:
    'border border-line-strong bg-surface text-ink hover:bg-surface-hover hover:border-ink-faint',
  soft: 'bg-brand-soft text-brand-softfg hover:brightness-95 dark:hover:brightness-125',
  ghost: 'text-ink-soft hover:bg-surface-hover hover:text-ink',
  danger: 'bg-critical-soft text-critical hover:brightness-95 dark:hover:brightness-125',
};

const BUTTON_SIZES = {
  sm: 'h-9 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-11 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-xl',
};

export const Button = forwardRef(function Button(
  {
    as: Tag = 'button',
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    className,
    children,
    ...rest
  },
  ref
) {
  return (
    <Tag
      ref={ref}
      disabled={Tag === 'button' ? disabled || loading : undefined}
      className={cx(
        'inline-flex items-center justify-center font-semibold whitespace-nowrap',
        'transition-[background-color,border-color,color,box-shadow,transform] duration-200',
        'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        !disabled && !loading && 'cursor-pointer',
        BUTTON_SIZES[size],
        BUTTON_VARIANTS[variant],
        className
      )}
      {...rest}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </Tag>
  );
});

/* ─────────────────────────── Card ─────────────────────────── */

export function Card({
  as: Tag = 'div',
  interactive = false,
  spotlight = false,
  className,
  children,
  ...rest
}) {
  const ref = useRef(null);

  // Writes the pointer position to CSS vars; the ::before layer below paints
  // a soft brand-tinted glow that follows the cursor.
  const onMouseMove = useCallback(
    (e) => {
      if (!spotlight || !ref.current) return;
      const r = ref.current.getBoundingClientRect();
      ref.current.style.setProperty('--mx', `${e.clientX - r.left}px`);
      ref.current.style.setProperty('--my', `${e.clientY - r.top}px`);
    },
    [spotlight]
  );

  return (
    <Tag
      ref={ref}
      onMouseMove={spotlight ? onMouseMove : undefined}
      className={cx(
        'relative rounded-2xl border border-line bg-surface',
        spotlight && 'spotlight',
        interactive &&
          'cursor-pointer transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md',
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, icon: Icon, action, className }) {
  return (
    <div className={cx('flex items-start justify-between gap-4', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-softfg">
            <Icon className="size-4.5" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[13px] text-ink-soft">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ─────────────────────────── Badge ─────────────────────────── */

const BADGE_TONES = {
  neutral: 'bg-surface-inset text-ink-soft border-line',
  brand: 'bg-brand-soft text-brand-softfg border-transparent',
  accent: 'bg-accent-soft text-accent-softfg border-transparent',
  positive: 'bg-positive-soft text-positive border-transparent',
  caution: 'bg-caution-soft text-caution border-transparent',
  critical: 'bg-critical-soft text-critical border-transparent',
};

export function Badge({ tone = 'neutral', icon: Icon, className, children }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold',
        BADGE_TONES[tone],
        className
      )}
    >
      {Icon && <Icon className="size-3" aria-hidden="true" />}
      {children}
    </span>
  );
}

/* ─────────────────────────── Eyebrow ─────────────────────────── */

export function Eyebrow({ icon: Icon, className, children }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint',
        className
      )}
    >
      {Icon && <Icon className="size-3.5 text-brand" aria-hidden="true" />}
      {children}
    </span>
  );
}

/* ─────────────────────────── Field ─────────────────────────── */

export function Field({ label, htmlFor, hint, error, icon: Icon, children, className }) {
  return (
    <div className={cx('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-[13px] font-semibold text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
        )}
        {children}
      </div>
      {error ? (
        <p className="text-[12px] font-medium text-critical">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
}

export const inputClass =
  'w-full h-11 rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink ' +
  'placeholder:text-ink-faint transition-[border-color,box-shadow] duration-200 outline-none ' +
  'focus:border-brand focus:ring-3 focus:ring-[var(--brand-ring)] disabled:opacity-60 disabled:cursor-not-allowed';

export const inputWithIconClass = inputClass.replace('px-3.5', 'pl-10 pr-3.5');

/* ─────────────────────────── Alert ─────────────────────────── */

const ALERT_TONES = {
  critical: 'bg-critical-soft text-critical',
  positive: 'bg-positive-soft text-positive',
  caution: 'bg-caution-soft text-caution',
  brand: 'bg-brand-soft text-brand-softfg',
};

export function Alert({ tone = 'critical', icon: Icon, title, className, children }) {
  return (
    <div
      role={tone === 'critical' ? 'alert' : 'status'}
      className={cx('flex items-start gap-3 rounded-xl px-4 py-3 text-[13px]', ALERT_TONES[tone], className)}
    >
      {Icon && <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cx(title && 'mt-0.5 opacity-90')}>{children}</div>}
      </div>
    </div>
  );
}

/* ─────────────────────────── StatTile ─────────────────────────── */

export function StatTile({ label, value, icon: Icon, tone = 'brand', footnote }) {
  const tones = {
    brand: 'bg-brand-soft text-brand-softfg',
    accent: 'bg-accent-soft text-accent-softfg',
    positive: 'bg-positive-soft text-positive',
    neutral: 'bg-surface-inset text-ink-soft',
  };
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className={cx('grid size-10 shrink-0 place-items-center rounded-xl', tones[tone])}>
            <Icon className="size-5" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <div className="tabular font-display text-2xl font-bold leading-none text-ink">{value}</div>
          <div className="mt-1.5 text-[12px] font-medium leading-tight text-balance text-ink-soft">{label}</div>
        </div>
      </div>
      {footnote && <p className="mt-3 border-t border-line pt-2.5 text-[12px] text-ink-faint">{footnote}</p>}
    </Card>
  );
}

/**
 * Counts up to a numeric value on mount. Renders the final value immediately
 * when the number can't be parsed, or when the visitor prefers reduced motion —
 * the digits are content, so they must never depend on the animation running.
 */
export function CountUp({ value, duration = 900, className }) {
  // Splits "₹299", "80%", "5d" and 42 into prefix / number / suffix.
  const match = typeof value === 'number' ? null : String(value ?? '').match(/^(\D*?)([\d.,]+)(.*)$/);
  const prefix = match?.[1] ?? '';
  const suffix = match?.[3] ?? '';
  const numeric =
    typeof value === 'number' ? value : match ? Number(match[2].replace(/,/g, '')) : NaN;

  const [shown, setShown] = useState(() => (Number.isFinite(numeric) ? 0 : null));

  useEffect(() => {
    if (!Number.isFinite(numeric)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(numeric);
      return;
    }

    let frame;
    const started = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - started) / duration);
      // easeOutCubic
      setShown(Math.round(numeric * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    // rAF is throttled in background tabs; make sure the real number lands regardless.
    const settle = setTimeout(() => setShown(numeric), duration + 120);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settle);
    };
  }, [numeric, duration]);

  if (!Number.isFinite(numeric)) return <span className={className}>{value}</span>;
  return (
    <span className={className}>
      {prefix}
      {shown}
      {suffix}
    </span>
  );
}

/* ─────────────────────────── PageHeader ─────────────────────────── */

export function PageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <div className={cx('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0 space-y-2">
        {eyebrow}
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
        {description && <p className="max-w-2xl text-sm text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ─────────────────────────── Skeleton / states ─────────────────────────── */

export function Skeleton({ className }) {
  return <div className={cx('skeleton rounded-lg', className)} aria-hidden="true" />;
}

export function LoadingState({ label = 'Loading…', className }) {
  return (
    <div className={cx('flex flex-col items-center justify-center gap-3 py-16 text-center', className)} role="status">
      <span className="grid size-11 place-items-center rounded-2xl bg-brand-soft text-brand-softfg">
        <Loader2 className="size-5 animate-spin" aria-hidden="true" />
      </span>
      <p className="text-sm text-ink-soft">{label}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <Card className={cx('flex flex-col items-center gap-3 px-6 py-14 text-center', className)}>
      {Icon && (
        <span className="grid size-12 place-items-center rounded-2xl bg-surface-inset text-ink-faint">
          <Icon className="size-6" aria-hidden="true" />
        </span>
      )}
      <div className="space-y-1">
        <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
        {description && <p className="mx-auto max-w-sm text-[13px] text-ink-soft">{description}</p>}
      </div>
      {action}
    </Card>
  );
}

/* ─────────────────────────── Progress ─────────────────────────── */

export function ProgressBar({ value, tone = 'brand', className, label }) {
  const pct = Math.max(0, Math.min(100, value || 0));
  const tones = { brand: 'bg-brand', accent: 'bg-accent', positive: 'bg-positive' };
  return (
    <div
      className={cx('h-1.5 w-full overflow-hidden rounded-full bg-surface-inset', className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <motion.div
        className={cx('h-full rounded-full', tones[tone])}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

/* ─────────────────────────── Motion presets ─────────────────────────── */

/*
 * Entrance motion animates transform only — never opacity down to 0.
 * Framer Motion drives on requestAnimationFrame, which browsers throttle in
 * unfocused/background tabs; anything started at opacity 0 stays invisible
 * until the loop resumes. Translating instead degrades to "visible, slightly
 * offset" rather than "blank page".
 */
export const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.03 } },
};

export const riseItem = {
  hidden: { y: 12 },
  visible: { y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};
