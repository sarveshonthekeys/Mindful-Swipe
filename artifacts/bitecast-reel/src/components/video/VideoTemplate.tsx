import { AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { useAmbientAudio } from '@/hooks/useAmbientAudio';
import { Grain } from './Grain';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

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

  return (
    <div className="w-full h-screen bg-black flex justify-center items-center overflow-hidden">
      <div
        className="relative overflow-hidden bg-black"
        style={{
          aspectRatio: '9 / 16',
          height: '100%',
          maxHeight: '100vh',
          maxWidth: 'calc(100vh * 9 / 16)',
          width: 'calc(100vh * 9 / 16)',
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
