import React, { useState, useEffect } from 'react';
import { Sparkles, ChevronLeft, ChevronRight, Volume2, Award, Zap } from 'lucide-react';

const INDIC_LANGUAGES = [
  {
    code: 'kn-IN',
    name: 'Kannada',
    native: 'ಕನ್ನಡ',
    tier: 'Tier 1',
    flag: '🇮🇳',
    sample: 'ನಮಸ್ಕಾರ, ನೀವು ಹೇಗಿದ್ದೀರಿ?',
    translation: 'Hello, how are you?',
    accent: 'from-amber-500/20 to-orange-500/20',
    border: 'border-amber-500/40',
    badge: 'bg-amber-500/20 text-amber-300',
  },
  {
    code: 'hi-IN',
    name: 'Hindi',
    native: 'हिन्दी',
    tier: 'Tier 1',
    flag: '🇮🇳',
    sample: 'नमस्ते, आप कैसे हैं?',
    translation: 'Hello, how are you?',
    accent: 'from-orange-500/20 to-red-500/20',
    border: 'border-orange-500/40',
    badge: 'bg-orange-500/20 text-orange-300',
  },
  {
    code: 'en-IN',
    name: 'English (India)',
    native: 'English',
    tier: 'Tier 1',
    flag: '🇮🇳',
    sample: 'Good morning! How are you doing today?',
    translation: 'Daily conversational greeting',
    accent: 'from-indigo-500/20 to-blue-500/20',
    border: 'border-indigo-500/40',
    badge: 'bg-indigo-500/20 text-indigo-300',
  },
  {
    code: 'ta-IN',
    name: 'Tamil',
    native: 'தமிழ்',
    tier: 'Supported',
    flag: '🇮🇳',
    sample: 'வணக்கம், நீங்கள் எப்படி இருக்கிறீர்கள்?',
    translation: 'Hello, how are you?',
    accent: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-500/40',
    badge: 'bg-emerald-500/20 text-emerald-300',
  },
  {
    code: 'te-IN',
    name: 'Telugu',
    native: 'తెలుగు',
    tier: 'Supported',
    flag: '🇮🇳',
    sample: 'నమస్కారం, మీరు ఎలా ఉన్నారు?',
    translation: 'Hello, how are you?',
    accent: 'from-sky-500/20 to-indigo-500/20',
    border: 'border-sky-500/40',
    badge: 'bg-sky-500/20 text-sky-300',
  },
  {
    code: 'bn-IN',
    name: 'Bengali',
    native: 'বাংলা',
    tier: 'Supported',
    flag: '🇮🇳',
    sample: 'নমস্কার, আপনি কেমন আছেন?',
    translation: 'Hello, how are you?',
    accent: 'from-rose-500/20 to-pink-500/20',
    border: 'border-rose-500/40',
    badge: 'bg-rose-500/20 text-rose-300',
  },
  {
    code: 'mr-IN',
    name: 'Marathi',
    native: 'मराठी',
    tier: 'Supported',
    flag: '🇮🇳',
    sample: 'नमस्कार, तुम्ही कसे आहात?',
    translation: 'Hello, how are you?',
    accent: 'from-purple-500/20 to-indigo-500/20',
    border: 'border-purple-500/40',
    badge: 'bg-purple-500/20 text-purple-300',
  },
  {
    code: 'gu-IN',
    name: 'Gujarati',
    native: 'ગુજરાતી',
    tier: 'Supported',
    flag: '🇮🇳',
    sample: 'નમસ્તે, તમે કેમ છો?',
    translation: 'Hello, how are you?',
    accent: 'from-yellow-500/20 to-amber-500/20',
    border: 'border-yellow-500/40',
    badge: 'bg-yellow-500/20 text-yellow-300',
  },
  {
    code: 'pa-IN',
    name: 'Punjabi',
    native: 'ਪੰਜਾਬੀ',
    tier: 'Supported',
    flag: '🇮🇳',
    sample: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ?',
    translation: 'Greetings, how are you?',
    accent: 'from-lime-500/20 to-emerald-500/20',
    border: 'border-lime-500/40',
    badge: 'bg-lime-500/20 text-lime-300',
  },
  {
    code: 'ml-IN',
    name: 'Malayalam',
    native: 'മലയാളം',
    tier: 'Supported',
    flag: '🇮🇳',
    sample: 'നമസ്കാരം, സുഖമാണോ?',
    translation: 'Hello, are you well?',
    accent: 'from-teal-500/20 to-cyan-500/20',
    border: 'border-teal-500/40',
    badge: 'bg-teal-500/20 text-teal-300',
  },
  {
    code: 'od-IN',
    name: 'Odia',
    native: 'ଓଡ଼ିଆ',
    tier: 'Supported',
    flag: '🇮🇳',
    sample: 'ନମସ୍କାର, ଆପଣ କେମିତି ଅଛନ୍ତି?',
    translation: 'Hello, how are you?',
    accent: 'from-fuchsia-500/20 to-purple-500/20',
    border: 'border-fuchsia-500/40',
    badge: 'bg-fuchsia-500/20 text-fuchsia-300',
  },
];

export default function FeatureCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % INDIC_LANGUAGES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + INDIC_LANGUAGES.length) % INDIC_LANGUAGES.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % INDIC_LANGUAGES.length);
  };

  const activeLang = INDIC_LANGUAGES[currentIndex];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Multi-Lingual Indic Spectrum</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Learn Across 11 Native Indian Languages
        </h3>
        <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
          Every language features independent curriculum pacing, native neural voice models, and AI roleplays.
        </p>
      </div>

      {/* Main Interactive Card */}
      <div className={`relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br ${activeLang.accent} bg-slate-900/90 border-2 ${activeLang.border} shadow-2xl transition-all duration-500`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-4xl p-3 rounded-2xl bg-slate-950/60 border border-slate-800 shadow-inner">
              {activeLang.flag}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h4 className="text-2xl font-black text-white">{activeLang.name}</h4>
                <span className="text-xl font-bold text-indigo-300/80 font-serif">
                  ({activeLang.native})
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${activeLang.badge}`}>
                  {activeLang.tier}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Code: {activeLang.code}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
              title="Previous Language"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
              title="Next Language"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Phrase Showcase Box */}
        <div className="mt-6 p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Sample Practice Sentence</span>
            <span className="flex items-center gap-1 text-indigo-400">
              <Volume2 className="w-3.5 h-3.5 animate-pulse" /> Neural TTS Ready
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-amber-200 tracking-wide">
            "{activeLang.sample}"
          </p>
          <p className="text-xs text-slate-400 italic">
            English Translation: "{activeLang.translation}"
          </p>
        </div>

        {/* Language Dots */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {INDIC_LANGUAGES.map((lang, idx) => (
            <button
              key={lang.code}
              onClick={() => setCurrentIndex(idx)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                idx === currentIndex
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 border border-slate-800/80'
              }`}
            >
              {lang.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
