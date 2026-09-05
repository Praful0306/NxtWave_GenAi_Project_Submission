import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Volume2, Sparkles, CheckCircle2 } from 'lucide-react';

const INDIC_LANGUAGES = [
  {
    code: 'kn-IN',
    name: 'Kannada',
    native: 'ಕನ್ನಡ',
    tier: 'Tier 1 Support',
    flag: '🇮🇳',
    sample: 'ನಮಸ್ಕಾರ, ನೀವು ಹೇಗಿದ್ದೀರಿ?',
    translation: 'Hello, how are you?',
    border: 'border-amber-500/40',
    badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  },
  {
    code: 'hi-IN',
    name: 'Hindi',
    native: 'हिन्दी',
    tier: 'Tier 1 Support',
    flag: '🇮🇳',
    sample: 'नमस्ते, आप कैसे हैं?',
    translation: 'Hello, how are you?',
    border: 'border-orange-500/40',
    badge: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  },
  {
    code: 'en-IN',
    name: 'English (India)',
    native: 'English',
    tier: 'Tier 1 Support',
    flag: '🇮🇳',
    sample: 'Good morning! How are you doing today?',
    translation: 'Daily conversational greeting',
    border: 'border-indigo-500/40',
    badge: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  },
  {
    code: 'ta-IN',
    name: 'Tamil',
    native: 'தமிழ்',
    tier: 'Native Neural Voice',
    flag: '🇮🇳',
    sample: 'வணக்கம், நீங்கள் எப்படி இருக்கிறீர்கள்?',
    translation: 'Hello, how are you?',
    border: 'border-emerald-500/40',
    badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  },
  {
    code: 'te-IN',
    name: 'Telugu',
    native: 'తెలుగు',
    tier: 'Native Neural Voice',
    flag: '🇮🇳',
    sample: 'నమస్కారం, మీరు ఎలా ఉన్నారు?',
    translation: 'Hello, how are you?',
    border: 'border-sky-500/40',
    badge: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
  },
  {
    code: 'bn-IN',
    name: 'Bengali',
    native: 'বাংলা',
    tier: 'Native Neural Voice',
    flag: '🇮🇳',
    sample: 'নমস্কার, আপনি কেমন আছেন?',
    translation: 'Hello, how are you?',
    border: 'border-rose-500/40',
    badge: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
  },
  {
    code: 'mr-IN',
    name: 'Marathi',
    native: 'मराठी',
    tier: 'Native Neural Voice',
    flag: '🇮🇳',
    sample: 'नमस्कार, तुम्ही कसे आहात?',
    translation: 'Hello, how are you?',
    border: 'border-purple-500/40',
    badge: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  },
  {
    code: 'gu-IN',
    name: 'Gujarati',
    native: 'ગુજરાતી',
    tier: 'Native Neural Voice',
    flag: '🇮🇳',
    sample: 'નમસ્તે, તમે કેમ છો?',
    translation: 'Hello, how are you?',
    border: 'border-yellow-500/40',
    badge: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  },
  {
    code: 'pa-IN',
    name: 'Punjabi',
    native: 'ਪੰਜਾਬੀ',
    tier: 'Native Neural Voice',
    flag: '🇮🇳',
    sample: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ?',
    translation: 'Greetings, how are you?',
    border: 'border-lime-500/40',
    badge: 'bg-lime-500/20 text-lime-300 border border-lime-500/30',
  },
  {
    code: 'ml-IN',
    name: 'Malayalam',
    native: 'മലയാളം',
    tier: 'Native Neural Voice',
    flag: '🇮🇳',
    sample: 'നമസ്കാരം, സുഖമാണോ?',
    translation: 'Hello, are you well?',
    border: 'border-teal-500/40',
    badge: 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
  },
  {
    code: 'od-IN',
    name: 'Odia',
    native: 'ଓଡ଼ିଆ',
    tier: 'Native Neural Voice',
    flag: '🇮🇳',
    sample: 'ନମସ୍କାର, ଆପଣ କେମିତି ଅଛନ୍ତି?',
    translation: 'Hello, how are you?',
    border: 'border-fuchsia-500/40',
    badge: 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30',
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
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Multi-Lingual Indic Spectrum</span>
        </div>
        <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Learn Across 11 Native Indian Languages
        </h3>
        <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto">
          Every language features independent curriculum pacing, native neural voice models, and AI roleplays.
        </p>
      </div>

      {/* Main Interactive Showcase Card */}
      <div className={`p-6 sm:p-8 rounded-3xl bg-slate-900/90 border-2 ${activeLang.border} shadow-2xl backdrop-blur-xl transition-all duration-300 space-y-6`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-3xl p-3 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
              {activeLang.flag}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-2xl font-black text-white">{activeLang.name}</h4>
                <span className="text-xl font-bold text-indigo-300 font-serif">
                  ({activeLang.native})
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${activeLang.badge}`}>
                  {activeLang.tier}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Code: {activeLang.code}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={handlePrev}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Phrase Box */}
        <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Sample Practice Sentence</span>
            <span className="flex items-center gap-1.5 text-indigo-400">
              <Volume2 className="w-3.5 h-3.5 animate-pulse" /> Neural TTS Ready
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-amber-300 tracking-wide">
            "{activeLang.sample}"
          </p>
          <p className="text-xs text-slate-400 italic">
            English: "{activeLang.translation}"
          </p>
        </div>

        {/* Language Selection Chips */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 border-t border-slate-800/80">
          {INDIC_LANGUAGES.map((lang, idx) => (
            <button
              key={lang.code}
              onClick={() => setCurrentIndex(idx)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                idx === currentIndex
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 border border-slate-800'
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
