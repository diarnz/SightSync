import { useCallback, useRef } from 'react';

interface SpeakOptions {
  text: string;
  audioBase64?: string | null;
}

export function useTTS() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const speak = useCallback(({ text, audioBase64 }: SpeakOptions) => {
    stop();

    if (audioBase64) {
      try {
        const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
        audioRef.current = audio;
        audio.play().catch(() => {
          if ('speechSynthesis' in window && text) {
            window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
          }
        });
        return;
      } catch {
        // Fall through to browser speech synthesis.
      }
    }

    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    }
  }, [stop]);

  return {
    speak,
    stop,
    canSpeak: typeof window !== 'undefined' && 'speechSynthesis' in window,
  };
}
