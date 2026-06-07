const SCALE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];

let audioCtx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

function ensure(): void {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    master = audioCtx.createGain();
    master.gain.value = 0.5;
    master.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function tone(
  freq: number, t0: number, dur: number,
  type: OscillatorType = 'sine', vol = 0.3, glideTo?: number,
): void {
  if (!audioCtx || !master) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (glideTo !== undefined) o.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

export const Sound = {
  init(): void { ensure(); },
  get muted(): boolean { return muted; },
  toggle(): boolean { muted = !muted; return muted; },

  bounce(): void {
    if (muted) return; ensure();
    const t = audioCtx!.currentTime;
    tone(420, t, 0.08, 'triangle', 0.22, 320);
  },
  wall(): void {
    if (muted) return; ensure();
    const t = audioCtx!.currentTime;
    tone(300, t, 0.06, 'triangle', 0.14, 240);
  },
  brick(combo = 0): void {
    if (muted) return; ensure();
    const t = audioCtx!.currentTime;
    const f = SCALE[Math.min(combo, SCALE.length - 1)];
    tone(f,     t, 0.18, 'sine',     0.28);
    tone(f * 2, t, 0.12, 'triangle', 0.10);
  },
  strong(): void {
    if (muted) return; ensure();
    const t = audioCtx!.currentTime;
    tone(180, t, 0.1, 'square', 0.12, 140);
  },
  powerup(): void {
    if (muted) return; ensure();
    const t = audioCtx!.currentTime;
    [0, 1, 2, 4].forEach((s, i) => tone(SCALE[s], t + i * 0.06, 0.2, 'triangle', 0.24));
  },
  catch(): void {
    if (muted) return; ensure();
    const t = audioCtx!.currentTime;
    tone(660, t, 0.1, 'sine', 0.22, 990);
  },
  life(): void {
    if (muted) return; ensure();
    const t = audioCtx!.currentTime;
    tone(392, t, 0.5, 'triangle', 0.2, 196);
  },
  levelClear(): void {
    if (muted) return; ensure();
    const t = audioCtx!.currentTime;
    [0, 2, 4, 5, 7].forEach((s, i) => tone(SCALE[s], t + i * 0.1, 0.4, 'sine', 0.26));
  },
  win(): void {
    if (muted) return; ensure();
    const t = audioCtx!.currentTime;
    [0, 2, 4, 7, 4, 7].forEach((s, i) =>
      tone(SCALE[s % SCALE.length] * (i > 3 ? 2 : 1), t + i * 0.12, 0.5, 'triangle', 0.26));
  },
  launch(): void {
    if (muted) return; ensure();
    const t = audioCtx!.currentTime;
    tone(300, t, 0.18, 'sine', 0.22, 720);
  },
};
