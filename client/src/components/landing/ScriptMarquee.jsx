import { SUPPORTED_LANGUAGES } from '../../store/languageStore';
import { cx } from '../ui';

/**
 * Continuous band of the eleven native scripts. Pure CSS transform loop —
 * the track is duplicated so the translate can wrap seamlessly at -50%.
 */
export default function ScriptMarquee({ className }) {
  const items = SUPPORTED_LANGUAGES.map((l) => ({
    key: l.code,
    script: l.nativeName,
    name: l.name,
  }));

  return (
    <div
      className={cx('marquee-mask relative overflow-hidden py-4', className)}
      aria-label={`Supported languages: ${items.map((i) => i.name).join(', ')}`}
    >
      <div className="marquee-track flex w-max items-center gap-10">
        {[...items, ...items].map((item, i) => (
          <span
            key={`${item.key}-${i}`}
            aria-hidden={i >= items.length ? 'true' : undefined}
            className="flex shrink-0 items-baseline gap-2.5"
          >
            <span className="font-serif text-2xl leading-none text-ink">{item.script}</span>
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">
              {item.name}
            </span>
            <span className="ml-6 size-1 rounded-full bg-brand" />
          </span>
        ))}
      </div>
    </div>
  );
}
