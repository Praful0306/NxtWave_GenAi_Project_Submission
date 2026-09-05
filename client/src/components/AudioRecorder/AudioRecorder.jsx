import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mic, Square, Play, Pause, RotateCcw, ArrowRight, AlertCircle, MicOff } from 'lucide-react';
import { Button, Alert, cx } from '../ui';

const MAX_SECONDS = 20; // recording cap, spec §6.3
const BARS = 28;
const SILENCE_PEAK = 0.012; // RMS below this for the whole take means nothing was captured

/** Pick a container the browser will actually record, newest-best first. */
function pickMimeType() {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4', // Safari
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported?.(t)) || '';
}

/**
 * Captures a single utterance and hands the raw blob up via `onSubmit`.
 * Transcription lives with the caller so the audio is only uploaded once.
 */
export default function AudioRecorder({ onSubmit, disabled = false, busy = false }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [levels, setLevels] = useState(() => new Array(BARS).fill(4));
  const [error, setError] = useState(null);
  const [silent, setSilent] = useState(false);

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const ctxRef = useRef(null);
  const rafRef = useRef(null);
  const streamRef = useRef(null);
  const audioElRef = useRef(null);
  const stopRef = useRef(null);
  const peakRef = useRef(0);
  // Object URLs are revoked by hand. Doing it from an effect keyed on the URL
  // frees the one we just created (StrictMode runs cleanup right after setup),
  // which leaves <audio> pointing at a dead src and playback silently fails.
  const urlRef = useRef(null);

  const releaseUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  const releaseMedia = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (ctxRef.current && ctxRef.current.state !== 'closed') ctxRef.current.close();
    ctxRef.current = null;
  }, []);

  useEffect(
    () => () => {
      releaseMedia();
      releaseUrl();
    },
    [releaseMedia, releaseUrl]
  );

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    setRecording(false);
  }, []);
  stopRef.current = stop;

  const start = async () => {
    setError(null);
    setSilent(false);
    setBlob(null);
    setSeconds(0);
    setPlaying(false);
    chunksRef.current = [];
    peakRef.current = 0;
    releaseUrl();
    setPreviewUrl(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser can’t record audio. Try Chrome, Edge or Firefox — and make sure the page is on https.');
      return;
    }
    if (typeof MediaRecorder === 'undefined') {
      setError('This browser doesn’t support MediaRecorder, so recording isn’t available here.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      const track = stream.getAudioTracks()[0];
      if (!track || track.readyState !== 'live') {
        releaseMedia();
        setError('Your microphone didn’t start. Check that the right input device is selected, then try again.');
        return;
      }

      // Live level meter, and a running peak so we can tell silence from speech.
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      ctxRef.current = ctx;
      if (ctx.state === 'suspended') await ctx.resume();

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);

      const freq = new Uint8Array(analyser.frequencyBinCount);
      const time = new Float32Array(analyser.fftSize);
      const step = Math.floor(freq.length / BARS) || 1;

      const draw = () => {
        analyser.getByteFrequencyData(freq);
        analyser.getFloatTimeDomainData(time);

        let sum = 0;
        for (let i = 0; i < time.length; i++) sum += time[i] * time[i];
        const rms = Math.sqrt(sum / time.length);
        if (rms > peakRef.current) peakRef.current = rms;

        setLevels(Array.from({ length: BARS }, (_, i) => Math.max(4, Math.min((freq[i * step] || 0) * 0.22, 44))));
        rafRef.current = requestAnimationFrame(draw);
      };
      draw();

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onerror = () => {
        releaseMedia();
        setRecording(false);
        setError('Recording stopped unexpectedly. Please try again.');
      };

      recorder.onstop = () => {
        const peak = peakRef.current;
        releaseMedia();
        setLevels(new Array(BARS).fill(4));

        const type = recorder.mimeType || mimeType || 'audio/webm';
        const recorded = new Blob(chunksRef.current, { type });

        if (recorded.size < 1024) {
          setError('Nothing was captured. Check your microphone is connected and not muted, then try again.');
          return;
        }

        setBlob(recorded);
        setSilent(peak < SILENCE_PEAK);
        const url = URL.createObjectURL(recorded);
        urlRef.current = url;
        setPreviewUrl(url);
      };

      recorder.start(250);
      setRecording(true);

      let elapsed = 0;
      timerRef.current = setInterval(() => {
        elapsed += 1;
        setSeconds(elapsed);
        if (elapsed >= MAX_SECONDS) stopRef.current?.();
      }, 1000);
    } catch (err) {
      releaseMedia();
      const denied = err.name === 'NotAllowedError' || err.name === 'SecurityError';
      const missing = err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError';
      setError(
        denied
          ? 'Microphone access was blocked. Allow it for this site in your browser’s address bar, then try again.'
          : missing
            ? 'No microphone was found. Plug one in or pick a different input device, then try again.'
            : `Couldn’t start recording: ${err.message}`
      );
    }
  };

  const togglePreview = () => {
    const el = audioElRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.play().catch(() => setError('Couldn’t play that back. Try recording again.'));
      setPlaying(true);
    }
  };

  const pct = Math.min(100, (seconds / MAX_SECONDS) * 100);
  const sizeKb = blob ? Math.round(blob.size / 1024) : 0;

  return (
    <div className="space-y-4">
      {error && (
        <Alert tone="critical" icon={AlertCircle}>
          {error}
        </Alert>
      )}

      {silent && !error && (
        <Alert tone="caution" icon={MicOff} title="We couldn’t hear anything">
          The recording came through silent. Check your microphone input, move somewhere quieter, and record again —
          sending this would give you an empty transcript.
        </Alert>
      )}

      <div className="rounded-2xl border border-line bg-surface-inset p-6">
        {/* Meter */}
        <div className="flex h-14 items-center justify-center gap-[3px]" aria-hidden="true">
          {levels.map((h, i) => (
            <span
              key={i}
              style={{ height: `${h}px` }}
              className={cx(
                'w-1.5 rounded-full transition-[height,background-color] duration-75',
                recording ? 'bg-accent-500' : 'bg-line-strong'
              )}
            />
          ))}
        </div>

        {/* Status */}
        <p className="mt-4 text-center text-[13px] font-medium text-ink-soft" role="status" aria-live="polite">
          {recording ? (
            <span className="tabular inline-flex items-center gap-2 text-accent-softfg">
              <span className="size-2 animate-pulse rounded-full bg-accent-500" />
              Recording — {seconds}s of {MAX_SECONDS}s
            </span>
          ) : blob ? (
            <span className={cx('tabular', silent ? 'text-caution' : 'text-positive')}>
              Recorded {seconds}s · {sizeKb} KB — listen back or send it
            </span>
          ) : (
            'Tap the microphone and say the phrase out loud'
          )}
        </p>

        {recording && (
          <div className="mx-auto mt-3 h-1 w-40 overflow-hidden rounded-full bg-line">
            <motion.div className="h-full bg-accent-500" animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
          </div>
        )}

        {/* Controls */}
        <div className="mt-6 flex items-center justify-center gap-4">
          {blob && !recording && (
            <button
              type="button"
              onClick={start}
              disabled={disabled || busy}
              aria-label="Record again"
              className="grid size-12 cursor-pointer place-items-center rounded-full border border-line-strong bg-surface text-ink-soft transition-colors hover:bg-surface-hover hover:text-ink disabled:opacity-50"
            >
              <RotateCcw className="size-5" />
            </button>
          )}

          <button
            type="button"
            onClick={recording ? stop : start}
            disabled={disabled || busy}
            aria-label={recording ? 'Stop recording' : 'Start recording'}
            className={cx(
              'grid size-20 cursor-pointer place-items-center rounded-full text-white transition-[transform,background-color] duration-200',
              'active:scale-95 disabled:cursor-not-allowed disabled:opacity-50',
              recording
                ? 'animate-halo bg-accent-600 hover:bg-accent-700'
                : 'bg-brand-700 hover:bg-brand-800 dark:bg-brand-500 dark:text-brand-950 dark:hover:bg-brand-400'
            )}
          >
            {recording ? <Square className="size-7 fill-current" /> : <Mic className="size-8" />}
          </button>

          {previewUrl && !recording && (
            <button
              type="button"
              onClick={togglePreview}
              aria-label={playing ? 'Pause playback' : 'Play back your recording'}
              className="grid size-12 cursor-pointer place-items-center rounded-full border border-line-strong bg-surface text-ink-soft transition-colors hover:bg-surface-hover hover:text-ink"
            >
              {playing ? <Pause className="size-5" /> : <Play className="size-5 fill-current" />}
            </button>
          )}
        </div>

        {previewUrl && (
          <audio
            ref={audioElRef}
            src={previewUrl}
            preload="auto"
            onEnded={() => setPlaying(false)}
            onPause={() => setPlaying(false)}
            className="hidden"
          />
        )}
      </div>

      {blob && !recording && (
        <Button size="lg" className="w-full" loading={busy} disabled={disabled} onClick={() => onSubmit?.(blob)}>
          {busy ? 'Listening…' : silent ? 'Send anyway' : 'Send for feedback'}
          {!busy && <ArrowRight className="size-4" aria-hidden="true" />}
        </Button>
      )}
    </div>
  );
}
