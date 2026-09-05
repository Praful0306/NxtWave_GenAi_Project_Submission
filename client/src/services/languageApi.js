import api from './api';

/** Roadmap generation walks an LLM chain and may wake a sleeping host. */
export const ROADMAP_TIMEOUT_MS = 120000;

export const languageApi = {
  // Get all active language enrollments with roadmap progress
  getLanguages: async () => {
    const response = await api.get('/languages');
    return response.data;
  },

  // Generate a new roadmap (3-question onboarding).
  // Given its own generous timeout: this call fans out to the AI service and an
  // LLM chain, and on free-tier hosting the first request also pays for waking
  // a sleeping instance. The default 15s client timeout fires long before a
  // legitimate cold start finishes.
  generateRoadmap: async ({ languageCode, level, goalDurationDays }) => {
    const response = await api.post(
      '/roadmap/generate',
      { languageCode, level, goalDurationDays },
      { timeout: ROADMAP_TIMEOUT_MS }
    );
    return response.data;
  },

  // Get active roadmap by language code
  getRoadmap: async (languageCode) => {
    const response = await api.get(`/roadmap/${languageCode}`);
    return response.data;
  },

  // Regenerate roadmap on settings edit (Spec Section 6.8)
  regenerateRoadmap: async (languageCode, { newLevel, newGoalDurationDays }) => {
    const response = await api.post(
      `/roadmap/${languageCode}/regenerate`,
      { newLevel, newGoalDurationDays },
      { timeout: ROADMAP_TIMEOUT_MS }
    );
    return response.data;
  },

  // Update language status (active / archived)
  updateStatus: async (languageCode, status) => {
    const response = await api.patch(`/languages/${languageCode}/status`, { status });
    return response.data;
  },
};

export default languageApi;
