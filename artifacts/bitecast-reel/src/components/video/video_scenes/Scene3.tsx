import { motion } from 'framer-motion';

export function Scene3() {
  return (
    <motion.div 
      className="absolute inset-0 bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
      transition={{ duration: 0 }}
      // Abrupt cut, 0 duration transition
    >
      {/* Pure black screen, complete silence (no visual elements) */}
    </motion.div>
  );
}