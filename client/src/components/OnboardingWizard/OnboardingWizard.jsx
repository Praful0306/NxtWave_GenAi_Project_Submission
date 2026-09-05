import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SUPPORTED_LANGUAGES, useLanguageStore } from '../../store/languageStore';
import { Globe, Award, Calendar, ArrowRight, ArrowLeft, Sparkles, CheckCircle2, Loader2, Sliders } from 'lucide-react';

const LEVELS = [
  {
    id: 'Basic',
    title: 'Complete Beginner (Basic)',
    description: 'Little to no experience. Start with essential greetings, polite phrases, numbers, and basic survival dialogue.',
    badge: 'Level 1',
    icon: '🌱',
  },
  {
    id: 'Intermediate',
    title: 'Conversational (Intermediate)',
    description: 'Can understand basic phrases. Focus on complex sentence structure, everyday social interactions, and active speaking fluency.',
    badge: 'Level 2',
    icon: '🚀',
  },
  {
    id: 'Advanced',
    title: 'Fluent & Professional (Advanced)',
    description: 'Comfortable with everyday speech. Focus on nuanced idioms, professional discussions, rapid comprehension, and native-like rhythm.',
    badge: 'Level 3',
    icon: '💎',
  },
];

const DURATION_PRESETS = [
  { days: 7, label: '7 Days', title: 'Sprint Pace' },
  { days: 14, label: '14 Days', title: 'Steady Pace' },
  { days: 30, label: '30 Days', title: 'Comprehensive', popular: true },
  { days: 60, label: '60 Days', title: 'Deep Immersion' },
];

export default function OnboardingWizard({ onComplete, isModal = false, initialLanguage = 'kn-IN' }) {
  const navigate = useNavigate();
  const { generateRoadmap, isLoading } = useLanguageStore();

  const [step, setStep] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage);
  const [selectedLevel, setSelectedLevel] = useState('Basic');
  const [goalDays, setGoalDays] = useState(30);
  const [error, setError] = useState(null);

  const activeLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  const handleFinish = async () => {
    setError(null);
    try {
      await generateRoadmap({
        languageCode: selectedLanguage,
        level: selectedLevel,
        goalDurationDays: Math.min(Math.max(parseInt(goalDays, 10) || 30, 3), 180),
      });

      if (onComplete) {
        onComplete(selectedLanguage);
      } else {
        navigate(`/roadmap/${selectedLanguage}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to generate roadmap');
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Progress header */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          <span>Question {step} of 3</span>
          <span className="text-indigo-400 font-mono">{Math.round((step / 3) * 100)}% Completed</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-amber-500 transition-all duration-500 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ─── STEP 1: Select Target Language ─── */}
      {step === 1 && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium mb-3 border border-indigo-500/20">
              <Globe className="w-3.5 h-3.5" /> Question 1: Language
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Which Indian language do you want to learn?
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Select your target language. You can learn multiple languages simultaneously later.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = selectedLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={`flex flex-col text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{lang.flag}</span>
                    {lang.tier === 1 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        Tier 1 (Full AI STT)
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-white text-base flex items-center justify-between">
                    {lang.name}
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <div className="text-xs text-slate-400 font-serif mt-0.5">{lang.nativeName}</div>
                  <div className="text-[11px] text-slate-500 truncate mt-2 italic font-mono bg-slate-950/40 px-2 py-1 rounded-lg">
                    "{lang.sample}"
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              Continue to Starting Level <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 2: Select Starting Level ─── */}
      {step === 2 && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium mb-3 border border-indigo-500/20">
              <Award className="w-3.5 h-3.5" /> Question 2: Proficiency Level
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              What is your current level in {activeLangObj.name}?
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              We'll calibrate your curriculum, scenario prompts, and speech evaluation difficulty to match.
            </p>
          </div>

          <div className="space-y-3">
            {LEVELS.map((lvl) => {
              const isSelected = selectedLevel === lvl.id;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setSelectedLevel(lvl.id)}
                  className={`w-full flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                  }`}
                >
                  <div className="text-3xl p-2 rounded-xl bg-slate-900 border border-slate-800">
                    {lvl.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-white text-base">{lvl.title}</div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {lvl.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{lvl.description}</p>
                  </div>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-400 mt-1" />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              Continue to Goal Duration <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 3: Goal Duration (Bounded Range: 3 to 180 Days) ─── */}
      {step === 3 && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium mb-3 border border-indigo-500/20">
              <Calendar className="w-3.5 h-3.5" /> Question 3: Goal Duration (3–180 Days)
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              What is your target timeframe?
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Select a quick preset or adjust the slider to choose any duration between 3 and 180 days.
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {DURATION_PRESETS.map((preset) => {
              const isSelected = goalDays === preset.days;
              return (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => setGoalDays(preset.days)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/30 text-white font-bold'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-sm font-bold">{preset.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{preset.title}</div>
                </button>
              );
            })}
          </div>

          {/* Free-form Range Slider (3 - 180 Days per Spec Section 3 & 10) */}
          <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-400" /> Custom Duration:
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <input
                  type="number"
                  min="3"
                  max="180"
                  value={goalDays}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v)) setGoalDays(Math.min(Math.max(v, 3), 180));
                  }}
                  className="w-16 bg-slate-900 border border-slate-700 text-white text-sm font-bold text-center rounded-xl py-1 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-xs font-bold text-indigo-400">Days</span>
              </div>
            </div>

            <input
              type="range"
              min="3"
              max="180"
              value={goalDays}
              onChange={(e) => setGoalDays(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>3 days (Micro-course)</span>
              <span>30 days (Recommended)</span>
              <span>180 days (6 Months)</span>
            </div>
          </div>

          {/* Summary Box */}
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="text-xs">
              <div className="font-semibold text-white text-sm">
                Ready to generate your {activeLangObj.name} roadmap!
              </div>
              <div className="text-indigo-200/80 mt-0.5">
                {goalDays} Days • {selectedLevel} Level • Daily Speak → Game → Quiz Practice Sessions
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={handleFinish}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm transition-all duration-200 shadow-xl shadow-indigo-600/40 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating Curriculum...
                </>
              ) : (
                <>
                  Generate My Roadmap <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
