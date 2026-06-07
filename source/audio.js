/* ============================================================
   Brickles — tiny synth audio engine (WebAudio, no files)
   ============================================================ */
const Sound = (() => {
  let ctx = null;
  let muted = false;
  let master = null;

  function ensure() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  // one synth voice
  function tone(freq, t0, dur, type = 'sine', vol = 0.3, glideTo = null) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(master);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  // pentatonic-ish scale so brick chimes always sound sweet
  const SCALE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];

  const api = {
    init() { ensure(); },
    get muted() { return muted; },
    toggle() { muted = !muted; return muted; },

    bounce() {
      if (muted) return; ensure();
      const t = ctx.currentTime;
      tone(420, t, 0.08, 'triangle', 0.22, 320);
    },
    wall() {
      if (muted) return; ensure();
      const t = ctx.currentTime;
      tone(300, t, 0.06, 'triangle', 0.14, 240);
    },
    // brick chime climbs the scale with the combo count
    brick(combo = 0) {
      if (muted) return; ensure();
      const t = ctx.currentTime;
      const f = SCALE[Math.min(combo, SCALE.length - 1)];
      tone(f, t, 0.18, 'sine', 0.28);
      tone(f * 2, t, 0.12, 'triangle', 0.10);
    },
    strong() {
      if (muted) return; ensure();
      const t = ctx.currentTime;
      tone(180, t, 0.1, 'square', 0.12, 140);
    },
    powerup() {
      if (muted) return; ensure();
      const t = ctx.currentTime;
      [0, 1, 2, 4].forEach((s, i) => tone(SCALE[s], t + i * 0.06, 0.2, 'triangle', 0.24));
    },
    catch() {
      if (muted) return; ensure();
      const t = ctx.currentTime;
      tone(660, t, 0.1, 'sine', 0.22, 990);
    },
    life() {
      if (muted) return; ensure();
      const t = ctx.currentTime;
      tone(392, t, 0.5, 'triangle', 0.2, 196);
    },
    levelClear() {
      if (muted) return; ensure();
      const t = ctx.currentTime;
      [0, 2, 4, 5, 7].forEach((s, i) => tone(SCALE[s], t + i * 0.1, 0.4, 'sine', 0.26));
    },
    win() {
      if (muted) return; ensure();
      const t = ctx.currentTime;
      [0, 2, 4, 7, 4, 7].forEach((s, i) => tone(SCALE[s % SCALE.length] * (i > 3 ? 2 : 1), t + i * 0.12, 0.5, 'triangle', 0.26));
    },
    launch() {
      if (muted) return; ensure();
      const t = ctx.currentTime;
      tone(300, t, 0.18, 'sine', 0.22, 720);
    },
  };
  return api;
})();
window.Sound = Sound;
