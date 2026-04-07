import { useEffect } from 'react';

declare global {
  interface Window {
    __audioStream?: MediaStream;
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
    let ctx: AudioContext | null = null;
    const stopped = { v: false };

    function init() {
      if (ctx) return;
      ctx = new AudioContext();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 3; comp.knee.value = 12;

      // Route audio to device speakers (live playback)
      comp.connect(ctx.destination);

      // Also route to a MediaStreamDestination so the export recorder
      // can capture the audio and mux it into the exported video file.
      const recordingDest = ctx.createMediaStreamDestination();
      comp.connect(recordingDest);
      window.__audioStream = recordingDest.stream;

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
