"use client";

import { useCallback } from "react";

export function useTTS() {
  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Deep male style
    utterance.pitch = 0.7;
    utterance.rate = 0.92;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();

    // Prefer MALE voices
    const maleVoice =
      voices.find(v =>
        v.name.toLowerCase().includes("david")
      ) ||
      voices.find(v =>
        v.name.toLowerCase().includes("mark")
      ) ||
      voices.find(v =>
        v.name.toLowerCase().includes("male")
      ) ||
      voices.find(v =>
        v.lang.includes("en")
      );

    if (maleVoice) {
      utterance.voice = maleVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
  }, []);

  return { speak, stop };
}