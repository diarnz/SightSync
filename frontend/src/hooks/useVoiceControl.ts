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
}

export type VoiceStatus = 'unsupported' | 'idle' | 'listening' | 'error';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SpeechRecognition: any =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

export function useVoiceControl({
  commands,
  lang = 'en-US',
  onTranscript,
}: UseVoiceControlOptions) {
  const [status, setStatus] = useState<VoiceStatus>(
    SpeechRecognition ? 'idle' : 'unsupported'
  );
  const [transcript, setTranscript] = useState('');
  const [matchedCommand, setMatchedCommand] = useState<string | null>(null);

  const recogRef = useRef<any>(null);
  const enabledRef = useRef(false);
  const commandsRef = useRef(commands);
  commandsRef.current = commands; // keep ref fresh without restarting recognition

  const matchAndFire = useCallback((text: string) => {
    const lower = text.toLowerCase().trim();
    for (const cmd of commandsRef.current) {
      if (cmd.phrases.some(p => lower.includes(p.toLowerCase()))) {
        setMatchedCommand(cmd.label);
        cmd.action();
        // Clear the matched label after 2 s
        setTimeout(() => setMatchedCommand(null), 2000);
        return true;
      }
    }
    return false;
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
    recog.onerror = (e: any) => {
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
    recog.onresult = (event: any) => {
      const last = event.results[event.results.length - 1];
      const text: string = last[0].transcript;

      setTranscript(text);
      onTranscript?.(text);

      if (last.isFinal) {
        matchAndFire(text);
        setTranscript('');
      }
    };

    try {
      recog.start();
    } catch {
      setStatus('error');
    }
  }, [lang, matchAndFire, onTranscript]);

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
