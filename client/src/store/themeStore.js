import { create } from 'zustand';

/**
 * Theme store — manages Light / Dark / System preference.
 *
 * - Persisted to localStorage
 * - Synced with profile on login (themePreference)
 * - Applies/removes 'dark' class on document.documentElement
 */
const useThemeStore = create((set, get) => ({
  // ─── State ───
  theme: localStorage.getItem('vaanitutor_theme') || 'system', // 'light' | 'dark' | 'system'

  // ─── Actions ───

  /**
   * Set theme and apply it immediately.
   */
  setTheme: (theme) => {
    localStorage.setItem('vaanitutor_theme', theme);
    set({ theme });
    applyTheme(theme);
  },

  /**
   * Initialize theme on app mount. Call once in App.jsx.
   */
  initTheme: () => {
    const theme = get().theme;
    applyTheme(theme);

    // Listen for system preference changes (only matters when theme === 'system')
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (get().theme === 'system') {
        applyTheme('system');
      }
    });
  },
}));

/**
 * Apply theme to the DOM by toggling 'dark' class on <html>.
 */
function applyTheme(theme) {
  const root = document.documentElement;

  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // 'system' — follow OS preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}

export { useThemeStore };
export default useThemeStore;
