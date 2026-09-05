import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Card, Button, Eyebrow, cx } from '../ui';
import { Mic, Puzzle, ListChecks, Flame, ShieldCheck, Gauge, ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    icon: Mic,
    tag: 'Activity 1',
    title: 'Speak it out loud',
    body: 'Record the day’s phrase. You get a transcript, a corrected version you can hear back at three speeds, and a fluency score. On Premium it becomes a five-turn roleplay that answers you in character.',
  },
  {
    icon: Puzzle,
    tag: 'Activity 2',
    title: 'Rebuild the sentence',
    body: 'The same phrase, scrambled. Tap the words back into order — the quickest way to get Indic word order into your head rather than onto a flashcard.',
  },
  {
    icon: ListChecks,
    tag: 'Activity 3',
    title: 'Prove you kept it',
    body: 'A short recall quiz on the day’s vocabulary and grammar. Finish it and tomorrow unlocks.',
  },
];

const PILLARS = [
  {
    icon: Flame,
    title: 'Streaks that mean something',
    body: 'Counted in calendar days you actually practised — not how many lessons you rushed in one sitting.',
  },
  {
    icon: ShieldCheck,
    title: 'Your data stays yours',
    body: 'Every query is scoped to your account. No shared roadmaps, no cross-account leakage.',
  },
  {
    icon: Gauge,
    title: 'Difficulty that follows you',
    body: 'A rolling average of your real fluency scores moves you up a level when you’re ready.',
  },
];

export default function ScrollRevealSection() {
  const root = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray('[data-reveal]').forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 28,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      });

      gsap.from('[data-reveal-stagger] > *', {
        opacity: 0,
        y: 24,
        duration: 0.6,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: { trigger: '[data-reveal-stagger]', start: 'top 85%', once: true },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="mx-auto w-full max-w-5xl space-y-20">
      {/* Three activities */}
      <section className="space-y-8">
        <div data-reveal className="max-w-2xl space-y-2">
          <Eyebrow>A day takes about ten minutes</Eyebrow>
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Three activities, always in the same order
          </h2>
          <p className="text-[15px] leading-relaxed text-ink-soft">
            Walk away halfway through and you come back to exactly where you stopped — the right activity, and on
            Premium the right conversation turn. Never back to the start.
          </p>
        </div>

        <div data-reveal-stagger className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <Card key={s.tag} className="flex flex-col p-5">
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand-softfg">
                  <s.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                  {s.tag}
                </span>
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-ink">{s.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{s.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section data-reveal>
        <Card className="grain overflow-hidden p-6 sm:p-10">
          <div className="relative mx-auto max-w-xl space-y-2 text-center">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
              Built to be spoken to, not clicked through
            </h2>
            <p className="text-[15px] text-ink-soft">
              Speech and language models run through layered fallbacks, so a slow provider never becomes your problem.
            </p>
          </div>

          <div className="relative mt-8 grid gap-6 sm:grid-cols-3">
            {PILLARS.map((p) => (
              <div key={p.title} className="space-y-2.5">
                <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent-softfg">
                  <p.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="font-display text-[15px] font-bold text-ink">{p.title}</h3>
                <p className="text-[13px] leading-relaxed text-ink-soft">{p.body}</p>
              </div>
            ))}
          </div>

          <div className="relative mt-8 flex justify-center border-t border-line pt-8">
            <Button as={Link} to="/register" size="lg">
              Start your first session
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
