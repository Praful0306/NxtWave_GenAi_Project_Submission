import { create } from 'zustand';
import languageApi from '../services/languageApi';

export const SUPPORTED_LANGUAGES = [
  {
    code: 'kn-IN',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    script: 'ಕ',
    colorGradient: 'from-amber-500 to-orange-600',
    accentBorder: 'border-amber-500/40',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    tier: 1,
    sample: 'ನಮಸ್ಕಾರ, ನೀವು ಹೇಗಿದ್ದೀರಾ?',
  },
  {
    code: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    script: 'अ',
    colorGradient: 'from-orange-500 to-rose-600',
    accentBorder: 'border-orange-500/40',
    badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    tier: 1,
    sample: 'नमस्ते, आप कैसे हैं?',
  },
  {
    code: 'en-IN',
    name: 'English (India)',
    nativeName: 'English',
    script: 'En',
    colorGradient: 'from-indigo-500 to-blue-600',
    accentBorder: 'border-indigo-500/40',
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    tier: 1,
    sample: 'Hello, how are you doing today?',
  },
  {
    code: 'ta-IN',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    script: 'த',
    colorGradient: 'from-emerald-500 to-teal-600',
    accentBorder: 'border-emerald-500/40',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    tier: 2,
    sample: 'வணக்கம், எப்படி இருக்கிறீர்கள்?',
  },
  {
    code: 'te-IN',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    script: 'తె',
    colorGradient: 'from-sky-500 to-indigo-600',
    accentBorder: 'border-sky-500/40',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    tier: 2,
    sample: 'నమస్కారం, మీరు ఎలా ఉన్నారు?',
  },
  {
    code: 'bn-IN',
    name: 'Bengali',
    nativeName: 'বাংলা',
    script: 'বা',
    colorGradient: 'from-rose-500 to-pink-600',
    accentBorder: 'border-rose-500/40',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    tier: 2,
    sample: 'নমস্কার, কেমন আছেন?',
  },
  {
    code: 'mr-IN',
    name: 'Marathi',
    nativeName: 'मराठी',
    script: 'म',
    colorGradient: 'from-purple-500 to-indigo-600',
    accentBorder: 'border-purple-500/40',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    tier: 2,
    sample: 'नमस्कार, कसे आहात?',
  },
  {
    code: 'gu-IN',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    script: 'ગુ',
    colorGradient: 'from-yellow-500 to-amber-600',
    accentBorder: 'border-yellow-500/40',
    badgeClass: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    tier: 2,
    sample: 'નમસ્તે, તમે કેમ છો?',
  },
  {
    code: 'pa-IN',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    script: 'ਪੰ',
    colorGradient: 'from-lime-500 to-emerald-600',
    accentBorder: 'border-lime-500/40',
    badgeClass: 'bg-lime-500/15 text-lime-300 border-lime-500/30',
    tier: 2,
    sample: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ?',
  },
  {
    code: 'ml-IN',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    script: 'മല',
    colorGradient: 'from-teal-500 to-cyan-600',
    accentBorder: 'border-teal-500/40',
    badgeClass: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    tier: 2,
    sample: 'നമസ്കാരം, സുഖമാണോ?',
  },
  {
    code: 'od-IN',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    script: 'ଓ',
    colorGradient: 'from-fuchsia-500 to-purple-600',
    accentBorder: 'border-fuchsia-500/40',
    badgeClass: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
    tier: 2,
    sample: 'ନମସ୍କାର, କେମିତି ଅଛନ୍ତି?',
  },
];

export const useLanguageStore = create((set, get) => ({
  languages: [],
  activeLanguage: null,
  currentRoadmap: null,
  isLoading: false,
  error: null,

  fetchLanguages: async () => {
    set({ isLoading: true, error: null });
    try {
      const langs = await languageApi.getLanguages();
      const currentActive = get().activeLanguage;

      let nextActive = null;
      if (langs.length > 0) {
        nextActive = langs.find((l) => l.languageCode === currentActive?.languageCode) || langs[0];
      }

      set({
        languages: langs,
        activeLanguage: nextActive,
        isLoading: false,
      });

      if (nextActive) {
        get().fetchRoadmap(nextActive.languageCode);
      }
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
    }
  },

  setActiveLanguage: (lang) => {
    set({ activeLanguage: lang });
    if (lang?.languageCode) {
      get().fetchRoadmap(lang.languageCode);
    }
  },

  fetchRoadmap: async (languageCode) => {
    set({ isLoading: true, error: null });
    try {
      const data = await languageApi.getRoadmap(languageCode);
      set({ currentRoadmap: data.roadmap, isLoading: false });
      return data;
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
    }
  },

  generateRoadmap: async ({ languageCode, level, goalDurationDays }) => {
    set({ isLoading: true, error: null });
    try {
      const data = await languageApi.generateRoadmap({ languageCode, level, goalDurationDays });
      await get().fetchLanguages();
      set({ currentRoadmap: data.roadmap, isLoading: false });
      return data;
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      throw err;
    }
  },

  regenerateRoadmap: async (languageCode, { newLevel, newGoalDurationDays }) => {
    set({ isLoading: true, error: null });
    try {
      const data = await languageApi.regenerateRoadmap(languageCode, { newLevel, newGoalDurationDays });
      set({ currentRoadmap: data.roadmap, isLoading: false });
      await get().fetchLanguages();
      return data;
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      throw err;
    }
  },
}));
