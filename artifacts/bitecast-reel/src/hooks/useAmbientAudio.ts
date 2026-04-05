import { useEffect } from 'react';

// ─── Primitives ───────────────────────────────────────────────────────────────

function noise(ctx: AudioContext, dur: number): AudioBuffer {
  const len = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/** Finger swipe / scroll whoosh */
function playSwipe(ctx: AudioContext, dest: AudioNode, t: number, vol = 1.0) {
  const src = ctx.createBufferSource();
  src.buffer = noise(ctx, 0.065);
  const lpf = ctx.createBiquadFilter();
  lpf.type = 'lowpass'; lpf.frequency.value = 2400; lpf.Q.value = 1.2;
  const hpf = ctx.createBiquadFilter();
  hpf.type = 'highpass'; hpf.frequency.value = 280;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(0.16 * vol, t + 0.005);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.065);
  src.connect(lpf); lpf.connect(hpf); hpf.connect(env); env.connect(dest);
  src.start(t);
}

/** Light UI tap click */
function playTap(ctx: AudioContext, dest: AudioNode, t: number) {
  const src = ctx.createBufferSource();
  src.buffer = noise(ctx, 0.016);
  const bpf = ctx.createBiquadFilter();
  bpf.type = 'bandpass'; bpf.frequency.value = 2200; bpf.Q.value = 5;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(0.045, t + 0.002);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.016);
  src.connect(bpf); bpf.connect(env); env.connect(dest);
  src.start(t);
}

/** Notification ping — short sine chime */
function playPing(ctx: AudioContext, dest: AudioNode, t: number, freq: number, vol = 1.0) {
  const osc = ctx.createOscillator();
  osc.type = 'sine'; osc.frequency.value = freq;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(0.038 * vol, t + 0.007);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.19);
  osc.connect(env); env.connect(dest);
  osc.start(t); osc.stop(t + 0.2);
}

/** Digital glitch — staggered noise bursts with rising frequency */
function playGlitch(ctx: AudioContext, dest: AudioNode, t: number, intensity = 1.0) {
  const count = Math.round(4 + intensity * 2);
  for (let i = 0; i < count; i++) {
    const bt = t + i * 0.015;
    const src = ctx.createBufferSource();
    src.buffer = noise(ctx, 0.013);
    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 500 + (i / count) * 2800;
    const env = ctx.createGain();
    const v = Math.max(0.001, 0.09 * intensity * (1 - i * 0.1));
    env.gain.setValueAtTime(v, bt);
    env.gain.exponentialRampToValueAtTime(0.001, bt + 0.013);
    src.connect(bpf); bpf.connect(env); env.connect(dest);
    src.start(bt);
  }
}

/** Soft cinematic impact — deep sub boom + body noise */
function playCinematicImpact(ctx: AudioContext, dest: AudioNode, t: number) {
  const osc = ctx.createOscillator();
  osc.frequency.setValueAtTime(68, t);
  osc.frequency.exponentialRampToValueAtTime(22, t + 0.6);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(0.42, t + 0.012);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
  osc.connect(env); env.connect(dest);
  osc.start(t); osc.stop(t + 0.7);

  const src = ctx.createBufferSource();
  src.buffer = noise(ctx, 0.45);
  const lpf = ctx.createBiquadFilter();
  lpf.type = 'lowpass'; lpf.frequency.value = 450;
  const nEnv = ctx.createGain();
  nEnv.gain.setValueAtTime(0, t);
  nEnv.gain.linearRampToValueAtTime(0.11, t + 0.012);
  nEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
  src.connect(lpf); lpf.connect(nEnv); nEnv.connect(dest);
  src.start(t);
}

