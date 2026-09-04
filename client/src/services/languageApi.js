import api from './api';

export const languageApi = {
  // Get all active language enrollments with roadmap progress
  getLanguages: async () => {
    const response = await api.get('/languages');
    return response.data;
  },

  // Generate a new roadmap (3-question onboarding)
  generateRoadmap: async ({ languageCode, level, goalDurationDays }) => {
    const response = await api.post('/roadmap/generate', {
      languageCode,
      level,
      goalDurationDays,
    });
    return response.data;
  },

  // Get active roadmap by language code
  getRoadmap: async (languageCode) => {
    const response = await api.get(`/roadmap/${languageCode}`);
    return response.data;
  },

  // Regenerate roadmap on settings edit (Spec Section 6.8)
  regenerateRoadmap: async (languageCode, { newLevel, newGoalDurationDays }) => {
    const response = await api.post(`/roadmap/${languageCode}/regenerate`, {
      newLevel,
      newGoalDurationDays,
    });
    return response.data;
  },

  // Update language status (active / archived)
  updateStatus: async (languageCode, status) => {
    const response = await api.patch(`/languages/${languageCode}/status`, { status });
    return response.data;
  },
};

export default languageApi;
