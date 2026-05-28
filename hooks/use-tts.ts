"use client";

import { useCallback } from "react";

export function useTTS() {
  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 0.7;
    utterance.rate = 0.92;
    utterance.volume = 1;

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return null;

      return (
        voices.find((v) => v.name.toLowerCase().includes("david")) ||
        voices.find((v) => v.name.toLowerCase().includes("mark")) ||
        voices.find((v) => v.name.toLowerCase().includes("google uk english male")) ||
        voices.find((v) => v.name.toLowerCase().includes("male")) ||
        voices.find((v) => v.lang.startsWith("en") && !v.name.toLowerCase().includes("female"))
      );
    };

    const trySpeak = () => {
      const voice = pickVoice();
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    };

    // Voices already loaded
    if (window.speechSynthesis.getVoices().length > 0) {
      trySpeak();
    } else {
      // Wait for voices to load (first time)
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        trySpeak();
      };
    }
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
  }, []);

  return { speak, stop };
}