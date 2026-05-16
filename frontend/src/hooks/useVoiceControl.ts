// ============================================================
// hooks/useVoiceControl.ts
// Continuous speech recognition with keyword/phrase matching.
// Uses the browser's built-in Web Speech API — zero dependencies.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';

export interface VoiceCommand {
  /** One or more phrases that trigger this command (lowercased, partial match OK) */
  phrases: string[];
  action: () => void;
  /** Human-readable label shown in the UI */
  label: string;
}

interface UseVoiceControlOptions {
  commands: VoiceCommand[];
  /** Language tag, e.g. 'en-US' */
  lang?: string;
  /** Called with the raw transcript whenever speech is recognised */
  onTranscript?: (text: string) => void;
  /** Called when a final transcript is produced, indicating if it matched a command */
  onFinal?: (text: string, matchedCommand: string | null) => void;
}

export type VoiceStatus = 'unsupported' | 'idle' | 'listening' | 'error';

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionEventLike {
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;

  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition || null;
}

const SpeechRecognition = getSpeechRecognition();

export function useVoiceControl({
  commands,
  lang = 'en-US',
  onTranscript,
  onFinal,
}: UseVoiceControlOptions) {
  const [status, setStatus] = useState<VoiceStatus>(
    SpeechRecognition ? 'idle' : 'unsupported'
  );
  const [transcript, setTranscript] = useState('');
  const [matchedCommand, setMatchedCommand] = useState<string | null>(null);

  const recogRef = useRef<SpeechRecognitionLike | null>(null);
  const enabledRef = useRef(false);
  const commandsRef = useRef(commands);
  const onTranscriptRef = useRef(onTranscript);
  const onFinalRef = useRef(onFinal);

  useEffect(() => {
    commandsRef.current = commands;
  }, [commands]);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onFinalRef.current = onFinal;
  }, [onTranscript, onFinal]);

  const matchAndFire = useCallback((text: string) => {
    const lower = text.toLowerCase().trim();
    for (const cmd of commandsRef.current) {
      if (cmd.phrases.some(p => lower.includes(p.toLowerCase()))) {
        setMatchedCommand(cmd.label);
        cmd.action();
        // Clear the matched label after 2 s
        setTimeout(() => setMatchedCommand(null), 2000);
        return cmd.label;
      }
    }
    return null;
  }, []);

  const start = useCallback(() => {
    if (!SpeechRecognition || enabledRef.current) return;
    enabledRef.current = true;

    const recog = new SpeechRecognition();
    recog.lang = lang;
    recog.continuous = true;
    recog.interimResults = true;
    recog.maxAlternatives = 1;
    recogRef.current = recog;

    recog.onstart = () => setStatus('listening');
    recog.onerror = (e) => {
      // 'no-speech' is normal — ignore it and let onend restart
      if (e.error !== 'no-speech') {
        setStatus('error');
      }
    };
    recog.onend = () => {
      // Auto-restart as long as user hasn't stopped
      if (enabledRef.current) {
        try { recog.start(); } catch { /* already started */ }
      } else {
        setStatus('idle');
      }
    };
    recog.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      const text: string = last[0].transcript;

      setTranscript(text);
      onTranscriptRef.current?.(text);

      if (last.isFinal) {
        const matched = matchAndFire(text);
        onFinalRef.current?.(text, matched);
        setTranscript('');
      }
    };

    try {
      recog.start();
    } catch {
      setStatus('error');
    }
  }, [lang, matchAndFire]);

  const stop = useCallback(() => {
    enabledRef.current = false;
    recogRef.current?.stop();
    recogRef.current = null;
    setStatus('idle');
    setTranscript('');
    setMatchedCommand(null);
  }, []);

  const toggle = useCallback(() => {
    if (status === 'listening') stop();
    else start();
  }, [status, start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      enabledRef.current = false;
      recogRef.current?.stop();
    };
  }, []);

  return { status, transcript, matchedCommand, start, stop, toggle };
}
