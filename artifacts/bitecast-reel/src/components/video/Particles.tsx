import { useMemo } from 'react';

interface ParticleDef {
  id: number;
  x: number;
  size: number;
  speed: number;
  opacity: number;
  delay: number;
  drift: number;
}

export function Particles({
  count = 28,
  color = 'white',
}: {
  count?: number;
  color?: string;
}) {
  const particles = useMemo<ParticleDef[]>(() => {
    const rng = (min: number, max: number) => Math.random() * (max - min) + min;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: rng(2, 98),
      size: rng(1, 3.5),
      speed: rng(14, 32),
      opacity: rng(0.08, 0.35),
      delay: rng(-30, 0),
      drift: rng(-12, 12),
    }));
  }, [count]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    >
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            bottom: `-${p.size + 2}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: '50%',
            backgroundColor: color,
            opacity: p.opacity,
            animation: `particle-rise ${p.speed}s ${p.delay}s linear infinite`,
            '--drift': `${p.drift}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
