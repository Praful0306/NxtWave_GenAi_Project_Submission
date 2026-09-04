import { create } from 'zustand';
import languageApi from '../services/languageApi';

export const SUPPORTED_LANGUAGES = [
  { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🟡🔴', tier: 1, sample: 'ನಮಸ್ಕಾರ, ನೀವು ಹೇಗಿದ್ದೀರಾ?' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', flag: '🟠⚪', tier: 1, sample: 'नमस्ते, आप कैसे हैं?' },
  { code: 'en-IN', name: 'English (India)', nativeName: 'English', flag: '🔵⚪', tier: 1, sample: 'Hello, how are you?' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', flag: '🔴🟡', tier: 2, sample: 'வணக்கம், எப்படி இருக்கிறீர்கள்?' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు', flag: '🟣⚪', tier: 2, sample: 'నమస్కారం, ఎలా ఉన్నారు?' },
  { code: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা', flag: '🟢🔴', tier: 2, sample: 'নমস্কার, কেমন আছেন?' },
  { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी', flag: '🟠🟢', tier: 2, sample: 'नमस्कार, कसे आहात?' },
  { code: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🔴⚪', tier: 2, sample: 'નમસ્તે, કેમ છો?' },
  { code: 'pa-IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🟡🔵', tier: 2, sample: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ?' },
  { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🟢⚪', tier: 2, sample: 'നമസ്കാരം, സുഖമാണോ?' },
  { code: 'od-IN', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🔴🟡', tier: 2, sample: 'ନମସ୍କାର, କେମିତି ଅଛନ୍ତି?' },
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
