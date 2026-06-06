// ── game.js ────────────────────────────────────────────────────
// Core game engine: state, loop, spawning, collision, HUD.
// Depends on: draw.js, starfield.js, api.js

// ── Canvas setup ───────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
let W, H;

function setupCanvas() {
  W = canvas.width  = CFG.game.canvas.width;
  H = canvas.height = CFG.game.canvas.height;
}

// ── Game state variables ────────────────────────────────────────
let CFG = null;           // loaded from /api/config
let score, lives, level, combo, starsCaught;
let drops, particles, floaters;
let bucketX, targetX;
let keys        = {};
let frameCount  = 0;
let gameRunning = false;
let currentLevel = null;
let bestScore   = parseInt(localStorage.getItem('starfall_best') || '0');

const BUCKET_Y = () => H - 52;

// ── HUD updaters ────────────────────────────────────────────────
function setScore(v)  { score = v; document.getElementById('scoreEl').textContent = score; }
function setBest()    { document.getElementById('bestEl').textContent = bestScore; }

function setLives(v) {
  lives = v;
  const icons = ['♥ ♥ ♥','♥ ♥ ♡','♥ ♡ ♡','♡ ♡ ♡'];
  document.getElementById('livesEl').textContent = icons[3 - Math.max(0, lives)];
}

function setLevel(lv) {
  level = lv;
  document.getElementById('levelEl').textContent = level;
  const lvls = [...CFG.levels].reverse();
  currentLevel = lvls.find(l => score >= l.score_threshold) || CFG.levels[0];
  document.getElementById('levelNameEl').textContent = currentLevel.label;
}

function setCombo(c) {
  combo = c;
  const el = document.getElementById('comboEl');
  if (combo >= CFG.game.combo_threshold) {
    el.textContent = `⚡ ${combo}× COMBO  (×${getMultiplier(combo)})`;
  } else {
    el.textContent = '';
  }
}

function getMultiplier(c) {
  const mults = [...CFG.scoring.combo_multipliers].reverse();
  return (mults.find(m => c >= m.min_combo) || { multiplier: 1 }).multiplier;
}

function flashLevel() {
  const el = document.getElementById('levelFlash');
  el.textContent = `▲ ${currentLevel.label} — LEVEL ${level}`;
  el.style.opacity = '1';
  setTimeout(() => el.style.opacity = '0', 1500);
}

// ── Spawn a falling drop ────────────────────────────────────────
function spawnDrop() {
  // Weighted random pick from config drop_types
  const weights = CFG.drop_types.map(d => {
    if (d.special === 'bad')  return d.weight + (level - 1) * 2;
    if (d.special === 'rare') return d.weight + (level - 1);
    return d.weight;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total, typeIdx = 0;
  for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) { typeIdx = i; break; } }

  const t     = CFG.drop_types[typeIdx];
  const speed = currentLevel.base_speed + Math.random() * 1.5;
  drops.push({
    x: 28 + Math.random() * (W - 56),
    y: -20, vy: speed,
    ...t,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.025 + Math.random() * 0.02,
    trail: [], pulse: 0
  });
}

// ── Particle burst on catch ─────────────────────────────────────
function burst(x, y, color, count = 20) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const spd   = 1.8 + Math.random() * 4;
    particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - 2.5,
      life: 1, decay: 0.022 + Math.random() * 0.02,
      r: 2 + Math.random() * 3, color
    });
  }
}

function spawnFloater(x, y, text, color) {
  floaters.push({ x, y, text, color, life: 1, vy: -1.4 });
}

