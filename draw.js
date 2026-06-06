// ── draw.js ────────────────────────────────────────────────────
// All canvas drawing functions for the game.
// Depends on: game.js (for canvas, ctx, CFG, particles, floaters)

// Clear canvas + draw vignette
function drawGameBG() {
  ctx.clearRect(0, 0, W, H);
  const vig = ctx.createRadialGradient(W/2,H/2,W*0.15, W/2,H/2,W*0.72);
  vig.addColorStop(0, 'transparent');
  vig.addColorStop(1, 'rgba(2,4,8,0.55)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}

// Gold bucket — trapezoid shape with handle
function drawBucket(bx, by) {
  const BW   = CFG.bucket.width;
  const BH   = CFG.bucket.height;
  const left = bx - BW / 2;

  ctx.save();
  ctx.shadowColor = 'rgba(255,215,0,0.35)';
  ctx.shadowBlur  = 22;

  // Trapezoid body
  ctx.beginPath();
  ctx.moveTo(left + 8,      by);
  ctx.lineTo(left + BW - 8, by);
  ctx.lineTo(left + BW + 4, by + BH);
  ctx.lineTo(left - 4,      by + BH);
  ctx.closePath();

  const fill = ctx.createLinearGradient(left, by, left, by + BH);
  fill.addColorStop(0, 'rgba(50,35,0,0.92)');
  fill.addColorStop(1, 'rgba(20,14,0,0.92)');
  ctx.fillStyle   = fill;
  ctx.fill();
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth   = 1.8;
  ctx.stroke();

  // Top rim
  ctx.beginPath();
  ctx.moveTo(left + 4,      by);
  ctx.lineTo(left + BW - 4, by);
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth   = 3;
  ctx.stroke();

  // Inner shine
  ctx.beginPath();
  ctx.moveTo(left + 16, by + 7);
  ctx.lineTo(left + 28, by + 7);
  ctx.strokeStyle = 'rgba(255,215,0,0.3)';
  ctx.lineWidth   = 1.5;
  ctx.stroke();

  // Handle arc
  ctx.beginPath();
  ctx.arc(bx, by - 9, 11, Math.PI, 0);
  ctx.strokeStyle = 'rgba(255,215,0,0.45)';
  ctx.lineWidth   = 2;
  ctx.stroke();

  ctx.restore();
}

// Single falling drop (star/moon/comet/blackhole)
function drawDrop(d) {
  d.pulse += 0.07;
  ctx.save();
  ctx.shadowColor = d.glow;
  ctx.shadowBlur  = 18 + 6 * Math.sin(d.pulse);

  // Fading trail
  d.trail.forEach((pt, i) => {
    const t = i / d.trail.length;
    ctx.globalAlpha = t * 0.28;
    ctx.fillStyle   = d.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, d.radius * t, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Radial gradient sphere
  const gr = ctx.createRadialGradient(
    d.x - d.radius * 0.35, d.y - d.radius * 0.35, 1,
    d.x, d.y, d.radius
  );
  gr.addColorStop(0,   '#ffffff');
  gr.addColorStop(0.35, d.color);
  gr.addColorStop(1,   d.color + '66');
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
  ctx.fillStyle = gr;
  ctx.fill();

  // Symbol label
  ctx.shadowBlur   = 0;
  ctx.fillStyle    = '#fff9';
  ctx.font         = `bold ${Math.round(d.radius * 1.1)}px Arial`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(d.label, d.x, d.y + 1);

  ctx.restore();
}

// Burst particles after catching
function drawParticles() {
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle   = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur  = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

// Floating "+10", "×2 +20" text above bucket
function drawFloaters() {
  floaters.forEach(f => {
    ctx.save();
    ctx.globalAlpha  = f.life;
    ctx.fillStyle    = f.color;
    ctx.shadowColor  = f.color;
    ctx.shadowBlur   = 12;
    ctx.font         = 'bold 15px Orbitron, monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(f.text, f.x, f.y);
    ctx.restore();
  });
}
