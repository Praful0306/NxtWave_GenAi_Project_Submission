import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import LanguageCard from '../components/LanguageCard/LanguageCard';
import OnboardingWizard from '../components/OnboardingWizard/OnboardingWizard';
import { useLanguageStore } from '../store/languageStore';
import { useAuthStore } from '../store/authStore';
import { Plus, Globe, Flame, Award, Sparkles, Loader2, BookOpen } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { languages, fetchLanguages, isLoading } = useLanguageStore();
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchLanguages();
  }, []);

  const totalStreak = languages.reduce((acc, l) => Math.max(acc, l.currentStreak || 0), 0);
  const totalSessions = languages.reduce((acc, l) => acc + (l.sessionsCount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <motion.main
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 space-y-8"
      >
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-950/40 via-slate-900/90 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl"
        >
          <div className="absolute -right-10 -top-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-1 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5" /> Welcome back, {user?.name || 'Learner'}!
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              My Indic Language Journeys
            </h1>
            <p className="text-slate-400 text-sm">
              Practice speaking daily with AI feedback and build consistent fluency streaks.
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm transition-all shadow-xl shadow-indigo-600/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Enroll in New Language
            </motion.button>
          </div>
        </motion.div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            whileHover={{ y: -2 }}
            className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 flex items-center gap-4 shadow-lg"
          >
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{languages.length}</div>
              <div className="text-xs text-slate-400 font-medium">Active Languages</div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 flex items-center gap-4 shadow-lg"
          >
            <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame className="w-6 h-6 fill-amber-500" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{totalStreak} Days</div>
              <div className="text-xs text-slate-400 font-medium">Longest Active Streak</div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 flex items-center gap-4 shadow-lg"
          >
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{totalSessions}</div>
              <div className="text-xs text-slate-400 font-medium">Total Practice Sessions</div>
            </div>
          </motion.div>
        </div>

        {/* Language Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Active Enrollments</h2>
            <span className="text-xs text-slate-400 font-mono">{languages.length} enrolled</span>
          </div>

          {isLoading && languages.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-slate-400 text-sm">Loading your enrolled languages...</p>
            </div>
          ) : languages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-4 shadow-xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">No active language yet</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Start your first Indic language learning journey in 3 simple questions.
                </p>
              </div>
              <button
                onClick={() => navigate('/onboarding')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                Complete Onboarding Wizard <Sparkles className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
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
          )}
        </div>
      </motion.main>

      {/* Add Language Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="relative w-full max-w-3xl"
            >
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 z-10 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 text-sm font-bold cursor-pointer transition"
              >
                ✕
              </button>
              <OnboardingWizard
                isModal={true}
                onComplete={(langCode) => {
                  setShowAddModal(false);
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
