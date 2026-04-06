import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import logo from '@assets/logo-removebg-preview_1775409673310.png';
import { Particles } from '../Particles';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1200);
    const t2 = setTimeout(() => setPhase(2), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: 'easeInOut' }}
    >
      <Particles count={35} color="white" />

      {/* Pulsing background glow */}
      <motion.div
        className="absolute w-[90%] h-[50%] rounded-full blur-[90px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1), transparent 70%)' }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.15, 0.08] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 w-full px-8 flex flex-col items-center justify-center gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <img
            src={logo}
            alt="BITECAST"
            style={{
              width: '454px',
              height: 'auto',
              filter: 'invert(1)',
              display: 'block',
            }}
          />
        </motion.div>

        <motion.h1
          className="text-[173px] font-extrabold text-white tracking-[0.1em] uppercase"
          initial={{ opacity: 0, scale: 0.9, letterSpacing: '0em' }}
          animate={{ opacity: 1, scale: 1, letterSpacing: '0.1em' }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          BITECAST
        </motion.h1>

        <motion.p
          className="text-[54px] font-light text-white/60 tracking-wider"
          initial={{ opacity: 0, y: 10 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Make every swipe count.
        </motion.p>

        {/* Coming Soon */}
        <motion.div
          className="flex flex-col items-center gap-3 mt-6"
          initial={{ opacity: 0, y: 16 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            style={{ width: phase >= 2 ? '120px' : '0px', height: '1px', background: 'rgba(255,255,255,0.25)', transition: 'width 1s cubic-bezier(0.16,1,0.3,1) 0.2s' }}
          />
          <p
            className="text-[36px] font-light text-white/40 tracking-[0.35em] uppercase"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Coming Soon
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
