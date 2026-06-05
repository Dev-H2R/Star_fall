# 🌟 STARFALL — Resume Game Project

## Project Structure
```
dropzone/
├── app.py              ← Python Flask backend (REST API)
├── index.html          ← Game frontend (HTML + CSS + JS)
├── requirements.txt    ← Python dependencies
└── data/
    ├── config.json     ← ALL game settings (levels, drops, speed, scoring)
    └── leaderboard.json← Persistent score storage (read/write by Python)
```

## How to Run
```bash
pip install -r requirements.txt
python app.py
# Open http://localhost:5000
```

## Tech Stack (for interviews)
| Layer     | Tech         | Purpose                            |
|-----------|--------------|------------------------------------|
| Backend   | Python/Flask | REST API, file I/O, routing        |
| Data      | JSON         | Config + leaderboard persistence   |
| Frontend  | HTML/CSS/JS  | Canvas game engine, animations     |
| API calls | fetch()      | JS talks to Python via REST        |

## API Endpoints
- GET  /api/config       → Load all game settings from JSON
- GET  /api/leaderboard  → Top 10 scores
- POST /api/leaderboard  → Save a new score

## Interview Talking Points
1. **Separation of concerns** — config in JSON, logic in Python, UI in JS
2. **REST API design** — GET vs POST, JSON request/response
3. **Canvas API** — requestAnimationFrame game loop, particle system
4. **OOP-style game state** — drops, particles, floaters as objects
5. **Graceful degradation** — game works even if Python server is offline
