"""
STARFALL — Python Backend (app.py)
====================================
Flask server that:
  - Serves the game HTML page
  - Loads game config from JSON
  - Manages leaderboard (read/write JSON)
  - Provides a REST API for the frontend
"""

import json
import os
from datetime import datetime
from flask import Flask, jsonify, request, send_from_directory

# ── App setup ──────────────────────────────────────────────────────────────
app = Flask(__name__, static_folder="static")

BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
DATA_DIR  = os.path.join(BASE_DIR, "data")
CONFIG_FILE      = os.path.join(DATA_DIR, "config.json")
LEADERBOARD_FILE = os.path.join(DATA_DIR, "leaderboard.json")


# ── Helper: load / save JSON ───────────────────────────────────────────────
def load_json(path: str) -> dict:
    """Read a JSON file and return its contents as a dict."""
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path: str, data: dict) -> None:
    """Write a dict back to a JSON file (pretty-printed)."""
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


# ── Routes ─────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    """Serve the main game page."""
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/api/config")
def get_config():
    """
    GET /api/config
    Returns the full game configuration (levels, drop types, scoring…).
    The frontend fetches this on load so ALL game settings live in one place.
    """
    config = load_json(CONFIG_FILE)
    return jsonify(config)


@app.route("/api/leaderboard", methods=["GET"])
def get_leaderboard():
    """
    GET /api/leaderboard
    Returns top-10 scores sorted highest first, plus global stats.
    """
    data = load_json(LEADERBOARD_FILE)
    # Sort descending by score
    top10 = sorted(data["leaderboard"], key=lambda x: x["score"], reverse=True)[:10]
    return jsonify({
        "leaderboard": top10,
        "total_games_played": data["total_games_played"],
        "total_stars_caught": data["total_stars_caught"]
    })


@app.route("/api/leaderboard", methods=["POST"])
def save_score():
    """
    POST /api/leaderboard
    Body (JSON): { "name": "AAA", "score": 420, "level": 3, "stars_caught": 38 }
    Saves the new score and returns updated top-10.
    """
    body = request.get_json(silent=True) or {}
    name         = str(body.get("name", "???"))[:12].strip() or "UNKNOWN"
    score        = int(body.get("score", 0))
    level        = int(body.get("level", 1))
    stars_caught = int(body.get("stars_caught", 0))

    data = load_json(LEADERBOARD_FILE)

    # Append new entry
    entry = {
        "name":         name,
        "score":        score,
        "level":        level,
        "stars_caught": stars_caught,
        "date":         datetime.now().strftime("%Y-%m-%d")
    }
    data["leaderboard"].append(entry)
    data["total_games_played"] += 1
    data["total_stars_caught"] += stars_caught

    save_json(LEADERBOARD_FILE, data)

    # Return updated top-10
    top10 = sorted(data["leaderboard"], key=lambda x: x["score"], reverse=True)[:10]
    rank  = next((i + 1 for i, e in enumerate(top10) if e == entry), None)

    return jsonify({
        "saved": True,
        "rank":  rank,
        "leaderboard": top10
    }), 201


# ── Dev server ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 50)
    print("  🌟  STARFALL game server starting…")
    print("  👉  Open http://localhost:5000 in your browser")
    print("=" * 50)
    app.run(debug=True, port=5000)
