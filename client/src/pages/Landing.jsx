import { Suspense, lazy } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';
import Brandmark from '../components/Brandmark';
import ThemeToggle from '../components/ThemeToggle/ThemeToggle';
import ScriptMarquee from '../components/landing/ScriptMarquee';
import { Button, Card, Badge, Eyebrow, Skeleton, CountUp, stagger, riseItem } from '../components/ui';
import { PREMIUM_PRICE_LABEL, PREMIUM_PRICE_SHORT } from '../config/pricing';
import { ArrowRight, Check, Crown, Mic, Sparkles } from 'lucide-react';

// Landing-only weight (three.js, GSAP/ScrollTrigger, Swiper) — lazily loaded so
// none of it lands in the bundle a learner downloads to record a sentence (spec §11, §15).
const Hero3D = lazy(() => import('../components/landing/Hero3D'));
const FeatureCarousel = lazy(() => import('../components/landing/FeatureCarousel'));
const ScrollRevealSection = lazy(() => import('../components/landing/ScrollRevealSection'));

const STATS = [
  { value: '11', label: 'Indian languages' },
  { value: '3', label: 'activities a day' },
  { value: '2', label: 'sessions free' },
  { value: PREMIUM_PRICE_SHORT, label: 'once, then never' },
];

const FREE_FEATURES = ['2 practice sessions', 'Speak, game and quiz', 'One correction per phrase'];
const PREMIUM_FEATURES = [
  'Unlimited sessions',
  '5-turn AI roleplay',
  'All 11 languages at once',
  'Progress analytics',
];

export default function Landing() {
  const { user } = useAuthStore();
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Brandmark />
          <div className="flex items-center gap-2">
            <ThemeToggle size="sm" className="hidden sm:inline-flex" />
            <Button as={Link} to="/login" variant="ghost" size="sm">
              Sign in
            </Button>
            <Button as={Link} to="/register" size="sm">
              Get started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="blueprint pointer-events-none absolute inset-0" aria-hidden="true" />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-24">
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={riseItem}>
              <Eyebrow icon={Mic}>Voice-first language learning</Eyebrow>
            </motion.div>

            <motion.h1
              variants={riseItem}
              className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]"
            >
              Learn to <span className="font-serif italic text-brand">speak</span> Indian
              languages — not just read about them.
            </motion.h1>

            <motion.p variants={riseItem} className="max-w-lg text-[16px] leading-relaxed text-ink-soft">
              Ten minutes a day in Kannada, Hindi, English and eight more. Say the phrase, rebuild it, prove you kept
              it — with a correction you can actually hear back.
            </motion.p>

            <motion.div variants={riseItem} className="flex flex-wrap items-center gap-3">
              <Button as={Link} to="/register" size="lg">
                Start 2 free sessions
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <Button as={Link} to="/login" variant="outline" size="lg">
                I have an account
              </Button>
            </motion.div>

            <motion.dl variants={riseItem} className="grid max-w-lg grid-cols-2 gap-x-6 gap-y-4 pt-4 sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label}>
                  <dt className="tabular font-display text-xl font-bold text-ink">
                    <CountUp value={s.value} />
                  </dt>
                  <dd className="mt-0.5 text-[12px] leading-tight text-ink-faint">{s.label}</dd>
                </div>
              ))}
            </motion.dl>
          </motion.div>

          <motion.div
            initial={{ scale: 0.96 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="relative"
          >
            <Card className="grain overflow-hidden">
              <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-none sm:h-[380px]" />}>
                <Hero3D />
              </Suspense>
              <p className="border-t border-line px-4 py-2.5 text-center font-mono text-[11px] text-ink-faint">
                One node per language · drag to look around
              </p>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Script marquee */}
      <section className="border-b border-line bg-canvas-sunk">
        <ScriptMarquee />
      </section>

      {/* Languages carousel */}
      <section className="border-b border-line px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <Suspense fallback={<Skeleton className="mx-auto h-72 w-full max-w-5xl" />}>
          <FeatureCarousel />
        </Suspense>
      </section>

      {/* How it works */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <Suspense fallback={<Skeleton className="mx-auto h-96 w-full max-w-5xl" />}>
          <ScrollRevealSection />
        </Suspense>
      </section>

      {/* Pricing */}
      <section className="border-t border-line px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 space-y-2 text-center">
            <Eyebrow icon={Crown} className="justify-center">
              Pricing
            </Eyebrow>
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Free to try. One payment if you stay.
            </h2>
            <p className="mx-auto max-w-md text-[15px] text-ink-soft">
              No subscription and no renewal — you buy it once and keep it.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="flex flex-col p-6">
              <span className="text-[12px] font-bold uppercase tracking-wider text-ink-faint">Free</span>
              <div className="mt-3 font-display text-3xl font-bold text-ink">₹0</div>
              <ul className="mt-5 flex-1 space-y-2.5 border-t border-line pt-5 text-[14px] text-ink-soft">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="size-4 shrink-0 text-ink-faint" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button as={Link} to="/register" variant="outline" className="mt-6 w-full">
                Get started
              </Button>
            </Card>

            <Card className="relative flex flex-col border-brand p-6 shadow-md ring-1 ring-[var(--brand-ring)]">
              <span className="absolute -top-2.5 left-6">
                <Badge tone="accent" icon={Sparkles}>
                  Lifetime
                </Badge>
              </span>

              <span className="text-[12px] font-bold uppercase tracking-wider text-brand">Premium</span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-3xl font-bold text-ink">{PREMIUM_PRICE_LABEL}</span>
              </div>

              <ul className="mt-5 flex-1 space-y-2.5 border-t border-line pt-5 text-[14px] text-ink">
                {PREMIUM_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="size-4 shrink-0 text-brand" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button as={Link} to="/register" className="mt-6 w-full">
                Start free, upgrade later
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <Brandmark />
          <div className="space-y-1 text-[12px] text-ink-faint">
            <p>
              © {new Date().getFullYear()} VaaniTutor — NxtWave GenAI project ·{' '}
              <Link to="/privacy" className="hover:text-ink">Privacy</Link> ·{' '}
              <Link to="/terms" className="hover:text-ink">Terms</Link>
            </p>
            <p className="font-mono text-[11px]">
              ಕನ್ನಡ · हिन्दी · English · தமிழ் · తెలుగు · বাংলা · मराठी · ગુજરાતી · ਪੰਜਾਬੀ · മലയാളം · ଓଡ଼ିଆ
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
