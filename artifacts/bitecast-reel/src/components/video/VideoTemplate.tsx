import { AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useVideoPlayer } from '@/lib/video';
import { useAmbientAudio } from '@/hooks/useAmbientAudio';
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

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });
  useAmbientAudio();

  const [scale, setScale] = useState(() =>
    Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H)
  );

  useEffect(() => {
    const update = () =>
      setScale(Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H));
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

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
    </div>
  );
}
