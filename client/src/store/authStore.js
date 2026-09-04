import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  // ─── State ───
  user: null,
  token: localStorage.getItem('vaanitutor_token') || null,
  isAuthenticated: !!localStorage.getItem('vaanitutor_token'),
  isLoading: true,

  // ─── Actions ───

  /**
   * Store token + user after login/register/OAuth.
   */
  login: (token, user = null) => {
    localStorage.setItem('vaanitutor_token', token);
    set({ token, user, isAuthenticated: true, isLoading: false });
  },

  /**
   * Clear everything on logout.
   */
  logout: () => {
    localStorage.removeItem('vaanitutor_token');
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
  },

  /**
   * Set user data (without changing token).
   */
  setUser: (user) => {
    set({ user });
  },

  /**
   * On app mount: check if stored token is still valid by hitting /api/auth/me.
   */
  checkAuth: async () => {
    const token = get().token;

    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const res = await api.get('/auth/me');
      set({ user: res.data, isAuthenticated: true, isLoading: false });
    } catch {
      // Token invalid or expired → clean up
      localStorage.removeItem('vaanitutor_token');
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
    }
  },

  /**
   * Update user profile field locally (after a successful PATCH).
   */
  updateUser: (updates) => {
    const currentUser = get().user;
    if (currentUser) {
      set({ user: { ...currentUser, ...updates } });
    }
  },
}));

export { useAuthStore };
export default useAuthStore;
