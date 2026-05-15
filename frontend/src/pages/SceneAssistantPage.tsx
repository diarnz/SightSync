import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import {
  Camera, Volume2, AlertCircle, RefreshCw, Radio, Square,
  Zap, Clock, Tag, Mic, MicOff, CheckCircle2,
} from 'lucide-react';
import { useVoiceControl } from '../hooks/useVoiceControl';

// How often to CHECK for changes during live mode (ms).
// No API call is made unless a change is detected.
const LIVE_INTERVAL_MS = 4000;

// Downsampled resolution for pixel-diff comparison
const DIFF_W = 80;
const DIFF_H = 45;
const CHANGE_THRESHOLD = 0.08;
const LUMA_TOLERANCE = 15;

interface AnalysisResult {
  description: string;
  tags: string[];
  confidence: string;
  processing_time_ms: number;
  audio_base64: string | null;
  timestamp: Date;
}

type ChangeStatus = 'idle' | 'watching' | 'changed' | 'no-change';

const SceneAssistantPage: React.FC = () => {
  const [isLive, setIsLive] = useState(false);
  const [isSingleCapture, setIsSingleCapture] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [pendingAnalysis, setPendingAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [changeStatus, setChangeStatus] = useState<ChangeStatus>('idle');

  const webcamRef = useRef<Webcam>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPendingRef = useRef(false);
  const lastFrameDataRef = useRef<Uint8ClampedArray | null>(null);

  // ── Change detection ─────────────────────────────────────────────────────

  const capturePixels = useCallback((): Uint8ClampedArray | null => {
    const video = webcamRef.current?.video;
    if (!video || video.readyState < 2) return null;
    const canvas = document.createElement('canvas');
    canvas.width = DIFF_W;
    canvas.height = DIFF_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, DIFF_W, DIFF_H);
    const { data } = ctx.getImageData(0, 0, DIFF_W, DIFF_H);
    const gray = new Uint8ClampedArray(DIFF_W * DIFF_H);
    for (let i = 0; i < gray.length; i++) {
      gray[i] = Math.round(0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]);
    }
    return gray;
  }, []);

  const hasSceneChanged = useCallback((): boolean => {
    const current = capturePixels();
    if (!current) return false;
    const prev = lastFrameDataRef.current;
    if (!prev) { lastFrameDataRef.current = current; return true; }
    let diff = 0;
    for (let i = 0; i < current.length; i++) {
      if (Math.abs(current[i] - prev[i]) > LUMA_TOLERANCE) diff++;
    }
    if (diff / current.length >= CHANGE_THRESHOLD) {
      lastFrameDataRef.current = current;
      return true;
    }
    return false;
  }, [capturePixels]);

  // ── Core analysis ────────────────────────────────────────────────────────

  const analyzeFrame = useCallback(async (force = false) => {
    if (isPendingRef.current) return;
    if (!webcamRef.current) return;

    if (!force && !hasSceneChanged()) {
      setChangeStatus('no-change');
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    isPendingRef.current = true;
    setPendingAnalysis(true);
    setChangeStatus('changed');
    setError(null);

    try {
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append('file', blob, 'capture.jpg');

      const response = await fetch('/api/analyze-image', { method: 'POST', body: formData });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setResult({
        description: data.description,
        tags: data.tags ?? [],
        confidence: data.confidence ?? 'medium',
        processing_time_ms: data.processing_time_ms ?? 0,
        audio_base64: data.audio_base64 ?? null,
        timestamp: new Date(),
      });
      setFrameCount(c => c + 1);
      if (audioEnabled && data.audio_base64) playAudio(data.audio_base64);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      isPendingRef.current = false;
      setPendingAnalysis(false);
      setChangeStatus(prev => (prev === 'changed' ? 'watching' : prev));
    }
  }, [audioEnabled, hasSceneChanged]);

  // ── Live mode ────────────────────────────────────────────────────────────

  const startLive = useCallback(() => {
    setIsLive(true);
    setFrameCount(0);
    setError(null);
    setChangeStatus('watching');
    lastFrameDataRef.current = null;
    analyzeFrame(true);
    intervalRef.current = setInterval(() => analyzeFrame(false), LIVE_INTERVAL_MS);
  }, [analyzeFrame]);

  const stopLive = useCallback(() => {
    setIsLive(false);
    setChangeStatus('idle');
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (audioRef.current) audioRef.current.pause();
  }, []);

  // ── Single capture ───────────────────────────────────────────────────────

  const captureOnce = useCallback(async () => {
    setIsSingleCapture(true);
    await analyzeFrame(true);
    setIsSingleCapture(false);
  }, [analyzeFrame]);

  // Keep interval reference fresh
  useEffect(() => {
    if (isLive && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => analyzeFrame(false), LIVE_INTERVAL_MS);
    }
  }, [analyzeFrame, isLive]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const playAudio = (base64Data: string) => {
    try {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(`data:audio/wav;base64,${base64Data}`);
      audioRef.current = audio;
      audio.play().catch(console.error);
    } catch (e) { console.error('Failed to play audio:', e); }
  };

  const replayAudio = () => { if (result?.audio_base64) playAudio(result.audio_base64); };

  // ── Voice control ────────────────────────────────────────────────────────

  const { status: voiceStatus, transcript, matchedCommand, toggle: toggleVoice } = useVoiceControl({
    commands: [
      {
        label: 'Capture',
        phrases: [
          'analyze', 'analyse',
          "what's in front of me", 'whats in front of me',
          "what do you see", 'describe',
          "what's there", 'whats there',
          "tell me", "scan", "capture",
          "what's around me", 'whats around me',
          "look around", "what is this",
        ],
        action: () => {
          if (!isLive && !isSingleCapture) captureOnce();
        },
      },
      {
        label: 'Start Live',
        phrases: ['start live', 'start watching', 'start monitoring', 'live mode'],
        action: () => { if (!isLive) startLive(); },
      },
      {
        label: 'Stop Live',
        phrases: ['stop live', 'stop watching', 'stop monitoring', 'stop'],
        action: () => { if (isLive) stopLive(); },
      },
      {
        label: 'Replay Audio',
        phrases: ['replay', 'repeat', 'say again', 'again'],
        action: replayAudio,
      },
    ],
  });

  const isListening = voiceStatus === 'listening';

  // ── UI helpers ───────────────────────────────────────────────────────────

  const confidenceColor: Record<string, string> = {
    low: 'text-amber-400', medium: 'text-blue-400', high: 'text-emerald-400',
  };

  const isProcessing = isSingleCapture || (isLive && pendingAnalysis && frameCount === 0);

  const statusInfo = {
    idle: null,
    watching: { text: 'Watching for changes…', color: 'text-gray-400' },
    changed: { text: 'Change detected — analyzing…', color: 'text-blue-400' },
    'no-change': { text: 'No change — skipped', color: 'text-gray-500' },
  } as const;
  const currentStatus = statusInfo[changeStatus];

  return (
    <div className="relative min-h-screen flex flex-col p-4 sm:p-8 max-w-4xl mx-auto z-10">

      {/* Header */}
      <header className="mb-6 text-center slide-up">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-1 gradient-text">SightSync</h1>
        <p className="text-color-text-muted text-lg sm:text-xl font-medium">
          Live Scene Description Assistant
        </p>
      </header>

      <main className="flex-1 flex flex-col gap-6 slide-up" style={{ animationDelay: '0.1s' }}>

        {/* Camera View */}
        <section
          className={`relative w-full rounded-2xl overflow-hidden card-glass aspect-video flex items-center justify-center bg-black/50 border-2 transition-all duration-500 ${
            isLive
              ? 'border-blue-500/60 shadow-[0_0_40px_rgba(59,130,246,0.2)]'
              : 'border-transparent hover:border-blue-500/30'
          }`}
        >
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.85}
            videoConstraints={{ facingMode: 'environment' }}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

          {/* LIVE badge */}
          {isLive && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full fade-in z-10">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 pulse-ring" />
              <span className="text-white text-sm font-bold tracking-widest uppercase">Live</span>
              {frameCount > 0 && <span className="text-blue-300 text-xs ml-1">#{frameCount}</span>}
            </div>
          )}

          {/* Mic status badge */}
          {isListening && (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full fade-in z-10">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 pulse-ring" />
              <Mic className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-300 text-xs font-semibold">Voice On</span>
            </div>
          )}

          {/* Pending spinner */}
          {!isListening && isLive && pendingAnalysis && (
            <div className="absolute top-4 right-4 z-10 fade-in">
              <div className="w-5 h-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
            </div>
          )}

          {/* Initial processing overlay */}
          {isProcessing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-10 fade-in">
              <div className="w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mb-4" />
              <p className="text-xl font-semibold text-white animate-pulse">Analyzing Scene…</p>
            </div>
          )}

          {/* Voice transcript overlay — shown while speaking */}
          {isListening && transcript && (
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-10 fade-in">
              <div className="bg-black/70 backdrop-blur-sm border border-green-500/30 rounded-xl px-4 py-2.5 text-center">
                <p className="text-green-300 text-sm italic truncate">"{transcript}"</p>
              </div>
            </div>
          )}

          {/* Matched command toast */}
          {matchedCommand && (
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 fade-in">
              <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/40 backdrop-blur-sm rounded-full px-4 py-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-green-300 text-sm font-semibold">"{matchedCommand}" triggered</span>
              </div>
            </div>
          )}

          {/* Timestamp overlay */}
          {result && !isProcessing && (
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full z-10">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-300 text-xs">{result.timestamp.toLocaleTimeString()}</span>
              <span className="text-gray-500 text-xs">·</span>
              <Zap className="w-3 h-3 text-yellow-400" />
              <span className="text-gray-300 text-xs">{result.processing_time_ms}ms</span>
            </div>
          )}
        </section>

        {/* Controls */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 slide-up" style={{ animationDelay: '0.2s' }}>

          {/* Live toggle */}
          {isLive ? (
            <button
              id="btn-stop-live"
              onClick={stopLive}
              className="btn-danger py-4 text-lg"
              aria-label="Stop live analysis"
            >
              <Square className="w-5 h-5 mr-2" />
              Stop Live
            </button>
          ) : (
            <button
              id="btn-start-live"
              onClick={startLive}
              disabled={isSingleCapture}
              className="btn-primary py-4 text-lg"
              aria-label="Start live analysis"
            >
              <Radio className="w-5 h-5 mr-2" />
              Start Live
            </button>
          )}

          {/* Single capture */}
          <button
            id="btn-capture-once"
            onClick={captureOnce}
            disabled={isLive || isSingleCapture}
            className="btn-secondary py-4 text-base"
            aria-label="Capture and describe scene once"
          >
            <Camera className="w-5 h-5 mr-2" />
            Capture
          </button>

          {/* Audio toggle */}
          <button
            id="btn-toggle-audio"
            onClick={() => setAudioEnabled(v => !v)}
            className={`btn-secondary py-4 text-base ${audioEnabled ? 'border-blue-500/50 text-blue-300' : 'opacity-50'}`}
            aria-label={audioEnabled ? 'Mute audio' : 'Unmute audio'}
          >
            <Volume2 className="w-5 h-5 mr-2" />
            {audioEnabled ? 'Audio On' : 'Audio Off'}
          </button>

          {/* Mic / Voice toggle */}
          {voiceStatus === 'unsupported' ? (
            <button
              id="btn-mic-unsupported"
              disabled
              className="btn-secondary py-4 text-base opacity-40 cursor-not-allowed"
              title="Speech recognition is not supported in this browser"
            >
              <MicOff className="w-5 h-5 mr-2" />
              No Mic
            </button>
          ) : (
            <button
              id="btn-toggle-mic"
              onClick={toggleVoice}
              className={`btn-secondary py-4 text-base transition-all duration-300 ${
                isListening
                  ? 'border-green-500/60 text-green-300 shadow-[0_0_20px_rgba(74,222,128,0.15)]'
                  : 'opacity-70 hover:opacity-100'
              }`}
              aria-label={isListening ? 'Turn off voice control' : 'Turn on voice control'}
            >
              {isListening ? (
                <Mic className="w-5 h-5 mr-2 animate-pulse" />
              ) : (
                <MicOff className="w-5 h-5 mr-2" />
              )}
              {isListening ? 'Voice On' : 'Voice Off'}
            </button>
          )}
        </section>

        {/* Voice commands cheatsheet — shown when mic is on */}
        {isListening && (
          <div className="card-glass p-4 border-green-500/20 bg-green-500/5 fade-in">
            <p className="text-xs text-green-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" /> Voice commands
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                '"analyze"', '"describe"', '"scan"', '"tell me"',
                '"what do you see"', '"what\'s in front of me"',
                '"start live"', '"stop live"', '"replay"',
              ].map(phrase => (
                <span
                  key={phrase}
                  className="px-2.5 py-1 rounded-full text-xs bg-green-500/10 text-green-300 border border-green-500/20"
                >
                  {phrase}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Live status row */}
        {isLive && (
          <div className="text-center text-sm fade-in -mt-2 flex flex-wrap items-center justify-center gap-2">
            <span className="text-gray-500">
              Checks every {LIVE_INTERVAL_MS / 1000}s · {frameCount} API call{frameCount !== 1 ? 's' : ''} sent
            </span>
            {currentStatus && (
              <>
                <span className="text-gray-700">·</span>
                <span className={currentStatus.color}>{currentStatus.text}</span>
              </>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="card-glass p-5 border-red-500/30 bg-red-500/10 fade-in flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-bold text-red-400 mb-0.5">Error</h3>
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Result card */}
        {result && (
          <div
            className="card-glass p-6 sm:p-8 fade-in relative group overflow-hidden"
            key={result.timestamp.toISOString()}
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-cyan-400" />

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-blue-400" />
                Scene Description
                <span className={`text-sm font-medium ml-1 ${confidenceColor[result.confidence] ?? 'text-gray-400'}`}>
                  ({result.confidence})
                </span>
              </h2>
              <button
                id="btn-replay-audio"
                onClick={replayAudio}
                disabled={!result.audio_base64}
                className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Replay audio description"
                title="Replay audio"
              >
                <RefreshCw className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </button>
            </div>

            <p className="text-lg sm:text-xl leading-relaxed text-gray-200 mb-5">
              {result.description}
            </p>

            {result.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <Tag className="w-4 h-4 text-gray-500" />
                {result.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-300 border border-blue-500/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default SceneAssistantPage;
