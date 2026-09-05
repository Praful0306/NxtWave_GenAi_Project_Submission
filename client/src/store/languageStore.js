import { create } from 'zustand';
import languageApi from '../services/languageApi';

/**
 * Six harmonised tones cycled across the language list. A restrained earthy set
 * rather than one hue per language — eleven competing gradients read as noise.
 * Each tone is theme-aware, so tiles stay legible in light and dark.
 */
export const LANGUAGE_TONES = {
  teal: {
    tile: 'bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-300',
    bar: 'bg-teal-600 dark:bg-teal-400',
    ring: 'ring-teal-500/30',
  },
  saffron: {
    tile: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
    bar: 'bg-amber-500 dark:bg-amber-400',
    ring: 'ring-amber-500/30',
  },
  clay: {
    tile: 'bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300',
    bar: 'bg-orange-600 dark:bg-orange-400',
    ring: 'ring-orange-500/30',
  },
  moss: {
    tile: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
    bar: 'bg-emerald-600 dark:bg-emerald-400',
    ring: 'ring-emerald-500/30',
  },
  rust: {
    tile: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
    bar: 'bg-rose-600 dark:bg-rose-400',
    ring: 'ring-rose-500/30',
  },
  steel: {
    tile: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-500/15 dark:text-cyan-300',
    bar: 'bg-cyan-700 dark:bg-cyan-400',
    ring: 'ring-cyan-500/30',
  },
};

export const SUPPORTED_LANGUAGES = [
  {
    code: 'kn-IN',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    script: 'ಕ',
    tone: 'teal',
    tier: 1,
    sample: 'ನಮಸ್ಕಾರ, ನೀವು ಹೇಗಿದ್ದೀರಾ?',
    sampleEnglish: 'Hello, how are you?',
  },
  {
    code: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    script: 'अ',
    tone: 'saffron',
    tier: 1,
    sample: 'नमस्ते, आप कैसे हैं?',
    sampleEnglish: 'Hello, how are you?',
  },
  {
    code: 'en-IN',
    name: 'English (India)',
    nativeName: 'English',
    script: 'En',
    tone: 'steel',
    tier: 1,
    sample: 'Hello, how are you doing today?',
    sampleEnglish: 'Everyday conversational greeting',
  },
  {
    code: 'ta-IN',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    script: 'த',
    tone: 'moss',
    tier: 2,
    sample: 'வணக்கம், எப்படி இருக்கிறீர்கள்?',
    sampleEnglish: 'Hello, how are you?',
  },
  {
    code: 'te-IN',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    script: 'తె',
    tone: 'clay',
    tier: 2,
    sample: 'నమస్కారం, మీరు ఎలా ఉన్నారు?',
    sampleEnglish: 'Hello, how are you?',
  },
  {
    code: 'bn-IN',
    name: 'Bengali',
    nativeName: 'বাংলা',
    script: 'বা',
    tone: 'rust',
    tier: 2,
    sample: 'নমস্কার, কেমন আছেন?',
    sampleEnglish: 'Hello, how are you?',
  },
  {
    code: 'mr-IN',
    name: 'Marathi',
    nativeName: 'मराठी',
    script: 'म',
    tone: 'teal',
    tier: 2,
    sample: 'नमस्कार, कसे आहात?',
    sampleEnglish: 'Hello, how are you?',
  },
  {
    code: 'gu-IN',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    script: 'ગુ',
    tone: 'saffron',
    tier: 2,
    sample: 'નમસ્તે, તમે કેમ છો?',
    sampleEnglish: 'Hello, how are you?',
  },
  {
    code: 'pa-IN',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    script: 'ਪੰ',
    tone: 'moss',
    tier: 2,
    sample: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ?',
    sampleEnglish: 'Greetings, how are you?',
  },
  {
    code: 'ml-IN',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    script: 'മ',
    tone: 'steel',
    tier: 2,
    sample: 'നമസ്കാരം, സുഖമാണോ?',
    sampleEnglish: 'Hello, are you well?',
  },
  {
    code: 'od-IN',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    script: 'ଓ',
    tone: 'clay',
    tier: 2,
    sample: 'ନମସ୍କାର, କେମିତି ଅଛନ୍ତି?',
    sampleEnglish: 'Hello, how are you?',
  },
];

const FALLBACK_TONE = 'teal';

/** Look up a language's display metadata, falling back safely for unknown codes. */
export function getLanguageMeta(code) {
  const found = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  if (found) return { ...found, ...LANGUAGE_TONES[found.tone] };
  return {
    code,
    name: code,
    nativeName: '',
    script: '·',
    tier: 2,
    sample: '',
    sampleEnglish: '',
    ...LANGUAGE_TONES[FALLBACK_TONE],
  };
}

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
