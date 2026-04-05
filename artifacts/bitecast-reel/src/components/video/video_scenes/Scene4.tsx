import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Particles } from '../Particles';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setPhase(1), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-black"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Particles count={22} color="white" />

      {/* Slow radial pulse */}
      <motion.div
        className="absolute w-[120%] h-[120%] rounded-full blur-[100px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.04), transparent 60%)' }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 w-full px-8 text-center">
        <motion.h2
          className="text-[12vw] font-medium text-white leading-tight tracking-tight"
          initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          What if every swipe made you better?
        </motion.h2>
      </div>
    </motion.div>
  );
}
