import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import AppShell from '../components/AppShell/AppShell';
import AudioRecorder from '../components/AudioRecorder/AudioRecorder';
import AssessmentCard from '../components/AssessmentCard/AssessmentCard';
import AudioPlayer from '../components/AudioPlayer/AudioPlayer';
import GameActivity from '../components/PracticeActivities/GameActivity';
import QuizActivity from '../components/PracticeActivities/QuizActivity';
import useAuthStore from '../store/authStore';
import { getLanguageMeta } from '../store/languageStore';
import api from '../services/api';
import {
  Button,
  Card,
  Badge,
  Alert,
  LoadingState,
  ProgressBar,
  cx,
} from '../components/ui';
import {
  Mic,
  Puzzle,
  ListChecks,
  ArrowLeft,
  Check,
  Sparkles,
  MapPin,
  PartyPopper,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const AI_URL = import.meta.env.VITE_AI_API_URL || import.meta.env.VITE_AI_URL || 'http://localhost:8000';

const ACTIVITIES = [
  { id: 0, label: 'Speak', icon: Mic },
  { id: 1, label: 'Word order', icon: Puzzle },
  { id: 2, label: 'Quiz', icon: ListChecks },
];

export default function Practice() {
  const { languageCode = 'kn-IN' } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const meta = getLanguageMeta(languageCode);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [session, setSession] = useState(null);
  const [day, setDay] = useState(null);
  const [activity, setActivity] = useState(0);
  const [turnIndex, setTurnIndex] = useState(0);
  const [maxTurns, setMaxTurns] = useState(1);
  const [isPremium, setIsPremium] = useState(false);

  const [phase, setPhase] = useState('idle'); // idle | transcribing | evaluating | done | error
  const [transcript, setTranscript] = useState('');
  const [assessment, setAssessment] = useState(null);
  const [speakError, setSpeakError] = useState('');
  const [savingActivity, setSavingActivity] = useState(false);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api.get(`/practice/session/${languageCode}`);
      if (res.data.success) {
        const d = res.data.data;
        setSession(d.dailySession);
        setDay(d.roadmapDay);
        setActivity(d.currentActivityIndex ?? 0);
        setTurnIndex(d.speakTurnIndex ?? 0);
        setMaxTurns(d.maxTurns ?? 1);
        setIsPremium(Boolean(d.isPremium));
      }
    } catch (err) {
      if (err.response?.status === 402) {
        navigate('/paywall', { state: { from: `/practice/${languageCode}` } });
        return;
      }
      setLoadError(err.response?.data?.error || 'We couldn’t start this session.');
    } finally {
      setLoading(false);
    }
  }, [languageCode, navigate]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const targetSentence =
    day?.promptText || day?.targetPhrases?.[0] || 'ನಮಸ್ಕಾರ, ನೀವು ಹೇಗಿದ್ದೀರಿ?';
  const translation = day?.translationEnglish || '';
  const scenario = day?.scenario || '';
  const dayNumber = session?.dayNumber || day?.dayNumber || 1;

  const resetSpeak = () => {
    setAssessment(null);
    setTranscript('');
    setSpeakError('');
    setPhase('idle');
  };

  /** Record -> transcribe -> assess -> persist the turn. */
  const submitRecording = async (blob) => {
    setSpeakError('');
    setAssessment(null);
    setTranscript('');
    setPhase('transcribing');

    try {
      const form = new FormData();
      form.append('audio', blob, 'speech.webm');
      form.append('languageCode', languageCode);

      const stt = await axios.post(`${AI_URL}/api/practice/transcribe`, form, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
      });
      const spoken = stt.data.transcript || '';
      setTranscript(spoken);

      setPhase('evaluating');
      const evaluation = await axios.post(
        `${AI_URL}/api/practice/feedback`,
        { targetSentence, userTranscript: spoken, languageCode, userLevel: 'beginner' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const result = { ...evaluation.data, languageCode };
      setAssessment(result);
      setPhase('done');

      const turn = await api.post(`/practice/session/${languageCode}/speak-turn`, {
        targetSentence,
        userTranscript: spoken,
        correctedText: result.correctedText,
        aiReplyText: result.aiReply,
        errors: result.errors,
        fluencyScore: result.fluencyScore,
        encouragement: result.encouragement,
        providerUsed: result.providerUsed,
      });

      if (turn.data.success) {
        setTurnIndex(turn.data.data.speakTurnIndex);
        // Server decides when Speak is finished (turn cap reached).
        if (turn.data.data.currentActivityIndex > 0) {
          setActivity(turn.data.data.currentActivityIndex);
        }
      }
    } catch (err) {
      setPhase('error');
      setSpeakError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          'Something went wrong sending your recording. Try again.'
      );
    }
  };

  const submitGame = async (payload) => {
    setSavingActivity(true);
    try {
      const res = await api.post(`/practice/session/${languageCode}/game`, payload);
      if (res.data.success) setActivity(2);
    } catch {
      setLoadError('Couldn’t save your game result.');
    } finally {
      setSavingActivity(false);
    }
  };

  const submitQuiz = async (payload) => {
    setSavingActivity(true);
    try {
      const res = await api.post(`/practice/session/${languageCode}/quiz`, payload);
      if (res.data.success) setActivity(3);
    } catch {
      setLoadError('Couldn’t save your quiz result.');
    } finally {
      setSavingActivity(false);
    }
  };

  const busy = phase === 'transcribing' || phase === 'evaluating';

  return (
    <AppShell className="space-y-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/roadmap/${languageCode}`)} className="-ml-3">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Roadmap
        </Button>

        <div className="flex items-center gap-2">
          <Badge tone="neutral">
            <span className="font-mono">{languageCode}</span>
          </Badge>
          <Badge tone="brand">Day {dayNumber}</Badge>
          {isPremium && (
            <Badge tone="accent" icon={Sparkles}>
              Premium
            </Badge>
          )}
        </div>
      </div>

      {/* Stepper */}
      <Card className="p-4">
        <div className="grid grid-cols-3 gap-2">
          {ACTIVITIES.map((a) => {
            const done = activity > a.id;
            const active = activity === a.id;
            return (
              <div
                key={a.id}
                aria-current={active ? 'step' : undefined}
                className={cx(
                  'flex items-center gap-2.5 rounded-xl p-2.5 transition-colors duration-200',
                  active ? 'bg-brand-soft' : done ? 'bg-positive-soft' : 'bg-surface-inset'
                )}
              >
                <span
                  className={cx(
                    'grid size-8 shrink-0 place-items-center rounded-lg',
                    active
                      ? 'bg-brand-700 text-white dark:bg-brand-500 dark:text-brand-950'
                      : done
                        ? 'bg-positive text-white'
                        : 'bg-surface text-ink-faint'
                  )}
                >
                  {done ? <Check className="size-4" aria-hidden="true" /> : <a.icon className="size-4" aria-hidden="true" />}
                </span>
                <div className="min-w-0">
                  <div
                    className={cx(
                      'truncate text-[13px] font-bold',
                      active || done ? 'text-ink' : 'text-ink-faint'
                    )}
                  >
                    {a.label}
                  </div>
                  {a.id === 0 && maxTurns > 1 && (
                    <div className="tabular hidden text-[11px] text-ink-soft sm:block">
                      turn {Math.min(turnIndex + 1, maxTurns)} of {maxTurns}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {loadError && (
        <Alert tone="critical" icon={AlertCircle} title="Session problem">
          <div className="space-y-2">
            <p>{loadError}</p>
            <Button variant="outline" size="sm" onClick={loadSession}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {loading ? (
        <LoadingState label="Picking up where you left off…" />
      ) : (
        <>
          {/* ── Speak ── */}
          {activity === 0 && (
            <motion.div
              key="speak"
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-5"
            >
              <Card className="grain overflow-hidden p-5 sm:p-6">
                <div className="relative flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                    {maxTurns > 1
                      ? `Roleplay — turn ${Math.min(turnIndex + 1, maxTurns)} of ${maxTurns}`
                      : 'Say this out loud'}
                  </span>
                  <AudioPlayer text={targetSentence} languageCode={languageCode} label="Hear it" />
                </div>

                <p className="relative mt-4 font-display text-2xl font-bold leading-snug text-ink sm:text-3xl">
                  {targetSentence}
                </p>
                {translation && (
                  <p className="relative mt-2 text-[15px] italic text-ink-soft">“{translation}”</p>
                )}

                {scenario && (
                  <p className="relative mt-4 flex items-start gap-2 border-t border-line pt-4 text-[13px] text-ink-soft">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                    {scenario}
                  </p>
                )}

                {maxTurns > 1 && (
                  <div className="relative mt-4">
                    <ProgressBar value={(turnIndex / maxTurns) * 100} label="Conversation progress" />
                  </div>
                )}
              </Card>

              {phase !== 'done' && (
                <AudioRecorder onSubmit={submitRecording} busy={busy} disabled={busy} />
              )}

              {busy && (
                <Alert tone="brand" icon={Loader2}>
                  {phase === 'transcribing'
                    ? 'Transcribing what you said…'
                    : 'Checking pronunciation, grammar and fluency…'}
                </Alert>
              )}

              {phase === 'error' && (
                <Alert tone="critical" icon={AlertCircle}>
                  <div className="space-y-2">
                    <p>{speakError}</p>
                    <Button variant="outline" size="sm" onClick={resetSpeak}>
                      Try again
                    </Button>
                  </div>
                </Alert>
              )}

              {phase === 'done' && assessment && (
                <AssessmentCard
                  assessment={assessment}
                  targetSentence={targetSentence}
                  userTranscript={transcript}
                  onRetry={resetSpeak}
                  onNext={() => (turnIndex >= maxTurns ? setActivity(1) : resetSpeak())}
                  nextLabel={turnIndex >= maxTurns ? 'Continue to word order' : 'Next turn'}
                />
              )}
            </motion.div>
          )}

          {/* ── Game ── */}
          {activity === 1 && (
            <motion.div
              key="game"
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <GameActivity
                targetSentence={targetSentence}
                onComplete={submitGame}
                isSubmitting={savingActivity}
              />
            </motion.div>
          )}

          {/* ── Quiz ── */}
          {activity === 2 && (
            <motion.div
              key="quiz"
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <QuizActivity
                quiz={day?.quiz || []}
                dayNumber={dayNumber}
                targetSentence={targetSentence}
                onComplete={submitQuiz}
                isSubmitting={savingActivity}
              />
            </motion.div>
          )}

          {/* ── Complete ── */}
          {activity === 3 && (
            <motion.div
              key="done"
              initial={{ scale: 0.97 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className="grain overflow-hidden px-6 py-12 text-center sm:px-10">
                <motion.span
                  initial={{ scale: 0.6, rotate: -12 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 16, delay: 0.1 }}
                  className="relative mx-auto grid size-16 place-items-center rounded-2xl bg-accent-soft text-accent-softfg"
                >
                  <PartyPopper className="size-8" aria-hidden="true" />
                </motion.span>

                <h2 className="relative mt-5 font-display text-2xl font-bold text-ink sm:text-3xl">
                  Day {dayNumber} complete
                </h2>
                <p className="relative mx-auto mt-2 max-w-md text-[15px] text-ink-soft">
                  You spoke, rebuilt the sentence and passed the quiz. Tomorrow’s day is unlocked.
                </p>

                <div className="relative mt-6 flex flex-wrap justify-center gap-2">
                  <Button onClick={() => navigate(`/roadmap/${languageCode}`)}>Back to roadmap</Button>
                  <Button variant="outline" onClick={() => navigate(`/progress/${languageCode}`)}>
                    See progress
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </AppShell>
  );
}
