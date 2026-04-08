import { useState, useRef, useCallback } from 'react';

declare global {
  interface Window {
    audioStream?: MediaStream;
  }
}

const VIDEO_DURATION_MS = 15_000; // full reel: 2+4+1+3+5 seconds

export type RecordingState = 'idle' | 'recording' | 'saving';

export function useRecorder() {
  const [state, setState] = useState<RecordingState>('idle');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(async () => {
    if (state !== 'idle') return;

    try {
      // Capture the current tab (video track only — audio comes from Web Audio)
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 60 },
        audio: false,
      });

      // Pull the audio track from the Web Audio MediaStreamDestination
      const audioTracks = window.audioStream?.getAudioTracks() ?? [];

      // Combine display video + procedural audio into one stream
      const combined = new MediaStream([
        ...displayStream.getVideoTracks(),
        ...audioTracks,
      ]);

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm';

      const recorder = new MediaRecorder(combined, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        setState('saving');
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bitecast-reel.webm';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        displayStream.getTracks().forEach((t) => t.stop());
        setState('idle');
      };

      recorderRef.current = recorder;
      recorder.start(100); // collect data every 100ms
      setState('recording');

      // Auto-stop after one full reel cycle
      stopTimerRef.current = setTimeout(() => stop(), VIDEO_DURATION_MS);

    } catch (err) {
      console.warn('[bitecast] recording failed:', err);
      setState('idle');
    }
  }, [state]);

  const stop = useCallback(() => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
  }, []);

  return { state, start, stop };
}
