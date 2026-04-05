import { useEffect } from 'react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function noise(ctx: AudioContext, dur: number): AudioBuffer {
  const len = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/**
 * Natural phone swipe — filtered noise shaped like a finger dragging on glass.
 * Consistent volume, no variation.
 */
function playSwipe(ctx: AudioContext, dest: AudioNode, t: number) {
  const src = ctx.createBufferSource();
  src.buffer = noise(ctx, 0.075);
  const lpf = ctx.createBiquadFilter();
  lpf.type = 'lowpass'; lpf.frequency.value = 2600; lpf.Q.value = 0.9;
  const hpf = ctx.createBiquadFilter();
  hpf.type = 'highpass'; hpf.frequency.value = 550;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(0.17, t + 0.007);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.075);
  src.connect(lpf); lpf.connect(hpf); hpf.connect(env); env.connect(dest);
  src.start(t);
}

/**
 * Piano-like tone — sine fundamental + decaying harmonics.
 * Mimics a soft piano key strike.
 */
function playNote(ctx: AudioContext, dest: AudioNode, t: number, freq: number, vol = 0.11) {
  [[1, 1.0], [2, 0.3], [3, 0.12], [4, 0.05]].forEach(([mult, hv]) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq * mult;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(vol * hv, t + 0.006);
    env.gain.exponentialRampToValueAtTime(vol * hv * 0.18, t + 0.35);
    env.gain.exponentialRampToValueAtTime(0.001, t + 1.9);
    osc.connect(env); env.connect(dest);
    osc.start(t); osc.stop(t + 2.0);
  });
}

/** Soft sub-boom for logo moment — smooth pitch fall, no sharp attack */
function playCinematicImpact(ctx: AudioContext, dest: AudioNode, t: number) {
  const osc = ctx.createOscillator();
  osc.frequency.setValueAtTime(62, t);
  osc.frequency.exponentialRampToValueAtTime(20, t + 0.7);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(0.25, t + 0.016);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.85);
  osc.connect(env); env.connect(dest);
  osc.start(t); osc.stop(t + 0.9);

  const src = ctx.createBufferSource();
  src.buffer = noise(ctx, 0.55);
  const lpf = ctx.createBiquadFilter();
  lpf.type = 'lowpass'; lpf.frequency.value = 360;
  const nEnv = ctx.createGain();
  nEnv.gain.setValueAtTime(0, t);
  nEnv.gain.linearRampToValueAtTime(0.06, t + 0.016);
  nEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
  src.connect(lpf); lpf.connect(nEnv); nEnv.connect(dest);
  src.start(t);
}

// ─── Timeline ─────────────────────────────────────────────────────────────────
//
//  0–5s    Evenly spaced swipe sounds (8 swipes, every ~0.62s)
//  5–6s    Instant hard cut — complete silence
//  6–15s   Soft piano melody in D minor + low ambient pad
//  10s     Single cinematic impact (logo reveal)
//
function scheduleSequence(ctx: AudioContext, dest: AudioNode, stopped: { v: boolean }) {
  if (stopped.v) return;
  const T = ctx.currentTime + 0.02;

  // Gate — hard cut at 5s, reopen at 6s for music
  const seq = ctx.createGain();
  seq.connect(dest);
  seq.gain.setValueAtTime(1.0, T);
  seq.gain.setValueAtTime(1.0, T + 4.999); // hold full until last sample
  seq.gain.setValueAtTime(0.0, T + 5.0);   // hard cut
  seq.gain.setValueAtTime(1.0, T + 6.0);   // music begins

  // ── 0–5s: evenly spaced swipes ────────────────────────────────────────────
  const INTERVAL = 0.625; // 8 swipes in 5s
  for (let t = 0.15; t < 4.95; t += INTERVAL) {
    playSwipe(ctx, seq, T + t);
  }

  // ── 6–15s: soft piano melody (D minor arpeggio, slow ~0.88s per note) ────
  // D4=293.66  F4=349.23  A4=440.00  C5=523.25
  const D4 = 293.66, F4 = 349.23, A4 = 440.0, C5 = 523.25;
  const melody: [number, number][] = [
    [0.00, D4], [0.88, F4], [1.76, A4], [2.64, C5],
    [3.52, A4], [4.40, F4], [5.28, D4],
    [6.16, F4], [7.04, A4], [7.92, C5], [8.5,  A4],
  ];
  melody.forEach(([dt, freq]) => playNote(ctx, seq, T + 6.0 + dt, freq, 0.10));

  // ── Low ambient pad underneath — bypasses seq gate ────────────────────────
  // Holds steady across the music section without being cut by the gate
  const padLpf = ctx.createBiquadFilter();
  padLpf.type = 'lowpass'; padLpf.frequency.value = 520; padLpf.Q.value = 1.2;
  const padGain = ctx.createGain();
  padGain.gain.setValueAtTime(0, T + 6.0);
  padGain.gain.linearRampToValueAtTime(0.022, T + 7.8);  // gentle fade in
  padGain.gain.linearRampToValueAtTime(0.016, T + 14.9); // settle
  // D minor chord voicing: D2, A2, F3
  [[73.42, 'triangle'], [110.0, 'sine'], [174.61, 'sine']].forEach(([f, type]) => {
    const osc = ctx.createOscillator();
    osc.type = type as OscillatorType; osc.frequency.value = f as number;
    osc.connect(padLpf);
    osc.start(T + 6.0); osc.stop(T + 15.1);
  });
  padLpf.connect(padGain);
  padGain.connect(dest); // direct to dest — unaffected by the hard-cut gate

  // ── 10s: cinematic impact ─────────────────────────────────────────────────
  playCinematicImpact(ctx, seq, T + 10.0);

  // ── Loop ──────────────────────────────────────────────────────────────────
  setTimeout(() => {
    if (!stopped.v && ctx.state !== 'closed') scheduleSequence(ctx, dest, stopped);
  }, 14820);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAmbientAudio() {
  useEffect(() => {
    let ctx: AudioContext | null = null;
    const stopped = { v: false };

    function init() {
      if (ctx) return;
      ctx = new AudioContext();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 3; comp.knee.value = 12;
      comp.connect(ctx.destination);
      scheduleSequence(ctx, comp, stopped);
    }

    const onInteraction = () => init();
    setTimeout(() => { try { init(); } catch { /* autoplay blocked — wait for tap */ } }, 60);
    window.addEventListener('pointerdown', onInteraction, { once: true });

    return () => {
      window.removeEventListener('pointerdown', onInteraction);
      stopped.v = true;
      setTimeout(() => { ctx?.close(); }, 200);
    };
  }, []);
}
