import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, Loader2, AlertCircle } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { cx } from '../ui';

const AI_API_URL = import.meta.env.VITE_AI_API_URL || import.meta.env.VITE_AI_URL || 'http://localhost:8000';
const SPEEDS = [0.75, 1.0, 1.25];

/**
 * Streams TTS from server-ai and plays it through Web Audio so the
 * 0.75x / 1.0x / 1.25x control can change rate mid-playback (spec §3, §6.3).
 */
export default function AudioPlayer({ text, languageCode, speaker = 'kavya', label = 'Listen', className }) {
  const token = useAuthStore((s) => s.token);

  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [speed, setSpeed] = useState(1.0);

  const ctxRef = useRef(null);
  const sourceRef = useRef(null);
  const bufferRef = useRef(null);
  const startedAtRef = useRef(0);
  const offsetRef = useRef(0);
  const abortRef = useRef(null);
  const speedRef = useRef(1.0);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // A new phrase invalidates the decoded buffer.
  useEffect(() => {
    bufferRef.current = null;
    offsetRef.current = 0;
    setFailed(false);
    setPlaying(false);
  }, [text, languageCode]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      try {
        sourceRef.current?.stop();
        sourceRef.current?.disconnect();
      } catch {
        // already stopped
      }
      if (ctxRef.current && ctxRef.current.state !== 'closed') ctxRef.current.close();
    },
    []
  );

  const getCtx = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      ctxRef.current = new Ctx();
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const playBuffer = useCallback(
    (buffer, offset = 0) => {
      const ctx = getCtx();
      try {
        sourceRef.current?.stop();
        sourceRef.current?.disconnect();
      } catch {
        // no active source
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = speedRef.current;
      source.connect(ctx.destination);
      source.onended = () => {
        setPlaying(false);
        offsetRef.current = 0;
      };

      startedAtRef.current = ctx.currentTime - offset / speedRef.current;
      source.start(0, offset);
      sourceRef.current = source;
      setPlaying(true);
    },
    [getCtx]
  );

  const toggle = async () => {
    if (playing) {
      const ctx = getCtx();
      offsetRef.current = (ctx.currentTime - startedAtRef.current) * speedRef.current;
      try {
        sourceRef.current?.stop();
        sourceRef.current?.disconnect();
      } catch {
        // already stopped
      }
      sourceRef.current = null;
      setPlaying(false);
      return;
    }

    if (bufferRef.current) return playBuffer(bufferRef.current, offsetRef.current);
    if (!text?.trim()) return;

    try {
      setLoading(true);
      setFailed(false);
      const ctx = getCtx();
      abortRef.current = new AbortController();

      const res = await fetch(`${AI_API_URL}/api/practice/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text, languageCode, speaker }),
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error(`TTS failed (${res.status})`);

      const bytes = new Uint8Array(await res.arrayBuffer());
      const decoded = await ctx.decodeAudioData(bytes.buffer);
      bufferRef.current = decoded;
      setLoading(false);
      playBuffer(decoded, 0);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('[AudioPlayer]', err);
        setFailed(true);
      }
      setLoading(false);
      setPlaying(false);
    }
  };

  const changeSpeed = (next) => {
    setSpeed(next);
    speedRef.current = next;
    if (sourceRef.current && playing) sourceRef.current.playbackRate.value = next;
  };

  return (
    <div className={cx('flex flex-wrap items-center gap-2', className)}>
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        aria-label={playing ? `Pause ${label}` : label}
        className={cx(
          'inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-[12px] font-semibold transition-colors disabled:opacity-60',
          failed
            ? 'border-transparent bg-critical-soft text-critical'
            : playing
              ? 'border-transparent bg-brand-soft text-brand-softfg'
              : 'border-line-strong bg-surface text-ink-soft hover:bg-surface-hover hover:text-ink'
        )}
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        ) : failed ? (
          <AlertCircle className="size-3.5" aria-hidden="true" />
        ) : playing ? (
          <Pause className="size-3.5" aria-hidden="true" />
        ) : (
          <Volume2 className="size-3.5" aria-hidden="true" />
        )}
        {failed ? 'Audio unavailable' : label}
      </button>

      <div
        role="radiogroup"
        aria-label="Playback speed"
        className="inline-flex items-center gap-0.5 rounded-lg border border-line bg-surface-inset p-0.5"
      >
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={speed === s}
            onClick={() => changeSpeed(s)}
            className={cx(
              'tabular cursor-pointer rounded-md px-2 py-1 font-mono text-[11px] font-bold transition-colors',
              speed === s ? 'bg-surface text-ink shadow-xs' : 'text-ink-faint hover:text-ink'
            )}
          >
            {s}×
          </button>
        ))}
      </div>
    </div>
  );
}
