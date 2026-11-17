"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

function cleanSpeechText(raw: string): string {
  return raw
    .replace(/\*\*(.*?)\*\*/g, "$1") // strip bold markdown
    .replace(/\*(.*?)\*/g, "$1") // strip italic markdown
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // strip markdown links
    .replace(/[#_`]/g, "") // strip code/headers
    .replace(/₦(\d[\d,]*)/g, "$1 Naira") // pronounce ₦ as Naira
    .trim();
}

const emptySubscribe = () => () => {};
const checkSupported = () => typeof window !== "undefined" && "speechSynthesis" in window;
const serverSupported = () => false;

export function useSpeechPlayer() {
  const [speaking, setSpeaking] = useState(false);
  const supported = useSyncExternalStore(emptySubscribe, checkSupported, serverSupported);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setSpeaking(false);
    }
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!synthRef.current) return;
      synthRef.current.cancel();

      const clean = cleanSpeechText(text);
      if (!clean) return;

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Select preferred English voice if available
      const voices = synthRef.current.getVoices();
      const preferred =
        voices.find((v) => v.lang.startsWith("en-NG")) ??
        voices.find((v) => v.lang.startsWith("en-GB")) ??
        voices.find((v) => v.lang.startsWith("en-US"));
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      synthRef.current.speak(utterance);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  return { speak, stop, speaking, supported };
}
