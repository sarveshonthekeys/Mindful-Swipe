import { AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useVideoPlayer } from '@/lib/video';
import { useAmbientAudio } from '@/hooks/useAmbientAudio';
import { useRecorder } from '@/hooks/useRecorder';
import { Grain } from './Grain';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

const CANVAS_W = 1080;
const CANVAS_H = 1920;

const SCENE_DURATIONS = {
  scene1: 2000,
  scene2: 4000,
  scene3: 1000,
  scene4: 3000,
  scene5: 5000,
};

const btnStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 24,
  right: 24,
  zIndex: 9999,
  padding: '10px 20px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: '0.04em',
  fontFamily: 'system-ui, sans-serif',
  transition: 'opacity 0.2s',
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });
  useAmbientAudio();
  const { state, start, stop } = useRecorder();

  const [scale, setScale] = useState(() =>
    Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H)
  );

  useEffect(() => {
    const update = () =>
      setScale(Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H));
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const isRecording = state === 'recording';
  const isSaving   = state === 'saving';

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: `${CANVAS_W}px`,
          height: `${CANVAS_H}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
          background: '#000',
        }}
      >
        <AnimatePresence mode="popLayout">
          {currentScene === 0 && <Scene1 key="s1" />}
          {currentScene === 1 && <Scene2 key="s2" />}
          {currentScene === 2 && <Scene3 key="s3" />}
          {currentScene === 3 && <Scene4 key="s4" />}
          {currentScene === 4 && <Scene5 key="s5" />}
        </AnimatePresence>

        <Grain opacity={0.04} />
      </div>

      {/* Record button — outside the video canvas, fixed to viewport */}
      <button
        onClick={isRecording ? stop : start}
        disabled={isSaving}
        style={{
          ...btnStyle,
          background: isSaving ? '#444' : isRecording ? '#cc2200' : '#ffffff',
          color:      isSaving ? '#aaa' : isRecording ? '#ffffff' : '#000000',
          opacity:    isSaving ? 0.7 : 1,
        }}
      >
        {isSaving ? 'Saving…' : isRecording ? '⏹ Stop (auto at 15 s)' : '⏺ Record'}
      </button>
    </div>
  );
}
