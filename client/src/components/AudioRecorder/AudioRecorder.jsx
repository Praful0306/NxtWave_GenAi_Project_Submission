import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Sparkles, Loader2, Volume2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { transcribeAudio } from '../../services/aiApi';

const MAX_RECORDING_SECONDS = 20; // 15-20s duration cap (Spec Section 12)

export default function AudioRecorder({ languageCode = 'kn-IN', onTranscriptionComplete, targetPrompt = '' }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState(null);
  const [error, setError] = useState(null);
  const [audioLevels, setAudioLevels] = useState(new Array(16).fill(10));

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioElementRef = useRef(null);

  // Clean up timer and streams on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setError(null);
    setTranscriptionResult(null);
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecordingSeconds(0);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Set up Web Audio Analyser for live frequency visualization
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const renderAudioBars = () => {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        // Sample 16 discrete bands
        const sampled = [];
        const step = Math.floor(dataArray.length / 16);
        for (let i = 0; i < 16; i++) {
          const val = dataArray[i * step] || 0;
          sampled.push(Math.max(12, Math.min(val * 0.4, 48)));
        }
        setAudioLevels(sampled);

        animationFrameRef.current = requestAnimationFrame(renderAudioBars);
      };
      renderAudioBars();

      // Set up MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        setAudioLevels(new Array(16).fill(10));

        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      recorder.start(250); // collect 250ms chunks
      setIsRecording(true);

      // Start recording timer with 20s auto-stop (Spec Section 12)
      let secs = 0;
      timerIntervalRef.current = setInterval(() => {
        secs += 1;
        setRecordingSeconds(secs);

        if (secs >= MAX_RECORDING_SECONDS) {
          stopRecording();
        }
      }, 1000);
    } catch (err) {
      setError(`Microphone access denied or unsupported: ${err.message}`);
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleTranscribe = async () => {
    if (!audioBlob) return;
    setIsTranscribing(true);
    setError(null);

    try {
      const result = await transcribeAudio(audioBlob, languageCode);
      setTranscriptionResult(result);
      if (onTranscriptionComplete) {
        onTranscriptionComplete(result);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Speech transcription failed');
    } finally {
      setIsTranscribing(false);
    }
  };

  const togglePreviewPlay = () => {
    if (!audioElementRef.current) return;
    if (isPlayingPreview) {
      audioElementRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioElementRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
      {/* Target Prompt Display if provided */}
      {targetPrompt && (
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30">
          <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-1">
            Say this in {languageCode}:
          </div>
          <div className="text-base sm:text-lg font-bold text-white">{targetPrompt}</div>
        </div>
      )}

      {/* Audio Visualizer & Recording Controls */}
      <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-950/60 border border-slate-800/80 space-y-6">
        {/* Frequency waveform bars */}
        <div className="h-16 flex items-center justify-center gap-1.5 w-full max-w-sm">
          {audioLevels.map((lvl, idx) => (
            <div
              key={idx}
              className={`w-2 rounded-full transition-all duration-75 ${
                isRecording
                  ? 'bg-gradient-to-t from-red-500 to-amber-400'
                  : 'bg-slate-800'
              }`}
              style={{ height: `${lvl}px` }}
            />
          ))}
        </div>

        {/* Live Timer & Recording Status */}
        <div className="flex items-center gap-3">
          {isRecording ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Recording: {recordingSeconds}s / {MAX_RECORDING_SECONDS}s
            </div>
          ) : audioBlob ? (
            <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Ready for AI Speech Recognition ({recordingSeconds}s)
            </div>
          ) : (
            <div className="text-xs text-slate-400">
              Click the microphone button to start speaking
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-4">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white flex items-center justify-center shadow-xl shadow-indigo-600/30 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              title="Start Recording"
            >
              <Mic className="w-7 h-7" />
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white flex items-center justify-center shadow-xl shadow-red-600/30 transition-transform hover:scale-105 active:scale-95 cursor-pointer animate-pulse"
              title="Stop Recording"
            >
              <Square className="w-6 h-6 fill-white" />
            </button>
          )}

          {audioBlob && !isRecording && (
            <button
              type="button"
              onClick={startRecording}
              className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Re-record Audio"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Audio Playback Preview */}
      {audioUrl && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60">
          <audio
            ref={audioElementRef}
            src={audioUrl}
            onEnded={() => setIsPlayingPreview(false)}
            className="hidden"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePreviewPlay}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition"
            >
              {isPlayingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            </button>
            <div className="text-xs">
              <div className="font-bold text-white">Your Voice Recording</div>
              <div className="text-slate-400 font-mono text-[11px]">{recordingSeconds}s duration</div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTranscribe}
            disabled={isTranscribing}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 cursor-pointer"
          >
            {isTranscribing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Transcribing with AI STT...
              </>
            ) : (
              <>
                Transcribe Audio <Sparkles className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* STT Recognition Result Display */}
      {transcriptionResult && (
        <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Speech Recognized:</span>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Provider: {transcriptionResult.providerUsed}
              </span>
              <span className="text-emerald-400 font-mono text-[11px] font-semibold">
                Confidence: {Math.round(transcriptionResult.confidence * 100)}%
              </span>
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold text-white p-3 rounded-xl bg-slate-900 border border-slate-800">
            "{transcriptionResult.transcript}"
          </div>
        </div>
      )}
    </div>
  );
}
