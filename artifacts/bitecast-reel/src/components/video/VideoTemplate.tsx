import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
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
  scene5: 5000 
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black flex justify-center items-center">
      {/* Container forcing 9:16 aspect ratio internally if viewed on wide screens, 
          though the request says to build for 9:16 natively. We just fill the screen
          and assume the container provides a 9:16 viewport (like Instagram Reel) */}
      <div className="relative w-full h-full overflow-hidden bg-black">
        
        <AnimatePresence mode="popLayout">
          {currentScene === 0 && <Scene1 key="s1" />}
          {currentScene === 1 && <Scene2 key="s2" />}
          {currentScene === 2 && <Scene3 key="s3" />}
          {currentScene === 3 && <Scene4 key="s4" />}
          {currentScene === 4 && <Scene5 key="s5" />}
        </AnimatePresence>

      </div>
    </div>
  );
}