// ── Main game loop ──────────────────────────────────────────────
function loop() {
  if (!gameRunning) return;
  frameCount++;

  drawGameBG();

  const BY = BUCKET_Y();
  const BW = CFG.bucket.width;

  // Keyboard / mouse bucket movement
  if (keys['ArrowLeft']  || keys['a'] || keys['A']) targetX -= CFG.bucket.speed;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) targetX += CFG.bucket.speed;
  targetX = Math.max(BW/2, Math.min(W - BW/2, targetX));
  bucketX += (targetX - bucketX) * CFG.bucket.smoothing;

  // Spawn based on current level's spawn_rate
  if (frameCount % currentLevel.spawn_rate === 0) spawnDrop();

  // Level up check
  const newLevel = CFG.levels.filter(l => score >= l.score_threshold).length;
  if (newLevel !== level) {
    const old = level;
    setLevel(newLevel);
    if (newLevel > old) flashLevel();
  }

  // Update + collision check each drop
  drops = drops.filter(d => {
    d.trail.push({ x: d.x, y: d.y });
    if (d.trail.length > 8) d.trail.shift();
    d.x += Math.sin(d.wobble) * 0.4;
    d.wobble += d.wobbleSpeed;
    d.y += d.vy;

    const hitLeft  = bucketX - BW / 2;
    const hitRight = bucketX + BW / 2;

    if (d.y + d.radius >= BY && d.y - d.radius <= BY + CFG.bucket.height
        && d.x >= hitLeft && d.x <= hitRight) {
      if (d.special === 'bad') {
        lives--;
        setLives(lives);
        setCombo(0);
        burst(d.x, BY, d.color, 12);
        spawnFloater(d.x, BY - 22, '✕ VOID!', d.color);
        if (lives <= 0) { endGame(); return false; }
      } else {
        starsCaught++;
        const c   = combo + 1;
        const m   = getMultiplier(c);
        const pts = d.points * m;
        setScore(score + pts);
        setCombo(c);
        burst(d.x, BY, d.color);
        spawnFloater(d.x, BY - 22, (m > 1 ? `×${m} ` : '') + `+${pts}`, d.color);
      }
      return false;
    }

    // Missed — fell below canvas
    if (d.y - d.radius > H) {
      if (d.special !== 'bad') {
        lives--;
        setLives(lives);
        setCombo(0);
        if (lives <= 0) { endGame(); return false; }
      }
      return false;
    }
    return true;
  });

  // Update particles
  particles = particles.filter(p => {
    p.x += p.vx; p.y += p.vy; p.vy += 0.14;
    p.life -= p.decay;
    return p.life > 0;
  });

  // Update floaters
  floaters = floaters.filter(f => {
    f.y += f.vy; f.life -= 0.02;
    return f.life > 0;
  });

  // Render everything
  drawParticles();
  drops.forEach(drawDrop);
  drawBucket(bucketX, BY);
  drawFloaters();

  requestAnimationFrame(loop);
}

// ── Start / End ─────────────────────────────────────────────────
function startGame() {
  setScore(0); setLives(3); setLevel(1); setCombo(0);
  starsCaught = 0; frameCount = 0;
  drops = []; particles = []; floaters = [];
  bucketX = W / 2; targetX = W / 2;
  document.getElementById('startScreen').classList.add('hidden');
  document.getElementById('gameOverScreen').classList.add('hidden');
  document.getElementById('comboEl').textContent = '';
  gameRunning = true;
  requestAnimationFrame(loop);
}

function endGame() {
  gameRunning = false;
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('starfall_best', bestScore);
    setBest();
  }
  document.getElementById('finalScoreEl').innerHTML = `FINAL SCORE<strong>${score}</strong>`;
  document.getElementById('gameOverScreen').classList.remove('hidden');
  document.getElementById('nameInput').value = '';
  const wrap = document.getElementById('canvasWrap');
  wrap.classList.add('shake');
  setTimeout(() => wrap.classList.remove('shake'), 350);
  fetchLeaderboard();
}

// ── Controls ────────────────────────────────────────────────────
window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (['ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  targetX = e.clientX - rect.left;
});

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  targetX = e.touches[0].clientX - rect.left;
}, { passive: false });

// ── Button wiring ───────────────────────────────────────────────
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);
document.getElementById('saveBtn').addEventListener('click', saveScore);
