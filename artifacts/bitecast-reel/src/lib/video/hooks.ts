// Video player hook - handles recording lifecycle, scene advancement, and looping

import { useState, useEffect, useRef } from 'react';

declare global {
  interface Window {
    startRecording?: () => Promise<void> | void;
    stopRecording?: () => void;
  }
}

export interface SceneDurations {
  [key: string]: number;
}

export interface UseVideoPlayerOptions {
  durations: SceneDurations;
  onVideoEnd?: () => void;
  loop?: boolean;
}

export interface UseVideoPlayerReturn {
  currentScene: number;
  totalScenes: number;
  currentSceneKey: string;
  hasEnded: boolean;
}

export function useVideoPlayer(options: UseVideoPlayerOptions): UseVideoPlayerReturn {
  const { durations, onVideoEnd, loop = true } = options;

  const sceneKeys = useRef(Object.keys(durations)).current;
  const totalScenes = sceneKeys.length;
  const durationsArray = useRef(Object.values(durations)).current;

  const [currentScene, setCurrentScene] = useState(0);
  const [hasEnded, setHasEnded] = useState(false);

  // Always start paused. Poll for window.startRecording to be injected by
  // the export tool. If it hasn't appeared within LIVE_PREVIEW_MS, assume
  // we're in live-preview mode and start immediately.
  const LIVE_PREVIEW_MS = 300;
  const [recordingReady, setRecordingReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let rafId: number;
    const deadline = performance.now() + LIVE_PREVIEW_MS;

    const poll = () => {
      if (cancelled) return;

      if (typeof window.startRecording === 'function') {
        // Export tool injected startRecording — call it and wait for ready signal
        Promise.resolve(window.startRecording()).then(() => {
          if (!cancelled) setRecordingReady(true);
        });
        return;
      }

      if (performance.now() >= deadline) {
        // No recording tool found within timeout — live preview mode
        setRecordingReady(true);
        return;
      }

      rafId = requestAnimationFrame(poll);
    };

    rafId = requestAnimationFrame(poll);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Scene advancement — only runs once recording is confirmed ready
  useEffect(() => {
    if (!recordingReady) return;
    if (hasEnded && !loop) return;

    const timer = setTimeout(() => {
      if (currentScene >= totalScenes - 1) {
        if (!hasEnded) {
          window.stopRecording?.();
          setHasEnded(true);
          onVideoEnd?.();
        }
        if (loop) setCurrentScene(0);
      } else {
        setCurrentScene(prev => prev + 1);
      }
    }, durationsArray[currentScene]);

    return () => clearTimeout(timer);
  }, [currentScene, totalScenes, durationsArray, hasEnded, loop, onVideoEnd, recordingReady]);

  return {
    currentScene,
    totalScenes,
    currentSceneKey: sceneKeys[currentScene],
    hasEnded,
  };
}

export function useSceneTimer(events: Array<{ time: number; callback: () => void }>) {
  const firedRef = useRef<Set<number>>(new Set());
  const callbacksRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    callbacksRef.current = events.map(e => e.callback);
  }, [events]);

  const scheduleKey = events.map((event, i) => `${i}:${event.time}`).join('|');

  useEffect(() => {
    firedRef.current = new Set();

    const timers = events.map(({ time }, index) =>
      setTimeout(() => {
        if (!firedRef.current.has(index)) {
          firedRef.current.add(index);
          callbacksRef.current[index]?.();
        }
      }, time)
    );

    return () => timers.forEach(clearTimeout);
  }, [scheduleKey]);
}
