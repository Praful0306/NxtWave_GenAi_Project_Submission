import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell/AppShell';
import AudioRecorder from '../components/AudioRecorder/AudioRecorder';
import AssessmentCard from '../components/AssessmentCard/AssessmentCard';
import GameActivity from '../components/PracticeActivities/GameActivity';
import QuizActivity from '../components/PracticeActivities/QuizActivity';
import useAuthStore from '../store/authStore';
import { Mic, Puzzle, HelpCircle, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';
import './Practice.css';

const AI_URL = import.meta.env.VITE_AI_URL || 'http://localhost:8000';
const NODE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Practice() {
  const { languageCode = 'kn-IN' } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);

  // Session state from server-node DailySession
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState(null);
  const [dailySession, setDailySession] = useState(null);
  const [roadmapDay, setRoadmapDay] = useState(null);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0); // 0=Speak, 1=Game, 2=Quiz, 3=Completed
  const [speakTurnIndex, setSpeakTurnIndex] = useState(0);
  const [maxTurns, setMaxTurns] = useState(1);
  const [isPremium, setIsPremium] = useState(false);

  // Speak activity interaction state
  const [transcript, setTranscript] = useState('');
  const [assessment, setAssessment] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | transcribing | evaluating | evaluated | error
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmittingTurn, setIsSubmittingTurn] = useState(false);

  // Load or resume session on mount
  useEffect(() => {
    fetchDailySession();
  }, [languageCode]);

  const fetchDailySession = async () => {
    try {
      setSessionLoading(true);
      setSessionError(null);
      const res = await axios.get(`${NODE_URL}/api/practice/session/${languageCode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        const { dailySession: ds, roadmapDay: rd, currentActivityIndex: cai, speakTurnIndex: sti, maxTurns: mt, isPremium: ip } = res.data.data;
        setDailySession(ds);
        setRoadmapDay(rd);
        setCurrentActivityIndex(cai);
        setSpeakTurnIndex(sti);
        setMaxTurns(mt);
        setIsPremium(ip);
      }
    } catch (err) {
      console.error('Failed to load session:', err);
      if (err.response?.status === 402) {
        navigate('/paywall', { state: { from: `/practice/${languageCode}` } });
        return;
      }
      setSessionError(err.response?.data?.error || 'Failed to initialize session');
    } finally {
      setSessionLoading(false);
    }
  };

  // Target sentence & topic from active roadmap day
  const targetSentence =
    roadmapDay?.promptText ||
    (roadmapDay?.targetPhrases && roadmapDay?.targetPhrases[0]) ||
    'ನಮಸ್ಕಾರ, ನೀವು ಹೇಗಿದ್ದೀರಿ?';
  const targetTranslation = roadmapDay?.translationEnglish || 'Hello, how are you?';
  const scenario = roadmapDay?.scenario || 'Daily conversational practice.';
  const dayNumber = dailySession?.dayNumber || 1;

  // Handle recorded speech submission
  const handleAudioReady = async (audioBlob) => {
    setStatus('transcribing');
    setErrorMsg('');
    setAssessment(null);
    setTranscript('');

    try {
      // 1. Transcribe voice via AI STT
      const formData = new FormData();
      formData.append('audio', audioBlob, 'speech.webm');
      formData.append('languageCode', languageCode);

      const sttRes = await axios.post(`${AI_URL}/api/practice/transcribe`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      const userSpoken = sttRes.data.transcript || '';
      setTranscript(userSpoken);

      // 2. Evaluate via 7-tier LLM chain
      setStatus('evaluating');
      const evalRes = await axios.post(
        `${AI_URL}/api/practice/feedback`,
        {
          targetSentence,
          userTranscript: userSpoken,
          languageCode,
          userLevel: 'beginner',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const evalData = { ...evalRes.data, languageCode };
      setAssessment(evalData);
      setStatus('evaluated');

      // 3. Record turn on server-node
      setIsSubmittingTurn(true);
      const turnRes = await axios.post(
        `${NODE_URL}/api/practice/session/${languageCode}/speak-turn`,
        {
          targetSentence,
          userTranscript: userSpoken,
          correctedText: evalData.correctedText,
          aiReplyText: evalData.aiReply,
          errors: evalData.errors,
          fluencyScore: evalData.fluencyScore,
          encouragement: evalData.encouragement,
          providerUsed: evalData.providerUsed,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (turnRes.data.success) {
        const { speakTurnIndex: newTurn, currentActivityIndex: newAct } = turnRes.data.data;
        setSpeakTurnIndex(newTurn);
        if (newAct > 0) {
          // Speak completed, advance to Game
          setCurrentActivityIndex(newAct);
        }
      }
    } catch (err) {
      console.error('Practice exchange error:', err);
      setStatus('error');
      setErrorMsg(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          'Failed to complete voice exchange. Please try again.'
      );
    } finally {
      setIsSubmittingTurn(false);
    }
  };

  const handleSpeakRetry = () => {
    setAssessment(null);
    setTranscript('');
    setStatus('idle');
    setErrorMsg('');
  };

  const handleSpeakNextTurn = () => {
    if (speakTurnIndex >= maxTurns) {
      setCurrentActivityIndex(1); // Advance to Game
    } else {
      handleSpeakRetry();
    }
  };

  // Activity 2: Game complete
  const handleGameComplete = async (gameData) => {
    try {
      const res = await axios.post(
        `${NODE_URL}/api/practice/session/${languageCode}/game`,
        gameData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setCurrentActivityIndex(2); // Advance to Quiz
      }
    } catch (err) {
      console.error('Failed to submit game:', err);
    }
  };

  // Activity 3: Quiz complete
  const handleQuizComplete = async (quizData) => {
    try {
      const res = await axios.post(
        `${NODE_URL}/api/practice/session/${languageCode}/quiz`,
        quizData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setCurrentActivityIndex(3); // Completed!
      }
    } catch (err) {
      console.error('Failed to submit quiz:', err);
    }
  };

  if (sessionLoading) {
    return (
      <AppShell>
        <div className="loading-fullscreen">
          <Loader2 className="animate-spin text-primary" size={36} />
          <p>Loading your personalized practice session...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="practice-container">
        {/* Header with Stepper */}
        <div className="practice-header">
          <button className="back-link" onClick={() => navigate(`/roadmap/${languageCode}`)}>
            <ArrowLeft size={16} />
            <span>Back to Roadmap</span>
          </button>
          <div className="header-meta">
            <h2 className="practice-title">Day {dayNumber}: {roadmapDay?.topic || 'Daily Practice'}</h2>
            <span className="language-badge">{languageCode}</span>
          </div>
        </div>

        {/* 3-Activity Stepper Indicator (Spec Section 6.9a) */}
        <div className="session-stepper">
          <div className={`step-item ${currentActivityIndex === 0 ? 'active' : currentActivityIndex > 0 ? 'completed' : ''}`}>
            <div className="step-icon-bubble">
              <Mic size={16} />
            </div>
            <div className="step-info">
              <span className="step-number">Activity 1</span>
              <span className="step-name">Speak ({speakTurnIndex}/{maxTurns})</span>
            </div>
          </div>

          <div className="step-connector"></div>

          <div className={`step-item ${currentActivityIndex === 1 ? 'active' : currentActivityIndex > 1 ? 'completed' : ''}`}>
            <div className="step-icon-bubble">
              <Puzzle size={16} />
            </div>
            <div className="step-info">
              <span className="step-number">Activity 2</span>
              <span className="step-name">Word Scramble</span>
            </div>
          </div>

          <div className="step-connector"></div>

          <div className={`step-item ${currentActivityIndex >= 2 ? 'active' : ''} ${currentActivityIndex === 3 ? 'completed' : ''}`}>
            <div className="step-icon-bubble">
              <HelpCircle size={16} />
            </div>
            <div className="step-info">
              <span className="step-number">Activity 3</span>
              <span className="step-name">Recall Quiz</span>
            </div>
          </div>
        </div>

        {/* ACTIVITY 1: SPEAK */}
        {currentActivityIndex === 0 && (
          <div className="activity-wrapper">
            <div className="challenge-prompt-card">
              <div className="prompt-header-row">
                <span className="prompt-label">
                  {isPremium ? `Turn ${speakTurnIndex + 1} of ${maxTurns} • Roleplay Dialogue` : 'Speak this sentence clearly:'}
                </span>
                {isPremium && (
                  <span className="premium-badge">
                    <Sparkles size={12} /> Premium Conversational
                  </span>
                )}
              </div>
              <h3 className="target-phrase">{targetSentence}</h3>
              <p className="target-translation">"{targetTranslation}"</p>
              {scenario && <p className="scenario-context">📍 Scenario: {scenario}</p>}
            </div>

            <div className="recorder-section">
              <AudioRecorder
                onAudioReady={handleAudioReady}
                maxDurationSec={20}
                disabled={status === 'transcribing' || status === 'evaluating' || isSubmittingTurn}
              />

              {status === 'transcribing' && (
                <div className="status-indicator">
                  <span className="spinner"></span> Transcribing your voice via AI STT...
                </div>
              )}

              {status === 'evaluating' && (
                <div className="status-indicator">
                  <span className="spinner"></span> Evaluating grammatical precision & fluency...
                </div>
              )}

              {status === 'error' && <div className="error-banner">⚠️ {errorMsg}</div>}
            </div>

            {status === 'evaluated' && assessment && (
              <AssessmentCard
                assessment={assessment}
                targetSentence={targetSentence}
                userTranscript={transcript}
                onRetry={handleSpeakRetry}
                onNext={handleSpeakNextTurn}
                isLoading={isSubmittingTurn}
              />
            )}
          </div>
        )}

        {/* ACTIVITY 2: WORD-ORDER GAME */}
        {currentActivityIndex === 1 && (
          <div className="activity-wrapper">
            <GameActivity
              targetSentence={targetSentence}
              languageCode={languageCode}
              onComplete={handleGameComplete}
            />
          </div>
        )}

        {/* ACTIVITY 3: RECALL QUIZ & COMPLETION */}
        {currentActivityIndex >= 2 && (
          <div className="activity-wrapper">
            <QuizActivity
              quiz={roadmapDay?.quiz || []}
              dayNumber={dayNumber}
              targetSentence={targetSentence}
              onComplete={handleQuizComplete}
            />
            {currentActivityIndex === 3 && (
              <div className="session-complete-actions">
                <button
                  type="button"
                  className="btn btn-primary next-day-btn"
                  onClick={() => navigate(`/roadmap/${languageCode}`)}
                >
                  Return to Roadmap Timeline ➔
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
