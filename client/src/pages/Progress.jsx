import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame, Award, BookOpen, Activity, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';
import AppShell from '../components/AppShell/AppShell';
import ProgressChart from '../components/ProgressChart/ProgressChart';
import useAuthStore from '../store/authStore';
import './Progress.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const LANGUAGE_NAMES = {
  'en-IN': 'Indian English',
  'hi-IN': 'Hindi (हिन्दी)',
  'kn-IN': 'Kannada (ಕನ್ನಡ)',
  'ta-IN': 'Tamil (தமிழ்)',
  'te-IN': 'Telugu (తెలుగు)',
  'bn-IN': 'Bengali (বাংলা)',
  'mr-IN': 'Marathi (मराठी)',
  'gu-IN': 'Gujarati (ગુજરાતી)',
  'pa-IN': 'Punjabi (ਪੰਜਾਬੀ)',
  'ml-IN': 'Malayalam (മലയാളം)',
  'od-IN': 'Odia (ଓଡ଼ିଆ)',
};

export default function Progress() {
  const { languageCode } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progressData, setProgressData] = useState(null);

  useEffect(() => {
    async function fetchProgress() {
      if (!languageCode) return;
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`${API_BASE_URL}/api/progress/${languageCode}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data && res.data.success) {
          setProgressData(res.data.data);
        } else {
          setError('Failed to load progress data');
        }
      } catch (err) {
        console.error('[Progress Page] Fetch error:', err);
        setError(err.response?.data?.error || 'Unable to retrieve progress statistics.');
      } finally {
        setLoading(false);
      }
    }

    fetchProgress();
  }, [languageCode, token]);

  const langName = LANGUAGE_NAMES[languageCode] || languageCode;

  return (
    <AppShell>
      <div className="progress-page-container">
        {/* Navigation & Header */}
        <div className="progress-header">
          <button
            type="button"
            className="back-btn"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={18} />
            <span>Dashboard</span>
          </button>

          <div className="header-text">
            <h1 className="progress-title">{langName} Analytics</h1>
            <p className="progress-subtitle">
              Comprehensive fluency history, error taxonomy insights, and adaptive difficulty tracking.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="progress-loading-state">
            <Loader2 className="animate-spin" size={36} color="#6366f1" />
            <p>Loading analytics and learning history...</p>
          </div>
        ) : error ? (
          <div className="progress-error-state">
            <p className="error-msg">{error}</p>
            <button
              type="button"
              className="retry-btn"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : progressData ? (
          <div className="progress-content">
            {/* Top Stat Cards */}
            <div className="stats-summary-grid">
              <div className="stat-card">
                <div className="stat-icon-wrapper fluency-icon">
                  <Award size={24} />
                </div>
                <div className="stat-details">
                  <span className="stat-label">Average Fluency</span>
                  <span className="stat-value">
                    {progressData.stats.avgFluencyScore
                      ? `${progressData.stats.avgFluencyScore}%`
                      : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper streak-icon">
                  <Flame size={24} />
                </div>
                <div className="stat-details">
                  <span className="stat-label">Daily Streak</span>
                  <span className="stat-value">
                    {progressData.language.currentStreak} Day{progressData.language.currentStreak !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper level-icon">
                  <BookOpen size={24} />
                </div>
                <div className="stat-details">
                  <span className="stat-label">Current Level</span>
                  <span className="stat-value capitalize">
                    {progressData.language.level || 'Beginner'}
                  </span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper session-icon">
                  <Activity size={24} />
                </div>
                <div className="stat-details">
                  <span className="stat-label">Recorded Sessions</span>
                  <span className="stat-value">
                    {progressData.fluencyTrend ? progressData.fluencyTrend.length : 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Adaptive Recommendation Banner */}
            {progressData.adaptiveStatus && (
              <div className="adaptive-banner">
                <div className="adaptive-banner-header">
                  <Sparkles size={20} className="sparkle-icon" />
                  <h4>Adaptive Difficulty Engine</h4>
                </div>
                <p>
                  {progressData.adaptiveStatus.levelChanged ? (
                    <span>
                      🎉 <strong>Level Updated:</strong> Your proficiency has adjusted from{' '}
                      <span className="capitalize font-semibold">{progressData.adaptiveStatus.previousLevel}</span> to{' '}
                      <span className="capitalize font-semibold text-indigo-400">{progressData.adaptiveStatus.newLevel}</span> based on your rolling fluency average of{' '}
                      <strong>{progressData.adaptiveStatus.rollingAvg}%</strong>.
                    </span>
                  ) : progressData.adaptiveStatus.rollingAvg ? (
                    <span>
                      Your rolling 3-session fluency average is <strong>{progressData.adaptiveStatus.rollingAvg}%</strong>. Your curriculum is dynamically tuned for the{' '}
                      <span className="capitalize font-semibold">{progressData.language.level}</span> tier.
                    </span>
                  ) : (
                    <span>
                      Complete 3 full practice sessions to establish your personalized rolling fluency baseline.
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Charts Component (Recharts) */}
            <ProgressChart
              fluencyTrend={progressData.fluencyTrend}
              errorTypeBreakdown={progressData.stats.errorTypeBreakdown}
            />
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
