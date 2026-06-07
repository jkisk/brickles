/* ============================================================
   Brickles — drawing helpers (cartoon, thick-outline style)
   ============================================================ */

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function starPath(ctx, cx, cy, outerR, innerR, points, rot) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (Math.PI / points) * i - Math.PI / 2 + rot;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function heartPath(ctx, cx, cy, s) {
  // s = overall width-ish
  ctx.beginPath();
  const top = cy - s * 0.28;
  ctx.moveTo(cx, cy + s * 0.42);
  ctx.bezierCurveTo(cx - s * 0.62, cy - s * 0.06, cx - s * 0.5, top - s * 0.36, cx, top);
  ctx.bezierCurveTo(cx + s * 0.5, top - s * 0.36, cx + s * 0.62, cy - s * 0.06, cx, cy + s * 0.42);
  ctx.closePath();
}

// cute face: two eyes + a smile, optional rosy cheeks
function drawFace(ctx, cx, cy, scale, cheekColor) {
  const e = 2.2 * scale;
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.arc(cx - 6 * scale, cy, e, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 6 * scale, cy, e, 0, Math.PI * 2); ctx.fill();
  // tiny eye sparkle
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(cx - 6 * scale + 0.8 * scale, cy - 0.8 * scale, 0.8 * scale, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 6 * scale + 0.8 * scale, cy - 0.8 * scale, 0.8 * scale, 0, Math.PI * 2); ctx.fill();
  // smile
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8 * scale;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy + 1.5 * scale, 4 * scale, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // cheeks
  if (cheekColor) {
    ctx.fillStyle = cheekColor;
    ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.arc(cx - 9 * scale, cy + 3 * scale, 2.2 * scale, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 9 * scale, cy + 3 * scale, 2.2 * scale, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// ---- Background: dreamy sky, big rainbow, fluffy clouds, twinkles ----
function drawBackground(ctx, W, H, t, clouds, twinkles) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#cfe9ff');
  sky.addColorStop(0.45, '#e7dcff');
  sky.addColorStop(1, '#ffe3f1');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // soft sun glow upper-left
  const sun = ctx.createRadialGradient(W * 0.18, H * 0.12, 10, W * 0.18, H * 0.12, 360);
  sun.addColorStop(0, 'rgba(255,249,210,0.85)');
  sun.addColorStop(1, 'rgba(255,249,210,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, W, H);

  // giant rainbow arc behind everything
  const cx = W * 0.5, cy = H * 1.02;
  const bands = ['#ff7fc4', '#a87cff', '#4db5ff', '#5fd97a', '#ffd93b', '#ff9f43', '#ff5d6c'];
  const baseR = H * 0.92;
  const bw = 26;
  ctx.globalAlpha = 0.22;
  ctx.lineWidth = bw;
  bands.forEach((c, i) => {
    ctx.strokeStyle = c;
    ctx.beginPath();
    ctx.arc(cx, cy, baseR - i * bw, Math.PI, Math.PI * 2);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;

  // clouds
  clouds.forEach(cl => drawCloud(ctx, cl.x, cl.y, cl.s));

  // background twinkles
  twinkles.forEach(tw => {
    const tw2 = (Math.sin(t * tw.sp + tw.ph) + 1) / 2;
    ctx.globalAlpha = 0.25 + tw2 * 0.6;
    ctx.fillStyle = '#fffce0';
    starPath(ctx, tw.x, tw.y, tw.r * (0.6 + tw2 * 0.5), tw.r * 0.35, 4, t * 0.2 + tw.ph);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawCloud(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  const puffs = [[0, 0, 26], [28, 6, 22], [-28, 6, 22], [14, -10, 20], [-14, -10, 20]];
  ctx.beginPath();
  puffs.forEach(([px, py, pr]) => { ctx.moveTo(px + pr, py); ctx.arc(px, py, pr, 0, Math.PI * 2); });
  ctx.fill();
  ctx.fillRect(-44, 0, 88, 18);
  ctx.restore();
}

// ---- Bricks ----
function drawBrick(ctx, b, t) {
  const { x, y, w, h } = b;
  const col = RB[b.color];
  if (b.kind === 'heart') {
    const cx = x + w / 2, cy = y + h / 2;
    const s = Math.min(w, h) * 1.15;
    ctx.lineJoin = 'round';
    ctx.lineWidth = 5;
    ctx.strokeStyle = INK;
    heartPath(ctx, cx, cy, s); ctx.stroke();
    ctx.fillStyle = col.fill; heartPath(ctx, cx, cy, s); ctx.fill();
    // highlight
    ctx.fillStyle = col.light; ctx.globalAlpha = 0.6;
    ctx.beginPath(); ctx.ellipse(cx - s * 0.16, cy - s * 0.12, s * 0.12, s * 0.08, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    drawFace(ctx, cx, cy + 1, Math.min(w, h) / 26, col.light);
    return;
  }
  if (b.kind === 'sprite') {
    const cx = x + w / 2, cy = y + h / 2;
    const r = Math.min(w, h) * 0.46;
    // little star points poking out
    ctx.fillStyle = col.fill;
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineJoin = 'round';
    starPath(ctx, cx, cy, r * 1.32, r * 0.92, 8, t * 0.6);
    ctx.fill(); ctx.stroke();
    // body
    ctx.fillStyle = '#fff7fb';
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2); ctx.stroke();
    drawFace(ctx, cx, cy, Math.min(w, h) / 24, col.fill);
    return;
  }
  // normal / strong rounded brick
  ctx.lineJoin = 'round';
  ctx.lineWidth = 5;
  ctx.strokeStyle = INK;
  roundRect(ctx, x + 2.5, y + 2.5, w - 5, h - 5, 12); ctx.stroke();
  ctx.fillStyle = col.fill;
  roundRect(ctx, x + 2.5, y + 2.5, w - 5, h - 5, 12); ctx.fill();
  // glossy top highlight
  ctx.fillStyle = col.light; ctx.globalAlpha = 0.85;
  roundRect(ctx, x + 8, y + 7, w - 16, (h - 5) * 0.34, 8); ctx.fill();
  ctx.globalAlpha = 1;
  if (b.kind === 'strong' && b.hits >= 2) {
    // sparkle stripes to signal "needs two hits"
    ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = 0.7; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(x + w / 2 + i * 14 - 6, y + h * 0.62);
      ctx.lineTo(x + w / 2 + i * 14 + 6, y + h * 0.4);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  // crack overlay when a strong brick is damaged
  if (b.hits === 1 && b.maxHits >= 2) {
    ctx.strokeStyle = INK; ctx.globalAlpha = 0.35; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.3, y + 6); ctx.lineTo(x + w * 0.45, y + h * 0.5);
    ctx.lineTo(x + w * 0.35, y + h - 6);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

// ---- Paddle: a smiling rainbow ----
function drawPaddle(ctx, p, t) {
  const { x, y, w, h } = p;
  ctx.save();
  // shadow
  ctx.fillStyle = 'rgba(52,33,90,0.18)';
  roundRect(ctx, x + 4, y + 8, w, h, h / 2); ctx.fill();

  // outline
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK; ctx.lineWidth = 5;
  roundRect(ctx, x, y, w, h, h / 2); ctx.stroke();

  // rainbow bands clipped to the paddle shape
  ctx.save();
  roundRect(ctx, x, y, w, h, h / 2); ctx.clip();
  const bands = ['#ff5d6c', '#ff9f43', '#ffd93b', '#5fd97a', '#4db5ff', '#a87cff', '#ff7fc4'];
  const bh = h / bands.length;
  bands.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x, y + i * bh, w, bh + 1); });
  // glossy sheen
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(x, y, w, h * 0.3);
  ctx.restore();

  // re-stroke outline on top
  ctx.strokeStyle = INK; ctx.lineWidth = 5;
  roundRect(ctx, x, y, w, h, h / 2); ctx.stroke();

  // happy face in the middle
  const cx = x + w / 2, cy = y + h / 2;
  const sc = h / 18;
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.arc(cx - 7 * sc, cy - 1 * sc, 2.4 * sc, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 7 * sc, cy - 1 * sc, 2.4 * sc, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(cx - 6.2 * sc, cy - 1.8 * sc, 0.9 * sc, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 7.8 * sc, cy - 1.8 * sc, 0.9 * sc, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 2.4 * sc; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(cx, cy + 0.5 * sc, 5 * sc, 0.12 * Math.PI, 0.88 * Math.PI); ctx.stroke();
  ctx.restore();
}

// ---- Ball: glowing star sprite with a face ----
function drawBall(ctx, ball, t) {
  const { x, y, r } = ball;
  ctx.save();
  // glow
  const glow = ctx.createRadialGradient(x, y, 1, x, y, r * 2.4);
  glow.addColorStop(0, 'rgba(255,248,180,0.9)');
  glow.addColorStop(1, 'rgba(255,248,180,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(x, y, r * 2.4, 0, Math.PI * 2); ctx.fill();

  const rot = t * 1.5;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK; ctx.lineWidth = 4;
  starPath(ctx, x, y, r * 1.5, r * 0.66, 5, rot); ctx.stroke();
  ctx.fillStyle = '#ffd93b';
  starPath(ctx, x, y, r * 1.5, r * 0.66, 5, rot); ctx.fill();
  // inner highlight
  ctx.fillStyle = '#fff3a8';
  starPath(ctx, x, y, r * 0.9, r * 0.4, 5, rot); ctx.fill();
  // face
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.arc(x - r * 0.32, y - r * 0.05, r * 0.16, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 0.32, y - r * 0.05, r * 0.16, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y + r * 0.1, r * 0.34, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  ctx.restore();
}

// ---- Falling power-up capsule ----
const PU_ICON = { multi: '◈', wide: '↔', slow: '🐌', life: '♥', sticky: '✦' };
function drawPowerup(ctx, pu, t) {
  const { x, y } = pu;
  const col = RB[pu.color];
  const r = 22;
  ctx.save();
  ctx.translate(x, y);
  const bob = Math.sin(t * 4 + pu.ph) * 2;
  ctx.translate(0, bob);
  // capsule
  ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = INK;
  if (pu.type === 'life') {
    heartPath(ctx, 0, 0, r * 2.0); ctx.stroke();
    ctx.fillStyle = col.fill; heartPath(ctx, 0, 0, r * 2.0); ctx.fill();
  } else {
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = col.fill; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = col.light; ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.3, r * 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  // label
  ctx.fillStyle = '#fff';
  ctx.font = '700 20px Fredoka, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 4; ctx.strokeStyle = INK;
  const lbl = pu.label;
  ctx.strokeText(lbl, 0, 2);
  ctx.fillText(lbl, 0, 2);
  ctx.restore();
}

// ---- Particles ----
function drawParticle(ctx, p) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  if (p.shape === 'star') {
    ctx.fillStyle = p.color;
    starPath(ctx, 0, 0, p.size, p.size * 0.45, 5, 0);
    ctx.fill();
  } else {
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

window.roundRect = roundRect;
window.starPath = starPath;
window.heartPath = heartPath;
window.drawBackground = drawBackground;
window.drawBrick = drawBrick;
window.drawPaddle = drawPaddle;
window.drawBall = drawBall;
window.drawPowerup = drawPowerup;
window.drawParticle = drawParticle;
window.PU_ICON = PU_ICON;
