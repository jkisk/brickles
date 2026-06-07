/* ============================================================
   Brickles — game loop, physics, state
   ============================================================ */
(() => {
  const W = 1080, H = 1320;
  const HUD = 116;                 // top HUD height
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = W; canvas.height = H;

  // ---------- scaling ----------
  const stage = document.getElementById('stage');
  function resize() {
    const s = Math.min(window.innerWidth / W, window.innerHeight / H);
    stage.style.transform = `translate(-50%,-50%) scale(${s})`;
  }
  window.addEventListener('resize', resize); resize();

  // ---------- decor ----------
  const clouds = [
    { x: W * 0.2, y: H * 0.32, s: 1.1, vx: 8 },
    { x: W * 0.75, y: H * 0.22, s: 0.85, vx: 6 },
    { x: W * 0.55, y: H * 0.5, s: 1.3, vx: 5 },
    { x: W * 0.1, y: H * 0.62, s: 0.7, vx: 7 },
    { x: W * 0.9, y: H * 0.55, s: 0.95, vx: 6.5 },
  ];
  const twinkles = Array.from({ length: 26 }, () => ({
    x: Math.random() * W, y: Math.random() * H * 0.8,
    r: 4 + Math.random() * 7, sp: 1 + Math.random() * 3, ph: Math.random() * 7,
  }));

  // ---------- power-up defs ----------
  const POWERUPS = [
    { type: 'multi',  label: '+', color: 'blue',   weight: 3 },
    { type: 'wide',   label: 'W', color: 'green',  weight: 3 },
    { type: 'slow',   label: 'S', color: 'teal',   weight: 2 },
    { type: 'sticky', label: '✦', color: 'purple', weight: 2 },
    { type: 'life',   label: '',  color: 'pink',   weight: 2 },
  ];
  function randomPU() {
    const total = POWERUPS.reduce((a, p) => a + p.weight, 0);
    let r = Math.random() * total;
    for (const p of POWERUPS) { if ((r -= p.weight) <= 0) return p; }
    return POWERUPS[0];
  }

  // ---------- game state ----------
  let state = 'title';
  let levelIdx = 0;
  let score = 0;
  let lives = 5;
  let highScore = +(localStorage.getItem('brickles_hi') || 0);
  let combo = 0, comboTimer = 0, bestCombo = 0;
  let bricks = [], balls = [], powerups = [], particles = [], floaters = [];
  let paddle = { x: W / 2 - 110, y: H - 140, w: 220, h: 30, baseW: 220 };
  let effects = { wide: 0, slow: 0, sticky: 0 };
  let speedMul = 1, speedMulTarget = 1;
  let baseSpeed = 520;
  let shake = 0;
  let mouseX = W / 2;

  // ---------- build level ----------
  function buildLevel(i) {
    const lvl = LEVELS[i];
    bricks = [];
    const cols = Math.max(...lvl.grid.map(r => r.length));
    const margin = 70, gap = 10;
    const top = HUD + 40;
    const bw = (W - margin * 2 - gap * (cols - 1)) / cols;
    const bh = 44;
    lvl.grid.forEach((row, ry) => {
      for (let cx = 0; cx < row.length; cx++) {
        const def = brickFromChar(row[cx], ry);
        if (!def) continue;
        bricks.push({
          x: margin + cx * (bw + gap),
          y: top + ry * (bh + gap),
          w: bw, h: bh,
          color: def.color, hits: def.hits, maxHits: def.hits,
          kind: def.kind, drop: !!def.drop,
        });
      }
    });
    baseSpeed = 510 + i * 35;
    paddle.w = paddle.baseW;
    effects = { wide: 0, slow: 0, sticky: 0 };
    speedMul = speedMulTarget = 1;
    powerups = []; particles = [];
    resetBall();
  }

  function resetBall() {
    balls = [{
      x: paddle.x + paddle.w / 2, y: paddle.y - 22,
      r: 16, vx: 0, vy: 0, stuck: true,
    }];
    combo = 0;
  }

  function launchBall() {
    balls.forEach(b => {
      if (b.stuck) {
        b.stuck = false;
        const ang = (-Math.PI / 2) + (Math.random() * 0.5 - 0.25);
        b.vx = Math.cos(ang) * baseSpeed;
        b.vy = Math.sin(ang) * baseSpeed;
      }
    });
    Sound.launch();
  }

  // ---------- particles / floaters ----------
  function burst(x, y, color) {
    const fill = RB[color].fill, light = RB[color].light;
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 80 + Math.random() * 260;
      particles.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
        size: 5 + Math.random() * 9, color: Math.random() < 0.5 ? fill : light,
        shape: Math.random() < 0.55 ? 'star' : 'dot',
        rot: Math.random() * 7, vr: (Math.random() - 0.5) * 12,
        life: 0.6 + Math.random() * 0.4, maxLife: 1, grav: 520,
      });
    }
  }
  function floatText(x, y, text, color) {
    floaters.push({ x, y, text, color, life: 1, vy: -60 });
  }

  // ---------- power-up effects ----------
  function spawnPowerup(x, y) {
    const def = randomPU();
    powerups.push({ ...def, x, y, vy: 165, ph: Math.random() * 7 });
  }
  function applyPowerup(pu) {
    Sound.powerup();
    if (pu.type === 'multi') {
      const live = balls.filter(b => !b.stuck);
      const src = live.length ? live : balls;
      const add = [];
      src.forEach(b => {
        for (let k = 0; k < 2; k++) {
          const ang = Math.atan2(b.vy || -1, b.vx || 0) + (Math.random() * 1.2 - 0.6);
          const sp = baseSpeed;
          add.push({ x: b.x, y: b.y, r: 16, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, stuck: false });
        }
      });
      balls.push(...add.slice(0, 6));
      floatText(pu.x, pu.y, 'MULTI-BALL!', RB.blue.shade);
    } else if (pu.type === 'wide') {
      effects.wide = 13; paddle.w = paddle.baseW * 1.6;
      floatText(pu.x, pu.y, 'WIDE!', RB.green.shade);
    } else if (pu.type === 'slow') {
      effects.slow = 11; speedMulTarget = 0.6;
      floatText(pu.x, pu.y, 'SLOW-MO', RB.teal.shade);
    } else if (pu.type === 'sticky') {
      effects.sticky = 13;
      floatText(pu.x, pu.y, 'STICKY!', RB.purple.shade);
    } else if (pu.type === 'life') {
      lives = Math.min(lives + 1, 9); Sound.life();
      floatText(pu.x, pu.y, '+1 LIFE', RB.pink.shade);
    }
  }

  // ---------- collisions ----------
  function ballHitsRect(b, r) {
    return b.x + b.r > r.x && b.x - b.r < r.x + r.w &&
           b.y + b.r > r.y && b.y - b.r < r.y + r.h;
  }

  function breakBrick(idx, ball) {
    const br = bricks[idx];
    br.hits--;
    if (br.hits > 0) { Sound.strong(); return false; }
    // destroyed
    combo++; comboTimer = 1.6; bestCombo = Math.max(bestCombo, combo);
    const gain = Math.round(60 * (1 + (combo - 1) * 0.4));
    score += gain;
    Sound.brick(combo - 1);
    burst(br.x + br.w / 2, br.y + br.h / 2, br.color);
    shake = Math.min(shake + 3, 9);
    if (combo >= 3) floatText(br.x + br.w / 2, br.y, '×' + combo, RB[br.color].shade);
    if (br.drop || Math.random() < 0.06) spawnPowerup(br.x + br.w / 2, br.y + br.h / 2);
    bricks.splice(idx, 1);
    return true;
  }

  // ---------- update ----------
  function update(dt) {
    // clouds drift
    clouds.forEach(c => { c.x += c.vx * dt; if (c.x > W + 60) c.x = -60; });

    // effect timers
    ['wide', 'slow', 'sticky'].forEach(k => {
      if (effects[k] > 0) {
        effects[k] -= dt;
        if (effects[k] <= 0) {
          effects[k] = 0;
          if (k === 'wide') paddle.w = paddle.baseW;
          if (k === 'slow') speedMulTarget = 1;
        }
      }
    });
    speedMul += (speedMulTarget - speedMul) * Math.min(1, dt * 6);

    // combo decay
    if (comboTimer > 0) { comboTimer -= dt; if (comboTimer <= 0) combo = 0; }

    // paddle follows mouse
    paddle.x += ((mouseX - paddle.w / 2) - paddle.x) * Math.min(1, dt * 18);
    paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));

    if (state !== 'play' && state !== 'serve') return;

    // balls
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      if (b.stuck) {
        b.x = paddle.x + paddle.w / 2;
        b.y = paddle.y - b.r - 6;
        continue;
      }
      b.x += b.vx * dt * speedMul;
      b.y += b.vy * dt * speedMul;

      // walls
      if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx); Sound.wall(); }
      if (b.x + b.r > W) { b.x = W - b.r; b.vx = -Math.abs(b.vx); Sound.wall(); }
      if (b.y - b.r < HUD) { b.y = HUD + b.r; b.vy = Math.abs(b.vy); Sound.wall(); }

      // paddle
      if (b.vy > 0 && b.y + b.r > paddle.y && b.y - b.r < paddle.y + paddle.h &&
          b.x > paddle.x - 6 && b.x < paddle.x + paddle.w + 6) {
        if (effects.sticky > 0) {
          b.stuck = true; b.relX = b.x - paddle.x; combo = 0; Sound.catch();
        } else {
          const hit = (b.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
          const ang = (-Math.PI / 2) + hit * (Math.PI / 3);
          b.vx = Math.cos(ang) * baseSpeed;
          b.vy = Math.sin(ang) * baseSpeed;
          b.y = paddle.y - b.r - 1;
          combo = 0;
          Sound.bounce();
        }
      }

      // bricks — one reflect per frame
      for (let j = bricks.length - 1; j >= 0; j--) {
        if (!ballHitsRect(b, bricks[j])) continue;
        const br = bricks[j];
        const oL = (b.x + b.r) - br.x;
        const oR = (br.x + br.w) - (b.x - b.r);
        const oT = (b.y + b.r) - br.y;
        const oB = (br.y + br.h) - (b.y - b.r);
        const minX = Math.min(oL, oR), minY = Math.min(oT, oB);
        if (minX < minY) { b.vx = -b.vx; b.x += oL < oR ? -minX : minX; }
        else { b.vy = -b.vy; b.y += oT < oB ? -minY : minY; }
        breakBrick(j, b);
        break;
      }

      // fell off bottom
      if (b.y - b.r > H) balls.splice(i, 1);
    }

    // lost all balls
    if (balls.length === 0) {
      lives--;
      Sound.life();
      if (lives <= 0) { endGame(false); return; }
      paddle.w = paddle.baseW;
      effects = { wide: 0, slow: 0, sticky: 0 };
      speedMul = speedMulTarget = 1;
      powerups = [];
      resetBall();
      state = 'serve';
    }

    // power-ups fall
    for (let i = powerups.length - 1; i >= 0; i--) {
      const p = powerups[i];
      p.y += p.vy * dt;
      if (p.y > paddle.y - 4 && p.y < paddle.y + paddle.h + 24 &&
          p.x > paddle.x - 10 && p.x < paddle.x + paddle.w + 10) {
        applyPowerup(p); powerups.splice(i, 1); continue;
      }
      if (p.y > H + 30) powerups.splice(i, 1);
    }

    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += p.grav * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      p.life -= dt / 1.0;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.y += f.vy * dt; f.vy *= 0.94; f.life -= dt / 1.1;
      if (f.life <= 0) floaters.splice(i, 1);
    }

    if (shake > 0) shake = Math.max(0, shake - dt * 30);

    // level cleared
    if (bricks.length === 0) levelClear();
  }

  // ---------- transitions ----------
  function levelClear() {
    score += 500;
    Sound.levelClear();
    if (levelIdx >= LEVELS.length - 1) { endGame(true); return; }
    state = 'levelclear';
    saveHi();
    document.getElementById('lc-bonus').textContent = 'Level bonus  +500';
    document.getElementById('lc-name').textContent = 'You cleared ' + LEVELS[levelIdx].name + '!';
    show('overlay-levelclear');
  }
  function nextLevel() {
    levelIdx++;
    buildLevel(levelIdx);
    state = 'serve';
    hideAll();
    updateHUDLevel();
  }
  function endGame(won) {
    state = won ? 'win' : 'gameover';
    saveHi();
    won ? Sound.win() : Sound.life();
    if (won) {
      document.getElementById('win-score').textContent = score.toLocaleString();
      document.getElementById('win-hi').textContent = 'Best combo ×' + bestCombo + '  •  High score ' + highScore.toLocaleString();
      show('overlay-win');
    } else {
      document.getElementById('go-score').textContent = score.toLocaleString();
      document.getElementById('go-hi').textContent = 'High score ' + highScore.toLocaleString();
      show('overlay-gameover');
    }
  }
  function saveHi() {
    if (score > highScore) { highScore = score; localStorage.setItem('brickles_hi', highScore); }
  }

  function startGame() {
    levelIdx = 0; score = 0; lives = 5; bestCombo = 0; combo = 0;
    buildLevel(0);
    state = 'serve';
    hideAll();
    updateHUDLevel();
    Sound.init();
  }

  // ---------- HUD (canvas) ----------
  function updateHUDLevel() { /* level name is drawn on the canvas HUD */ }
  function drawHUD() {
    // bar
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    roundRect(ctx, 14, 12, W - 28, HUD - 22, 22); ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(168,124,255,0.5)';
    roundRect(ctx, 14, 12, W - 28, HUD - 22, 22); ctx.stroke();

    ctx.textBaseline = 'middle';
    // score
    ctx.textAlign = 'left';
    ctx.fillStyle = INK;
    ctx.font = '700 30px Fredoka, sans-serif';
    ctx.fillText('SCORE', 44, 44);
    ctx.font = '600 42px Fredoka, sans-serif';
    ctx.fillText(score.toLocaleString(), 44, 80);

    // hearts (lives)
    const hx = W - 60;
    ctx.textAlign = 'right';
    ctx.font = '700 24px Fredoka, sans-serif';
    ctx.fillStyle = INK;
    ctx.fillText('LIVES', hx, 40);
    for (let i = 0; i < lives; i++) {
      const x = W - 50 - i * 42, y = 80;
      ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
      heartPath(ctx, x, y, 34); ctx.stroke();
      ctx.fillStyle = RB.pink.fill; heartPath(ctx, x, y, 34); ctx.fill();
    }

    // level name center
    ctx.textAlign = 'center';
    ctx.fillStyle = RB.purple.shade;
    ctx.font = '600 28px Fredoka, sans-serif';
    ctx.fillText(LEVELS[levelIdx].name, W / 2, 38);
    // active effects + combo
    let tag = [];
    if (effects.wide > 0) tag.push('WIDE');
    if (effects.slow > 0) tag.push('SLOW');
    if (effects.sticky > 0) tag.push('STICKY');
    ctx.font = '600 22px Fredoka, sans-serif';
    if (combo >= 2) {
      ctx.fillStyle = RB.red.fill;
      ctx.fillText('COMBO ×' + combo, W / 2, 74);
    } else if (tag.length) {
      ctx.fillStyle = RB.teal.shade;
      ctx.fillText(tag.join('  ·  '), W / 2, 74);
    }
  }

  // ---------- render ----------
  let t = 0;
  function render() {
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    drawBackground(ctx, W, H, t, clouds, twinkles);

    bricks.forEach(b => drawBrick(ctx, b, t));
    powerups.forEach(p => drawPowerup(ctx, p, t));
    particles.forEach(p => drawParticle(ctx, p));

    // floaters
    floaters.forEach(f => {
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.font = '700 30px Fredoka, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 5; ctx.strokeStyle = '#fff';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    });

    if (state !== 'title') {
      drawPaddle(ctx, paddle, t);
      balls.forEach(b => drawBall(ctx, b, t));
    }

    drawHUD();

    // serve hint
    if (state === 'serve') {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '600 30px Fredoka, sans-serif';
      ctx.globalAlpha = 0.6 + Math.sin(t * 4) * 0.3;
      ctx.fillStyle = INK;
      ctx.fillText('click  or  press  SPACE  to  launch  ✦', W / 2, paddle.y - 70);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  // ---------- main loop ----------
  let last = performance.now();
  function loop(now) {
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.05) dt = 0.05;
    t += dt;
    if (state === 'play' || state === 'serve' || state === 'title') update(dt);
    render();
    requestAnimationFrame(loop);
  }

  // ---------- overlays ----------
  function show(id) { hideAll(); document.getElementById(id).classList.add('show'); }
  function hideAll() { document.querySelectorAll('.overlay').forEach(o => o.classList.remove('show')); }

  // ---------- input ----------
  function toStageX(clientX) {
    const rect = canvas.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * W;
  }
  window.addEventListener('mousemove', e => { mouseX = Math.max(0, Math.min(W, toStageX(e.clientX))); });
  window.addEventListener('touchmove', e => {
    if (e.touches[0]) { mouseX = Math.max(0, Math.min(W, toStageX(e.touches[0].clientX))); e.preventDefault(); }
  }, { passive: false });

  function primaryAction() {
    Sound.init();
    if (state === 'serve') { launchBall(); state = 'play'; }
    else if (state === 'play') {
      // relaunch any stuck (sticky) balls
      if (balls.some(b => b.stuck)) {
        balls.forEach(b => { if (b.stuck) { b.stuck = false;
          const ang = (-Math.PI / 2) + (Math.random() * 0.4 - 0.2);
          b.vx = Math.cos(ang) * baseSpeed; b.vy = Math.sin(ang) * baseSpeed; } });
        Sound.launch();
      }
    }
  }
  canvas.addEventListener('mousedown', primaryAction);
  canvas.addEventListener('touchstart', e => { primaryAction(); e.preventDefault(); }, { passive: false });

  window.addEventListener('keydown', e => {
    if (e.code === 'Space') { e.preventDefault(); if (state === 'play' || state === 'serve') primaryAction(); }
    if (e.code === 'KeyP') togglePause();
    if (e.code === 'KeyM') toggleMute();
    if (e.code === 'ArrowLeft') mouseX = Math.max(0, mouseX - 60);
    if (e.code === 'ArrowRight') mouseX = Math.min(W, mouseX + 60);
  });

  function togglePause() {
    if (state === 'play' || state === 'serve') { state = 'paused'; show('overlay-pause'); }
    else if (state === 'paused') { state = balls.some(b => b.stuck) ? 'serve' : 'play'; hideAll(); }
  }
  function toggleMute() {
    const m = Sound.toggle();
    document.getElementById('btn-mute').textContent = m ? '🔇' : '🔊';
  }

  // ---------- buttons ----------
  document.getElementById('btn-start').addEventListener('click', startGame);
  document.getElementById('btn-next').addEventListener('click', nextLevel);
  document.getElementById('btn-retry').addEventListener('click', startGame);
  document.getElementById('btn-again').addEventListener('click', startGame);
  document.getElementById('btn-resume').addEventListener('click', togglePause);
  document.getElementById('btn-pause').addEventListener('click', togglePause);
  document.getElementById('btn-mute').addEventListener('click', toggleMute);

  // set high score text on title
  document.getElementById('title-hi').textContent = highScore > 0 ? 'High score  ' + highScore.toLocaleString() : 'No high score yet — go make one!';

  // ---------- go ----------
  show('overlay-title');
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => {});
  requestAnimationFrame(loop);
})();
