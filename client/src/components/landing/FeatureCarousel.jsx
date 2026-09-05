import { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Keyboard } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { SUPPORTED_LANGUAGES, getLanguageMeta } from '../../store/languageStore';
import { Card, Badge, Eyebrow, cx } from '../ui';
import { ChevronLeft, ChevronRight, Languages } from 'lucide-react';

export default function FeatureCarousel() {
  const swiperRef = useRef(null);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <Eyebrow icon={Languages}>Eleven languages</Eyebrow>
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Learn in the script people actually write in
          </h2>
          <p className="max-w-lg text-[15px] text-ink-soft">
            Each language runs its own roadmap, its own pace and its own streak — you can learn several at once.
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            aria-label="Previous language"
            onClick={() => swiperRef.current?.slidePrev()}
            className="grid size-10 cursor-pointer place-items-center rounded-lg border border-line-strong bg-surface text-ink-soft transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next language"
            onClick={() => swiperRef.current?.slideNext()}
            className="grid size-10 cursor-pointer place-items-center rounded-lg border border-line-strong bg-surface text-ink-soft transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <Swiper
        onSwiper={(s) => (swiperRef.current = s)}
        modules={[Autoplay, Pagination, Keyboard]}
        spaceBetween={16}
        slidesPerView={1.15}
        breakpoints={{
          640: { slidesPerView: 2.15 },
          1024: { slidesPerView: 3 },
        }}
        autoplay={{ delay: 3800, disableOnInteraction: true, pauseOnMouseEnter: true }}
        keyboard={{ enabled: true }}
        pagination={{ clickable: true }}
        a11y={{ enabled: true }}
        className="!pb-12"
      >
        {SUPPORTED_LANGUAGES.map((lang) => {
          const meta = getLanguageMeta(lang.code);
          return (
            <SwiperSlide key={lang.code} className="h-auto">
              <Card className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cx(
                      'grid size-12 place-items-center rounded-xl font-serif text-2xl leading-none',
                      meta.tile
                    )}
                    aria-hidden="true"
                  >
                    {lang.script}
                  </span>
                  {lang.tier === 1 && <Badge tone="brand">Tier 1</Badge>}
                </div>

                <div className="mt-4">
                  <h3 className="font-display text-lg font-bold text-ink">{lang.name}</h3>
                  <p className="text-[13px] text-ink-faint">{lang.nativeName}</p>
                </div>

                <blockquote className="mt-4 flex-1 rounded-xl bg-surface-inset p-4">
                  <p className="text-[15px] font-medium leading-relaxed text-ink">{lang.sample}</p>
                  <footer className="mt-2 text-[12px] italic text-ink-soft">{lang.sampleEnglish}</footer>
                </blockquote>

                <p className="mt-3 font-mono text-[11px] text-ink-faint">{lang.code}</p>
              </Card>
            </SwiperSlide>
          );
        })}
      </Swiper>

      <style>{`
        .swiper-pagination-bullet { background: var(--ink-faint); opacity: 0.35; }
        .swiper-pagination-bullet-active { background: var(--brand); opacity: 1; width: 20px; border-radius: 4px; }
      `}</style>
    </div>
  );
}
