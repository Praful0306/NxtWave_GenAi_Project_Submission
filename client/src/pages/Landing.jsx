import React, { Suspense, lazy } from 'react';
import { Link, Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import ThemeToggle from '../components/ThemeToggle/ThemeToggle';
import FeatureCarousel from '../components/landing/FeatureCarousel';
import ScrollRevealSection from '../components/landing/ScrollRevealSection';
import {
  Sparkles,
  ArrowRight,
  Crown,
  Mic,
  Languages,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Globe,
  Loader2,
} from 'lucide-react';

const Hero3D = lazy(() => import('../components/landing/Hero3D'));

export default function Landing() {
  const { user } = useAuthStore();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* ─── HEADER / NAVBAR ─── */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/20">
              V
            </div>
            <div>
              <div className="font-extrabold text-white text-lg tracking-tight flex items-center gap-1.5">
                VaaniTutor
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Indic Voice
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl text-slate-300 hover:text-white text-xs font-semibold hover:bg-slate-900 transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/20"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION WITH 3D CANVAS ─── */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full text-center space-y-8">
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 via-amber-500/10 to-purple-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-500/5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Next-Gen Indic Voice Language AI Tutor</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Master Indian Languages by{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">
              Actually Speaking
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Custom day-by-day roadmaps for <strong>Kannada, Hindi, English</strong>, and 8 more Indian languages. Practice with 3 daily activities: conversational voice tutor, word-order games, and retention quizzes.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm tracking-wide shadow-xl shadow-indigo-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Start 2 Free Sessions</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-800 transition"
            >
              <span>Continue Learning</span>
            </Link>
          </div>
        </div>

        {/* 3D Geometric Interactive Canvas */}
        <Suspense
          fallback={
            <div className="w-full h-[380px] flex items-center justify-center text-slate-500 text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          }
        >
          <Hero3D />
        </Suspense>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 border-t border-slate-800/80">
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
            <div className="text-2xl font-black text-amber-400">11</div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Indian Languages
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
            <div className="text-2xl font-black text-indigo-400">&lt;250ms</div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              TTS Audio Latency
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
            <div className="text-2xl font-black text-emerald-400">3-Part</div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Daily Sessions
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
            <div className="text-2xl font-black text-purple-400">100%</div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Isolated Streaks
            </div>
          </div>
        </div>
      </section>

      {/* ─── 11 INDIC LANGUAGES CAROUSEL ─── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-950/40 border-y border-slate-800/60">
        <FeatureCarousel />
      </section>

      {/* ─── 3-ACTIVITY ARCHITECTURE & HIGHLIGHTS ─── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <ScrollRevealSection />
      </section>

      {/* ─── PRICING & LIFETIME ACCESS ─── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-950/40 border-t border-slate-800/60">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5" />
              <span>Transparent & Fair Pricing</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Start Free, Upgrade Once for Lifetime Fluency
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto">
              No recurring monthly subscriptions. Pay once via Razorpay and unlock unlimited AI tutoring across all 11 Indian languages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-3xl mx-auto">
            {/* Free Tier */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Free Tier</span>
                <h4 className="text-2xl font-bold text-white mt-1">Introductory Pass</h4>
                <div className="text-3xl font-black text-white mt-2">₹0</div>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-3 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 2 Complete Practice Sessions
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Full 3-Activity Stepper
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Single-turn Speak Feedback
                </li>
              </ul>
              <Link
                to="/register"
                className="block text-center w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition"
              >
                Get Started Free
              </Link>
            </div>

            {/* Premium Tier */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-900 border-2 border-indigo-500/50 space-y-4 shadow-xl shadow-indigo-500/10">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Lifetime Premium</span>
                  <h4 className="text-2xl font-bold text-white mt-1">Unlimited Pro</h4>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-black text-white">₹299</span>
                    <span className="text-xs text-slate-400 line-through">₹999</span>
                    <span className="text-[10px] font-bold text-emerald-400">ONE-TIME</span>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Crown className="w-5 h-5" />
                </div>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-200 pt-3 border-t border-indigo-500/20">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" /> Unlimited Daily Lessons Forever
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" /> 5-Turn Conversational Roleplays
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> All 11 Indian Languages
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" /> Adaptive Difficulty Progression
                </li>
              </ul>
              <Link
                to="/register"
                className="block text-center w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition"
              >
                Join Premium Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-slate-800/80 py-8 px-4 text-center text-xs text-slate-500 space-y-2">
        <p>© 2026 VaaniTutor — AI Voice Language Tutor. Built with precision for NxtWave GenAI Project Submission.</p>
        <p className="text-slate-600">
          Kannada • Hindi • English • Tamil • Telugu • Bengali • Marathi • Gujarati • Punjabi • Malayalam • Odia
        </p>
      </footer>
    </div>
  );
}
