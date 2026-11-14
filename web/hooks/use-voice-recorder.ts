"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

export type VoiceNote = { blob: Blob; seconds: number };
export type RecorderStatus = "idle" | "starting" | "recording";

const MAX_SECONDS = 60;
const BARS = 28;
const MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

const noop = () => () => {};
const detect = () =>
  typeof window !== "undefined" &&
  typeof window.MediaRecorder !== "undefined" &&
  Boolean(navigator.mediaDevices?.getUserMedia);

function pickMime() {
  return MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t));
}

const silent = () => Array.from({ length: BARS }, () => 0);

/**
 * Records one voice note with MediaRecorder and exposes a live level meter.
 * `stop` resolves with the note; `cancel` throws it away. Stops on its own at 60 seconds.
 */
export function useVoiceRecorder({ onAutoStop }: { onAutoStop?: (note: VoiceNote | null) => void } = {}) {
  const supported = useSyncExternalStore(noop, detect, () => false);
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [seconds, setSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>(silent);
  const [error, setError] = useState<string | null>(null);

  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const frame = useRef(0);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const settle = useRef<((note: VoiceNote | null) => void) | null>(null);
  const discard = useRef(false);
  const autoStop = useRef(onAutoStop);

  useEffect(() => {
    autoStop.current = onAutoStop;
  }, [onAutoStop]);

  const teardown = useCallback(() => {
    cancelAnimationFrame(frame.current);
    if (tick.current) clearInterval(tick.current);
    tick.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    audioCtx.current?.close().catch(() => {});
    audioCtx.current = null;
    recorder.current = null;
    setStatus("idle");
    setSeconds(0);
    setLevels(silent());
  }, []);

  useEffect(() => teardown, [teardown]);

  const finish = useCallback((): Promise<VoiceNote | null> => {
    const rec = recorder.current;
    if (!rec || rec.state === "inactive") return Promise.resolve(null);
    return new Promise((resolve) => {
      settle.current = resolve;
      rec.stop();
    });
  }, []);

  const start = useCallback(async () => {
    if (!detect() || recorder.current) return;
    setError(null);
    setStatus("starting");
    let media: MediaStream;
    try {
      media = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      setStatus("idle");
      setError(
        e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError")
          ? "Microphone access is blocked. Allow it in your browser settings to send voice notes."
          : "No microphone was found.",
      );
      return;
    }

    stream.current = media;
    const mimeType = pickMime();
    const rec = new MediaRecorder(media, mimeType ? { mimeType } : undefined);
    recorder.current = rec;
    chunks.current = [];
    discard.current = false;

    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.current.push(e.data);
    };
    rec.onstop = () => {
      const secs = Math.max(1, Math.round((performance.now() - startedAt.current) / 1000));
      const blob = new Blob(chunks.current, { type: rec.mimeType || mimeType || "audio/webm" });
      const note = discard.current || !blob.size ? null : { blob, seconds: secs };
      teardown();
      const resolve = settle.current;
      settle.current = null;
      if (resolve) resolve(note);
      else autoStop.current?.(note);
    };

    // Level meter: RMS of the waveform, smoothed into a scrolling row of bars.
    try {
      const ctx = new AudioContext();
      audioCtx.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(media).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      let last = 0;
      const draw = (t: number) => {
        frame.current = requestAnimationFrame(draw);
        if (t - last < 70) return;
        last = t;
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const v of data) sum += ((v - 128) / 128) ** 2;
        const level = Math.min(1, Math.sqrt(sum / data.length) * 4.5);
        setLevels((prev) => [...prev.slice(1), level]);
      };
      frame.current = requestAnimationFrame(draw);
    } catch {
      // No Web Audio: the note still records, the meter stays flat.
    }

    startedAt.current = performance.now();
    rec.start(250);
    setStatus("recording");
    tick.current = setInterval(() => {
      const s = Math.floor((performance.now() - startedAt.current) / 1000);
      setSeconds(s);
      if (s >= MAX_SECONDS && recorder.current?.state === "recording") recorder.current.stop();
    }, 250);
  }, [teardown]);

  const cancel = useCallback(() => {
    discard.current = true;
    if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop();
    else teardown();
  }, [teardown]);

  return {
    supported,
    status,
    seconds,
    levels,
    error,
    clearError: () => setError(null),
    start,
    stop: finish,
    cancel,
    maxSeconds: MAX_SECONDS,
  };
}

export function formatDuration(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