// ─── 15-second sequence ───────────────────────────────────────────────────────
//
//  0–2s   Gentle scrolling sounds + faint digital hum
//  2–6s   Escalating chaos: fast swipes, pings, glitch distortion
//  6–7s   HARD CUT — complete silence (no fade, no tail)
//  7–10s  Near silence — barely audible atmospheric pad
//  10–15s Soft cinematic impact + calm pad fade out
//
function scheduleSequence(ctx: AudioContext, dest: AudioNode, stopped: { v: boolean }) {
  if (stopped.v) return;
  const T = ctx.currentTime + 0.02;

  // Each iteration gets its own gain wrapper so AudioParam events don't accumulate
  const seq = ctx.createGain();
  seq.connect(dest);
  // Full volume 0–5.999s
  seq.gain.setValueAtTime(1.0, T);
  // Hard cut at 6s — no ramp, no tail
  seq.gain.setValueAtTime(1.0, T + 5.999);
  seq.gain.setValueAtTime(0.0, T + 6.0);
  // Open for cinematic section at 10s
  seq.gain.setValueAtTime(0.75, T + 10.0);
  seq.gain.exponentialRampToValueAtTime(0.001, T + 14.8);

  // ── 0–2s: faint digital ambient hum + slow scrolling ─────────────────────
  const ambLpf = ctx.createBiquadFilter();
  const ambGain = ctx.createGain();
  ambLpf.type = 'lowpass'; ambLpf.frequency.value = 320; ambLpf.Q.value = 3;
  ambGain.gain.setValueAtTime(0, T);
  ambGain.gain.linearRampToValueAtTime(0.02, T + 0.7);
  ambGain.gain.linearRampToValueAtTime(0.05, T + 5.6);
  ambGain.gain.setValueAtTime(0.05, T + 5.999);
  ambGain.gain.setValueAtTime(0, T + 6.0); // hard cut on the hum too
  [160, 161.6].forEach(freq => {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth'; osc.frequency.value = freq;
    osc.connect(ambLpf);
    osc.start(T); osc.stop(T + 6.01);
  });
  ambLpf.connect(ambGain); ambGain.connect(seq);

  // Slow, subtle scroll sounds
  playSwipe(ctx, seq, T + 0.25, 0.5);
  playTap(ctx, seq,   T + 0.85);
  playSwipe(ctx, seq, T + 1.35, 0.55);
  playTap(ctx, seq,   T + 1.82);

  // ── 2–6s: escalating chaos ───────────────────────────────────────────────
  // Phase 1: ~every 0.36s (2.0–3.0s)
  for (let t = 2.1; t < 3.0; t += 0.36) {
    playSwipe(ctx, seq, T + t, 0.7);
  }

  // Phase 2: ~every 0.2s, rising volume (3.0–4.5s)
  let v2 = 0.78;
  for (let t = 3.05; t < 4.5; t += 0.2) {
    playSwipe(ctx, seq, T + t, v2);
    v2 = Math.min(1.0, v2 + 0.022);
  }

  // Phase 3: rapid-fire, accelerating (4.5–5.98s)
  {
    let t = 4.5, dt = 0.115, v3 = 0.95;
    while (t < 5.98) {
      playSwipe(ctx, seq, T + t, v3);
      t += dt;
      dt = Math.max(0.038, dt * 0.935);
      v3 = Math.min(1.2, v3 + 0.012);
    }
  }

  // Notification pings — sparse at first, flooding at peak
  const pings: [number, number, number][] = [
    [2.45, 1380, 0.7], [3.2, 1620, 0.8],  [3.85, 1280, 0.9],
    [4.35, 1840, 0.95],[4.72, 1500, 1.0], [5.02, 2050, 1.0],
    [5.22, 1350, 1.0], [5.42, 1780, 1.0], [5.6,  1950, 1.0],
    [5.76, 2250, 1.0], [5.9,  1600, 1.0],
  ];
  pings.forEach(([t, f, v]) => playPing(ctx, seq, T + t, f, v));

  // Glitch bursts — increase intensity toward the cut
  const glitches: [number, number][] = [
    [3.5, 0.45], [4.2, 0.75], [4.88, 1.1], [5.32, 1.45], [5.72, 1.8],
  ];
  glitches.forEach(([t, i]) => playGlitch(ctx, seq, T + t, i));

  // ── 6–7s: enforced by seq.gain = 0 ───────────────────────────────────────

  // ── 7–10s: barely-audible pad — bypass seq gain, go direct ───────────────
  const padLpf = ctx.createBiquadFilter();
  const padGain = ctx.createGain();
  padLpf.type = 'lowpass'; padLpf.frequency.value = 480; padLpf.Q.value = 2;
  padGain.gain.setValueAtTime(0, T + 7.0);
  padGain.gain.linearRampToValueAtTime(0.014, T + 8.5);
  padGain.gain.linearRampToValueAtTime(0.01, T + 15.0);
  [110, 165].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = i === 0 ? 'triangle' : 'sine';
    osc.frequency.value = freq;
    osc.connect(padLpf);
    osc.start(T + 7.0); osc.stop(T + 15.1);
  });
  padLpf.connect(padGain); padGain.connect(dest); // direct — unaffected by seq gate

  // ── 10–15s: cinematic impact ──────────────────────────────────────────────
  playCinematicImpact(ctx, seq, T + 10.0);

  // ── Loop ──────────────────────────────────────────────────────────────────
  setTimeout(() => {
    if (!stopped.v && ctx.state !== 'closed') {
      scheduleSequence(ctx, dest, stopped);
    }
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
      comp.threshold.value = -14; comp.ratio.value = 3; comp.knee.value = 10;
      comp.connect(ctx.destination);
      scheduleSequence(ctx, comp, stopped);
    }

    const onInteraction = () => init();
    setTimeout(() => { try { init(); } catch { /* autoplay blocked */ } }, 60);
    window.addEventListener('pointerdown', onInteraction, { once: true });

    return () => {
      window.removeEventListener('pointerdown', onInteraction);
      stopped.v = true;
      setTimeout(() => { ctx?.close(); }, 200);
    };
  }, []);
}
