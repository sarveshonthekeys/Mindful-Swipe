import { useEffect } from 'react';

declare global {
  interface Window {
    audioStream?: MediaStream;
    __bitecastAudio?: { ctx: AudioContext; comp: AudioNode };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function noise(ctx: AudioContext, dur: number): AudioBuffer {
  const len = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/**
 * Smooth phone swipe — soft noise arc shaped like a slow finger drag across glass.
 * Bandpass centred at 1400 Hz for natural glass-friction texture, gentle attack,
 * sustained body, and a long smooth exponential tail.
 */
function playSwipe(ctx: AudioContext, dest: AudioNode, t: number, vol = 0.13) {
  const dur = 0.20;
  const src = ctx.createBufferSource();
  src.buffer = noise(ctx, dur);

  // Bandpass for glass-swipe texture — avoids harsh highs and muddy lows
  const bpf = ctx.createBiquadFilter();
  bpf.type = 'bandpass'; bpf.frequency.value = 1400; bpf.Q.value = 1.1;

  // High-shelf cut to soften the top end further
  const hsh = ctx.createBiquadFilter();
  hsh.type = 'highshelf'; hsh.frequency.value = 3000; hsh.gain.value = -9;

  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(vol, t + 0.016);         // soft attack
  env.gain.linearRampToValueAtTime(vol * 0.55, t + 0.085); // settle into body
  env.gain.exponentialRampToValueAtTime(0.001, t + dur);    // long smooth tail

  src.connect(bpf); bpf.connect(hsh); hsh.connect(env); env.connect(dest);
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
//  0–2s    Scene1: 3 smooth swipe sounds aligned with scrolling-phone video
//  2–5s    Silence (no scrolling video, no swipes)
//  5–6s    Instant hard cut — complete silence
//  6–15s   Soft piano melody in D minor + low ambient pad
//  10s     Single cinematic impact (logo reveal)
//
function scheduleSequence(ctx: AudioContext, dest: AudioNode, stopped: { v: boolean }) {
  if (stopped.v) return;
  const T = ctx.currentTime + 0.02;

  // Gate — audible during scene1 (0–2s), silent 2–5s, hard cut 5s, music from 6s
  const seq = ctx.createGain();
  seq.connect(dest);
  seq.gain.setValueAtTime(1.0, T);          // scene1: swipes audible
  seq.gain.setValueAtTime(0.0, T + 2.0);    // scene1 ends — cut swipes
  seq.gain.setValueAtTime(0.0, T + 4.999);
  seq.gain.setValueAtTime(0.0, T + 5.0);   // hard cut (already silent)
  seq.gain.setValueAtTime(1.0, T + 6.0);   // music begins

  // ── 0–2s: 3 smooth swipes timed to the scrolling-phone video ─────────────
  playSwipe(ctx, seq, T + 0.25);  // first scroll
  playSwipe(ctx, seq, T + 0.90);  // second scroll
  playSwipe(ctx, seq, T + 1.55);  // third scroll

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
    const stopped = { v: false };
    let soundsStarted = false;

    // Reuse the AudioContext pre-created in index.html's inline script so that
    // window.audioStream is available before any recorder initialises.
    const pre = window.__bitecastAudio;
    const ctx  = pre ? pre.ctx  : new AudioContext();
    const comp = pre ? pre.comp : (() => {
      const c = ctx.createDynamicsCompressor();
      c.threshold.value = -14; c.ratio.value = 3; c.knee.value = 12;
      c.connect(ctx.destination);
      const rd = ctx.createMediaStreamDestination();
      c.connect(rd);
      window.audioStream = rd.stream;
      return c;
    })();

    function startSounds() {
      if (soundsStarted || stopped.v) return;
      soundsStarted = true;
      ctx.resume().then(() => {
        if (!stopped.v) scheduleSequence(ctx, comp, stopped);
      }).catch(() => {});
    }

    // Sync audio start with recording start:
    // Poll at ~60fps for window.startRecording to appear (export mode).
    // If not found within 310ms (just after hooks.ts LIVE_PREVIEW_MS=300ms),
    // start anyway for live preview mode.
    let syncTimer: ReturnType<typeof setTimeout>;
    const syncInterval = setInterval(() => {
      if (typeof window.startRecording === 'function') {
        clearInterval(syncInterval);
        clearTimeout(syncTimer);
        startSounds();
      }
    }, 16);

    syncTimer = setTimeout(() => {
      clearInterval(syncInterval);
      startSounds();
    }, 310);

    // Also start on user interaction for normal browser preview.
    const onInteraction = () => startSounds();
    window.addEventListener('pointerdown', onInteraction, { once: true });

    return () => {
      clearInterval(syncInterval);
      clearTimeout(syncTimer);
      window.removeEventListener('pointerdown', onInteraction);
      stopped.v = true;
      // Only close ctx if we created it ourselves (not the shared pre-init one)
      if (!pre) {
        delete window.audioStream;
        setTimeout(() => { ctx.close(); }, 200);
      }
    };
  }, []);
}
