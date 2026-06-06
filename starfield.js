// ── starfield.js ──────────────────────────────────────────────
// Handles the animated deep-space background canvas (bgCanvas).
// Completely independent of game logic.

const bgCanvas = document.getElementById('bgCanvas');
const bgCtx    = bgCanvas.getContext('2d');
let bgStars    = [];

// Resize bg canvas to fill window
function resizeBG() {
  bgCanvas.width  = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeBG);
resizeBG();

// Build star objects (3 depth layers for parallax feel)
function buildBgStars(count) {
  bgStars = [];
  for (let i = 0; i < count; i++) {
    const layer = Math.floor(Math.random() * 3); // 0=far, 2=near
    bgStars.push({
      x:           Math.random() * bgCanvas.width,
      y:           Math.random() * bgCanvas.height,
      r:           0.4 + layer * 0.5 + Math.random() * 0.8,
      alpha:       0.2 + Math.random() * 0.7,
      twinkle:     Math.random() * Math.PI * 2,
      speed:       0.008 + Math.random() * 0.015,
      layer
    });
  }
}

// Draw one frame of the starfield
function drawBgStars() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

  // Deep space radial gradient
  const grad = bgCtx.createRadialGradient(
    bgCanvas.width * 0.5, bgCanvas.height * 0.4, 0,
    bgCanvas.width * 0.5, bgCanvas.height * 0.4, bgCanvas.width * 0.7
  );
  grad.addColorStop(0,   '#070d1f');
  grad.addColorStop(0.5, '#040a14');
  grad.addColorStop(1,   '#020408');
  bgCtx.fillStyle = grad;
  bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

  // Draw each star with twinkling
  bgStars.forEach(s => {
    s.twinkle += s.speed;
    const brightness = s.alpha * (0.6 + 0.4 * Math.sin(s.twinkle));
    bgCtx.save();
    bgCtx.globalAlpha = brightness;
    bgCtx.fillStyle   = s.layer === 2 ? '#fffbe8' : '#c8d8ff';
    bgCtx.shadowColor = s.layer === 2 ? 'rgba(255,215,0,0.6)' : 'rgba(180,200,255,0.4)';
    bgCtx.shadowBlur  = s.layer === 2 ? 6 : 3;
    bgCtx.beginPath();
    bgCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    bgCtx.fill();
    bgCtx.restore();
  });
}

// Infinite animation loop for background only
function bgLoop() {
  drawBgStars();
  requestAnimationFrame(bgLoop);
}
