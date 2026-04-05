import { useEffect } from 'react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeNoise(ctx: AudioContext, dur: number): AudioBuffer {
  const len = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/** Soft cinematic sub-boom — smooth pitch fall, gentle noise body */
function playCinematicImpact(ctx: AudioContext, dest: AudioNode, t: number) {
  const osc = ctx.createOscillator();
  osc.frequency.setValueAtTime(62, t);
  osc.frequency.exponentialRampToValueAtTime(20, t + 0.7);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(0.38, t + 0.018);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
  osc.connect(env); env.connect(dest);
  osc.start(t); osc.stop(t + 0.85);

  const src = ctx.createBufferSource();
  src.buffer = makeNoise(ctx, 0.6);
  const lpf = ctx.createBiquadFilter();
  lpf.type = 'lowpass'; lpf.frequency.value = 380;
  const nEnv = ctx.createGain();
  nEnv.gain.setValueAtTime(0, t);
  nEnv.gain.linearRampToValueAtTime(0.09, t + 0.018);
  nEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  src.connect(lpf); lpf.connect(nEnv); nEnv.connect(dest);
  src.start(t);
}

// ─── 15-second sequence ───────────────────────────────────────────────────────
//
//  0–6s   ONE continuous rising synth sound with accelerating tremolo pulse
//  6s     Instant hard cut — seq gain snaps to 0, no tail
//  7–15s  Calm sine-wave pad + cinematic impact at 10s
//
function scheduleSequence(ctx: AudioContext, dest: AudioNode, stopped: { v: boolean }) {
  if (stopped.v) return;
  const T = ctx.currentTime + 0.02;

  // Per-run gate — hard cut at 6s, opens again at 10s for impact
  const seq = ctx.createGain();
  seq.connect(dest);
  seq.gain.setValueAtTime(1.0, T);
  seq.gain.setValueAtTime(1.0, T + 5.999); // hold until last sample
  seq.gain.setValueAtTime(0.0, T + 6.0);   // hard cut — no ramp
  seq.gain.setValueAtTime(0.7, T + 10.0);  // open for impact
  seq.gain.exponentialRampToValueAtTime(0.001, T + 14.9);

  // ── 0–6s: single continuous rising ambient synth ──────────────────────────
  //
  // Two detuned sawtooth oscillators whose pitch slowly rises (80→145 Hz),
  // run through a low-pass filter whose cutoff opens up (280→1100 Hz),
  // giving the sensation of a hum evolving into something more present.
  //
  // A tremolo LFO creates the rhythmic pulse texture:
  //   frequency sweeps 0.4 → 4 Hz (slow heartbeat → fast throb)
  //   depth grows 0.02 → 0.22 (barely perceptible → noticeable)
  // The main volume envelope rises gently from silence to a moderate peak.

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(280, T);
  filter.frequency.linearRampToValueAtTime(1100, T + 6.0);
  filter.Q.value = 1.8;

  const baseGain = ctx.createGain();
  baseGain.gain.setValueAtTime(0, T);
  baseGain.gain.linearRampToValueAtTime(0.28, T + 1.0);   // fade in
  baseGain.gain.linearRampToValueAtTime(0.42, T + 6.0);   // slow rise

  const tremoloGain = ctx.createGain();
  tremoloGain.gain.setValueAtTime(1.0, T); // base value; LFO adds on top

  // LFO — sine wave modulating tremoloGain.gain audio-rate
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(0.4, T);
  lfo.frequency.linearRampToValueAtTime(4.2, T + 5.8); // accelerating pulse

  const lfoDepth = ctx.createGain();
  lfoDepth.gain.setValueAtTime(0.02, T);
  lfoDepth.gain.linearRampToValueAtTime(0.22, T + 5.8); // depth grows
  lfo.connect(lfoDepth);
  lfoDepth.connect(tremoloGain.gain); // audio-rate modulation of gain

  // Oscillators: two detuned voices for thickness
  [[80, 'sawtooth'], [80.6, 'triangle']].forEach(([freq, type]) => {
    const osc = ctx.createOscillator();
    osc.type = type as OscillatorType;
    osc.frequency.setValueAtTime(freq as number, T);
    osc.frequency.linearRampToValueAtTime((freq as number) * 1.81, T + 6.0); // ~octave + 2nd
    osc.connect(filter);
    osc.start(T); osc.stop(T + 6.01);
  });

  // Wire build chain
  filter.connect(baseGain);
  baseGain.connect(tremoloGain);
  tremoloGain.connect(seq);
  lfo.start(T); lfo.stop(T + 6.0);

  // ── 6–7s: absolute silence (enforced by seq.gain = 0) ────────────────────

  // ── 7–15s: calm sine pad — bypass seq gate (direct to dest) ──────────────
  const padFilter = ctx.createBiquadFilter();
  padFilter.type = 'lowpass'; padFilter.frequency.value = 420; padFilter.Q.value = 1.5;
  const padGain = ctx.createGain();
  padGain.gain.setValueAtTime(0, T + 7.0);
  padGain.gain.linearRampToValueAtTime(0.013, T + 9.0);  // gentle fade in
  padGain.gain.linearRampToValueAtTime(0.01, T + 15.0);  // stable through end
  // Three clean harmonics for warmth
  [[110, 'sine'], [165, 'sine'], [220, 'triangle']].forEach(([freq, type]) => {
    const osc = ctx.createOscillator();
    osc.type = type as OscillatorType;
    osc.frequency.value = freq as number;
    osc.connect(padFilter);
    osc.start(T + 7.0); osc.stop(T + 15.1);
  });
  padFilter.connect(padGain);
  padGain.connect(dest); // direct — unaffected by seq gate

  // ── 10s: soft cinematic impact ────────────────────────────────────────────
  playCinematicImpact(ctx, seq, T + 10.0);

  // ── Loop at 15s ───────────────────────────────────────────────────────────
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
      comp.threshold.value = -14; comp.ratio.value = 3; comp.knee.value = 12;
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
