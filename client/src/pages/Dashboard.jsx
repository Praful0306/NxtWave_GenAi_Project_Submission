import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import LanguageCard from '../components/LanguageCard/LanguageCard';
import OnboardingWizard from '../components/OnboardingWizard/OnboardingWizard';
import { useLanguageStore, SUPPORTED_LANGUAGES } from '../store/languageStore';
import { useAuthStore } from '../store/authStore';
import {
  Plus,
  Globe,
  Flame,
  Award,
  Sparkles,
  Loader2,
  BookOpen,
  Mic,
  Puzzle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { languages, fetchLanguages, isLoading } = useLanguageStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalInitialLang, setModalInitialLang] = useState('kn-IN');

  useEffect(() => {
    fetchLanguages();
  }, []);

  const totalStreak = languages.reduce((acc, l) => Math.max(acc, l.currentStreak || 0), 0);
  const totalSessions = languages.reduce((acc, l) => acc + (l.sessionsCount || 0), 0);

  const handleStartLanguage = (langCode) => {
    setModalInitialLang(langCode);
    setShowAddModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <motion.main
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 space-y-10"
      >
        {/* ─── WELCOME HEADER BANNER ─── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-slate-800 p-6 sm:p-10 shadow-2xl backdrop-blur-xl overflow-hidden"
        >
          <div className="absolute -right-16 -top-16 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Learner Command Center</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Welcome back,{' '}
                <span className="bg-gradient-to-r from-indigo-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                  {user?.name || 'Learner'}!
                </span>
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                Practice native conversational speaking, word-order games, and retention quizzes across 11 Indian languages.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setModalInitialLang('kn-IN');
                  setShowAddModal(true);
                }}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Enroll New Language</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* ─── 3 STATS METRICS GRID ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ y: -3 }}
            className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl flex items-center gap-5 backdrop-blur-xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 shadow-inner">
              <Globe className="w-7 h-7" />
            </div>
            <div>
              <div className="text-3xl font-black text-white">{languages.length}</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                Active Enrolled Languages
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -3 }}
            className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl flex items-center gap-5 backdrop-blur-xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
              <Flame className="w-7 h-7 fill-amber-500" />
            </div>
            <div>
              <div className="text-3xl font-black text-white">{totalStreak} Days</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                Longest Active Streak
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -3 }}
            className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl flex items-center gap-5 backdrop-blur-xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <div className="text-3xl font-black text-white">{totalSessions}</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                Practice Sessions Completed
              </div>
            </div>
          </motion.div>
        </div>

        {/* ─── ACTIVE ENROLLMENTS OR FEATURED STARTER LANGUAGES ─── */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {languages.length > 0 ? 'My Active Roadmaps' : 'Choose a Language to Begin'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                {languages.length > 0
                  ? 'Continue today’s daily speak, game, and quiz sessions.'
                  : 'Start your personalized curriculum in Kannada, Hindi, English, Tamil, Telugu, and more.'}
              </p>
            </div>
            {languages.length > 0 && (
              <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-indigo-400 font-bold">
                {languages.length} Active
              </span>
            )}
          </div>

          {isLoading && languages.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-slate-400 text-sm">Loading your enrolled languages...</p>
            </div>
          ) : languages.length > 0 ? (
            /* User's Enrolled Languages Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {languages.map((lang, idx) => (
                <motion.div
                  key={lang.languageCode}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.08 }}
                >
                  <LanguageCard
                    userLanguage={lang}
                    onSelect={(l) => navigate(`/roadmap/${l.languageCode}`)}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            /* Starter Languages Showcase Grid (Empty State) */
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {SUPPORTED_LANGUAGES.map((lang, idx) => (
                  <motion.div
                    key={lang.code}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.04 }}
                    whileHover={{ y: -4 }}
                    className="p-5 rounded-3xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between space-y-4 group backdrop-blur-xl"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-3xl p-2.5 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
                          {lang.flag}
                        </span>
                        {lang.tier === 1 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/25">
                            Tier 1 AI
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition">
                          {lang.name}
                        </h3>
                        <div className="text-xs text-slate-400 font-serif">{lang.nativeName}</div>
                      </div>
                      <p className="text-xs text-slate-400 italic bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        "{lang.sample}"
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartLanguage(lang.code)}
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-indigo-600 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/10"
                    >
                      <span>Start {lang.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Habit Highlights Banner */}
              <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                    <Mic className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">1. Speak AI Roleplay</h4>
                    <p className="text-xs text-slate-400">
                      Practice real speech with sub-250ms streaming feedback and pronunciation tips.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                    <Puzzle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">2. Word Scramble Game</h4>
                    <p className="text-xs text-slate-400">
                      Drag and tap native words to form natural, grammatically correct sentences.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">3. Retention Quiz</h4>
                    <p className="text-xs text-slate-400">
                      Rapid recall questions that lock in grammar patterns and unlock tomorrow’s roadmap.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.main>

      {/* ─── ADD LANGUAGE ONBOARDING MODAL ─── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-3xl my-8"
            >
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 z-10 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 text-sm font-bold cursor-pointer transition shadow-lg"
              >
                ✕
              </button>
              <OnboardingWizard
                isModal={true}
                initialLanguage={modalInitialLang}
                onComplete={(langCode) => {
                  setShowAddModal(false);
                  fetchLanguages();
                  navigate(`/roadmap/${langCode}`);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
