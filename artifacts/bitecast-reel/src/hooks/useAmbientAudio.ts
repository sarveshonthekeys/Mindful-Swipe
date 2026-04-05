import { useEffect } from 'react';

const BPM = 126;
const BEAT = 60 / BPM;

function makeNoise(ctx: AudioContext, dur: number): AudioBuffer {
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function scheduleKick(ctx: AudioContext, dest: AudioNode, t: number) {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.frequency.setValueAtTime(85, t);
  osc.frequency.exponentialRampToValueAtTime(28, t + 0.28);
  env.gain.setValueAtTime(1.2, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
  osc.connect(env); env.connect(dest);
  osc.start(t); osc.stop(t + 0.4);

  const click = ctx.createBufferSource();
  click.buffer = makeNoise(ctx, 0.025);
  const bpf = ctx.createBiquadFilter();
  bpf.type = 'bandpass'; bpf.frequency.value = 180;
  const clickEnv = ctx.createGain();
  clickEnv.gain.setValueAtTime(0.5, t);
  clickEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
  click.connect(bpf); bpf.connect(clickEnv); clickEnv.connect(dest);
  click.start(t);
}

function scheduleHat(ctx: AudioContext, dest: AudioNode, t: number, vel: number) {
  const src = ctx.createBufferSource();
  src.buffer = makeNoise(ctx, 0.07);
  const hpf = ctx.createBiquadFilter();
  hpf.type = 'highpass'; hpf.frequency.value = 8500;
  const env = ctx.createGain();
  env.gain.setValueAtTime(vel * 0.14, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  src.connect(hpf); hpf.connect(env); env.connect(dest);
  src.start(t);
}

function scheduleSnare(ctx: AudioContext, dest: AudioNode, t: number) {
  const noise = ctx.createBufferSource();
  noise.buffer = makeNoise(ctx, 0.2);
  const bpf = ctx.createBiquadFilter();
  bpf.type = 'bandpass'; bpf.frequency.value = 1200; bpf.Q.value = 0.8;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.5, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  noise.connect(bpf); bpf.connect(env); env.connect(dest);
  noise.start(t);
}

function scheduleMeasure(ctx: AudioContext, dest: AudioNode, start: number) {
  scheduleKick(ctx, dest, start);
  scheduleKick(ctx, dest, start + BEAT * 2);
  scheduleSnare(ctx, dest, start + BEAT * 1);
  scheduleSnare(ctx, dest, start + BEAT * 3);
  const hatVelocities = [1, 0.5, 0.8, 0.5, 1, 0.5, 0.8, 0.5];
  for (let i = 0; i < 8; i++) {
    scheduleHat(ctx, dest, start + i * BEAT * 0.5, hatVelocities[i]);
  }
}

export function useAmbientAudio() {
  useEffect(() => {
    let ctx: AudioContext | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;
    let nextMeasure = 0;
    const padOscs: OscillatorNode[] = [];

    function init() {
      if (ctx) return;
      ctx = new AudioContext();

      const master = ctx.createGain();
      master.gain.setValueAtTime(0, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 3.5);
      master.connect(ctx.destination);

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.ratio.value = 4;
      compressor.connect(master);

      const padFreqs = [55, 82.4, 110, 164.8];
      padFreqs.forEach((freq, i) => {
        const osc = ctx!.createOscillator();
        const lpf = ctx!.createBiquadFilter();
        const gain = ctx!.createGain();
        osc.type = i % 2 === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.value = freq + i * 0.15;
        lpf.type = 'lowpass'; lpf.frequency.value = 700; lpf.Q.value = 2.5;
        gain.gain.value = 0.055;
        osc.connect(lpf); lpf.connect(gain); gain.connect(master);
        osc.start();
        padOscs.push(osc);
      });

      const delay = ctx.createDelay(2);
      delay.delayTime.value = BEAT * 0.75;
      const fb = ctx.createGain();
      fb.gain.value = 0.3;
      const delayIn = ctx.createGain();
      delayIn.gain.value = 0.18;
      compressor.connect(delayIn);
      delayIn.connect(delay);
      delay.connect(fb); fb.connect(delay);
      delay.connect(master);

      nextMeasure = ctx.currentTime + 0.05;
      interval = setInterval(() => {
        if (!ctx) return;
        while (nextMeasure < ctx.currentTime + 0.5) {
          scheduleMeasure(ctx, compressor, nextMeasure);
          nextMeasure += BEAT * 4;
        }
      }, 100);
    }

    const onInteraction = () => init();

    setTimeout(() => {
      try { init(); } catch { /* wait for interaction */ }
    }, 50);

    window.addEventListener('pointerdown', onInteraction, { once: true });

    return () => {
      window.removeEventListener('pointerdown', onInteraction);
      if (interval) clearInterval(interval);
      if (ctx) {
        padOscs.forEach(o => { try { o.stop(); } catch { /* already stopped */ } });
        const m = ctx.createGain();
        m.gain.setValueAtTime(0, ctx.currentTime);
        setTimeout(() => ctx?.close(), 800);
      }
    };
  }, []);
}
