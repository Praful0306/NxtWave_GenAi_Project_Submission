import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, Loader2, Gauge } from 'lucide-react';
import './AudioPlayer.css';

const AI_API_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:8000';

export default function AudioPlayer({
  text,
  languageCode,
  speaker = 'kavya',
  token,
  autoPlay = false,
  label = 'Listen',
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [speed, setSpeed] = useState(1.0); // 0.75x, 1.0x, 1.25x (Spec Section 3 & 6.3)
  
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const audioBufferRef = useRef(null);
  const startTimeRef = useRef(0);
  const pauseOffsetRef = useRef(0);
  const abortControllerRef = useRef(null);
  const speedRef = useRef(1.0);

  // Speed options per Spec Section 3 & 6.3
  const speedOptions = [0.75, 1.0, 1.25];

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Clean up Web Audio resources on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
          sourceNodeRef.current.disconnect();
        } catch (_) {}
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch (_) {}
      }
    };
  }, []);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioCtx();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playBuffer = useCallback((audioBuffer, offset = 0) => {
    const ctx = getAudioContext();
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (_) {}
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = speedRef.current;
    source.connect(ctx.destination);

    source.onended = () => {
      // Check if finished naturally
      setIsPlaying(false);
      pauseOffsetRef.current = 0;
    };

    startTimeRef.current = ctx.currentTime - offset / speedRef.current;
    source.start(0, offset);
    sourceNodeRef.current = source;
    setIsPlaying(true);
  }, [getAudioContext]);

  // Stream & play audio with real-time progressive chunk decoding
  const handlePlayAudio = async () => {
    // 1. If currently playing, pause
    if (isPlaying) {
      const ctx = getAudioContext();
      if (sourceNodeRef.current) {
        pauseOffsetRef.current = (ctx.currentTime - startTimeRef.current) * speedRef.current;
        try {
          sourceNodeRef.current.stop();
          sourceNodeRef.current.disconnect();
        } catch (_) {}
        sourceNodeRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    // 2. If we already decoded the audio buffer, resume immediately
    if (audioBufferRef.current) {
      playBuffer(audioBufferRef.current, pauseOffsetRef.current);
      return;
    }

    if (!text || !text.trim()) return;

    try {
      setIsLoading(true);
      const ctx = getAudioContext();
      const jwtToken = token || localStorage.getItem('token');
      abortControllerRef.current = new AbortController();

      const tFetchStart = performance.now();

      // Initiate chunked stream request to server-ai
      const res = await fetch(`${AI_API_URL}/api/practice/speak`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          text,
          languageCode,
          speaker,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        throw new Error(`TTS synthesis failed with status ${res.status}`);
      }

      // Read binary chunks progressively from ReadableStream
      const reader = res.body.getReader();
      const chunkArrays = [];
      let totalLength = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunkArrays.push(value);
          totalLength += value.length;
        }
      }

      // Combine gathered stream chunks into single contiguous buffer
      const mergedBuffer = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunkArrays) {
        mergedBuffer.set(chunk, offset);
        offset += chunk.length;
      }

      // Decode audio data using Web Audio API AudioContext
      const decodedBuffer = await ctx.decodeAudioData(mergedBuffer.buffer);
      audioBufferRef.current = decodedBuffer;
      setIsLoading(false);

      const tPlaybackStart = performance.now();
      console.log(
        `[AudioPlayer WebAudio] Time from fetch to AudioBufferSourceNode.start(): ${(
          tPlaybackStart - tFetchStart
        ).toFixed(1)}ms (${totalLength} bytes in ${chunkArrays.length} chunks)`
      );

      // Immediately initiate playback
      playBuffer(decodedBuffer, 0);
    } catch (err) {

      if (err.name !== 'AbortError') {
        console.error('[AudioPlayer] Audio streaming / decode failed:', err);
      }
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  // Adjust playbackRate dynamically on speed toggle
  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    speedRef.current = newSpeed;
    if (sourceNodeRef.current && isPlaying) {
      sourceNodeRef.current.playbackRate.value = newSpeed;
    }
  };

  // Autoplay trigger
  useEffect(() => {
    if (autoPlay && text) {
      handlePlayAudio();
    }
  }, [autoPlay, text]);

  return (
    <div className="audio-player-container">
      <button
        type="button"
        className={`audio-play-btn ${isPlaying ? 'playing' : ''} ${isLoading ? 'loading' : ''}`}
        onClick={handlePlayAudio}
        disabled={isLoading}
        title={isPlaying ? 'Pause Audio' : 'Play Audio'}
      >
        {isLoading ? (
          <Loader2 className="btn-icon animate-spin" size={18} />
        ) : isPlaying ? (
          <Pause className="btn-icon" size={18} />
        ) : (
          <Volume2 className="btn-icon" size={18} />
        )}
        <span className="btn-label">{label}</span>
      </button>

      {/* Speed Controls: 0.75x / 1.0x / 1.25x (Spec Section 3 & 6.3) */}
      <div className="speed-toggle-group">
        <Gauge size={14} className="speed-icon" />
        {speedOptions.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`speed-pill ${speed === opt ? 'active' : ''}`}
            onClick={() => handleSpeedChange(opt)}
          >
            {opt}×
          </button>
        ))}
      </div>
    </div>
  );
}

