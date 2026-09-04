import axios from 'axios';
import useAuthStore from '../store/authStore';

/**
 * Axios instance for server-ai (AI microservice).
 * Base URL points to the Python FastAPI backend.
 * Automatically attaches Bearer token from auth store.
 */
const aiApi = axios.create({
  baseURL: import.meta.env.VITE_AI_API_URL || 'http://localhost:8000',
  timeout: 30000,
});

// ─── Request interceptor: attach JWT ───
aiApi.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: handle 401 → logout ───
aiApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Submit recorded audio blob for STT transcription.
 * Spec Section 6.2, 6.4, 8.2 & 12.
 */
export async function transcribeAudio(audioBlob, languageCode) {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'speech_recording.webm');
  formData.append('languageCode', languageCode);

  const response = await aiApi.post('/api/practice/transcribe', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

export default aiApi;
