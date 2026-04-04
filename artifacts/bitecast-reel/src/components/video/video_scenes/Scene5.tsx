import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setPhase(1), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
    >
      {/* Subtle background glow */}
      <motion.div 
        className="absolute w-[80vw] h-[80vw] rounded-full opacity-10 blur-[80px]"
        style={{ background: 'radial-gradient(circle, #ffffff, transparent)' }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.2, opacity: 0.15 }}
        transition={{ duration: 4, ease: "easeOut" }}
      />

      <div className="relative z-10 w-full px-8 flex flex-col items-center justify-center gap-6">
        <motion.h1 
          className="text-[16vw] font-extrabold text-white tracking-[0.1em] uppercase"
          initial={{ opacity: 0, scale: 0.9, letterSpacing: "0em" }}
          animate={{ opacity: 1, scale: 1, letterSpacing: "0.1em" }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          BITECAST
        </motion.h1>
        
        <motion.p
          className="text-[5vw] font-light text-white/60 tracking-wider"
          initial={{ opacity: 0, y: 10 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Make every swipe count.
        </motion.p>
      </div>
    </motion.div>
  );
}