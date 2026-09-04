import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LanguageCard from '../components/LanguageCard/LanguageCard';
import OnboardingWizard from '../components/OnboardingWizard/OnboardingWizard';
import { useLanguageStore } from '../store/languageStore';
import { useAuthStore } from '../store/authStore';
import { Plus, Globe, Flame, Award, Sparkles, Loader2 } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-1">
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition-all shadow-xl shadow-indigo-600/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Enroll in New Language
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{languages.length}</div>
              <div className="text-xs text-slate-400">Active Languages</div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame className="w-6 h-6 fill-amber-500" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{totalStreak} Days</div>
              <div className="text-xs text-slate-400">Longest Active Streak</div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{totalSessions}</div>
              <div className="text-xs text-slate-400">Total Practice Sessions</div>
            </div>
          </div>
        </div>

        {/* Language Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Active Enrollments</h2>
            <span className="text-xs text-slate-400 font-mono">{languages.length} languages enrolled</span>
          </div>

          {isLoading && languages.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-slate-400 text-sm">Loading your enrolled languages...</p>
            </div>
          ) : languages.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-4">
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
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30"
              >
                Complete Onboarding Wizard <Sparkles className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {languages.map((lang) => (
                <LanguageCard
                  key={lang.languageCode}
                  userLanguage={lang}
                  onSelect={(l) => navigate(`/roadmap/${l.languageCode}`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Language Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 z-10 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 text-sm font-bold"
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
          </div>
        </div>
      )}
    </div>
  );
}
