// ── api.js ─────────────────────────────────────────────────────
// All fetch() calls to the Flask Python backend.
// Loads config, saves scores, renders leaderboard.

// Load game config from /api/config (Python reads config.json)
async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    CFG = await res.json();
  } catch {
    // Fallback: inline config if running without Flask server
    CFG = {
      game:   { canvas: { width: 560, height: 500 }, lives: 3, combo_threshold: 3 },
      bucket: { width: 72, height: 34, speed: 7, smoothing: 0.2 },
      levels: [
        { level:1, score_threshold:0,   spawn_rate:85, base_speed:3.5, label:"STARGAZER"  },
        { level:2, score_threshold:120, spawn_rate:72, base_speed:4.8, label:"ASTRONOMER" },
        { level:3, score_threshold:280, spawn_rate:58, base_speed:5.8, label:"NAVIGATOR"  },
        { level:4, score_threshold:500, spawn_rate:44, base_speed:7.0, label:"COSMONAUT"  },
        { level:5, score_threshold:800, spawn_rate:32, base_speed:8.5, label:"WARP PILOT" }
      ],
      drop_types: [
        { id:"star",      label:"★", color:"#FFD700", glow:"rgba(255,215,0,0.7)",   points:10, radius:14, weight:55, special:false },
        { id:"moon",      label:"☽", color:"#c8d8ff", glow:"rgba(200,216,255,0.6)", points:25, radius:13, weight:25, special:false },
        { id:"comet",     label:"☄", color:"#ff9f43", glow:"rgba(255,159,67,0.7)",  points:50, radius:12, weight:10, special:"rare" },
        { id:"blackhole", label:"◉", color:"#ff4f7b", glow:"rgba(255,79,123,0.7)",  points:-1, radius:13, weight:10, special:"bad"  }
      ],
      scoring: {
        combo_multipliers: [
          { min_combo:1,  multiplier:1 },
          { min_combo:3,  multiplier:2 },
          { min_combo:5,  multiplier:3 },
          { min_combo:10, multiplier:5 }
        ]
      }
    };
  }
  // Boot everything once config is ready
  setupCanvas();
  buildBgStars(180);
  bgLoop();
  setBest();
  setLevel(1);
  setLives(3);
}

// GET top-10 scores from Flask → render table
async function fetchLeaderboard() {
  try {
    const res  = await fetch('/api/leaderboard');
    const data = await res.json();
    renderLeaderboard(data.leaderboard);
  } catch { /* offline — skip */ }
}

// POST new score to Flask → Python writes to leaderboard.json
async function saveScore() {
  const name = document.getElementById('nameInput').value.trim() || 'UNKNOWN';
  try {
    const res  = await fetch('/api/leaderboard', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, score, level, stars_caught: starsCaught })
    });
    const data = await res.json();
    renderLeaderboard(data.leaderboard);
    const btn = document.getElementById('saveBtn');
    btn.textContent = '✓ SAVED';
    btn.disabled = true;
  } catch { /* offline */ }
}

// Render leaderboard rows into the table
function renderLeaderboard(lb) {
  document.getElementById('lbBody').innerHTML = lb.slice(0, 8).map((e, i) =>
    `<tr>
      <td class="rank">${i + 1}</td>
      <td>${e.name}</td>
      <td>${e.score}</td>
      <td>${e.level}</td>
    </tr>`
  ).join('');
}

// Boot on page load
loadConfig();
