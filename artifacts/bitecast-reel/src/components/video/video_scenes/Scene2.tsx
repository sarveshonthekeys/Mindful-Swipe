import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500)
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center bg-black"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(20px)' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 z-0">
        <video 
          src={`${import.meta.env.BASE_URL}videos/chaotic-scroll.mp4`}
          autoPlay 
          muted 
          loop 
          playsInline
          className="w-full h-full object-cover opacity-80 mix-blend-screen"
        />
      </div>

      <motion.div 
        className="relative z-10 w-full px-10 text-center flex flex-col items-center gap-6"
      >
        <motion.p
          className="text-[6vw] font-medium text-white/80 tracking-widest uppercase"
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          scrolling...
        </motion.p>

        <motion.p
          className="text-[7vw] font-semibold text-white/90 tracking-widest uppercase"
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={phase >= 1 ? { opacity: 1, filter: 'blur(0px)', scale: 1.1 } : { opacity: 0, filter: 'blur(10px)', scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          consuming...
        </motion.p>

        <motion.p
          className="text-[9vw] font-bold text-white tracking-widest uppercase text-red-500"
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={phase >= 2 ? { opacity: 1, filter: 'blur(0px)', scale: 1.2 } : { opacity: 0, filter: 'blur(10px)', scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          forgetting...
        </motion.p>
      </motion.div>
      
      {/* Glitch overlays that increase with phase */}
      <motion.div 
        className="absolute inset-0 bg-white mix-blend-overlay pointer-events-none"
        animate={{ opacity: phase >= 2 ? [0, 0.2, 0, 0.4, 0] : 0 }}
        transition={{ duration: 0.3, repeat: Infinity, repeatType: "mirror" }}
      />
    </motion.div>
  );
}