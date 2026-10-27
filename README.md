# Waveform

**Music that understands your moment.**

Waveform is a context-aware music discovery project built with vanilla JavaScript and FastAPI. Development follows eight separate review checkpoints. **Phase 1 is complete; Phase 2 has not started.**

## Current experience

- A midnight and lavender design system with original SVG artwork and a CSS vinyl illustration.
- Responsive sidebar, top bar, home dashboard, and persistent player shell.
- Hash navigation across Home, Discover, Vibe Control, Your Library, Smart Playlists, Listening Insights, Recommendation Explorer, and Settings.
- Clearly labeled fictional sample tracks; selecting one updates the player preview across internal navigation.
- Accessible names, focus indicators, a skip link, mobile navigation, and reduced-motion support.
- FastAPI health endpoint with validated response, environment configuration, and explicit local CORS origins.
- Backend connection check in Settings, including loading and failure messages.

**This phase contains no real audio, recommendations, analytics, user persistence, or dataset.** Playback controls are disabled and upcoming pages explain their planned phase. Mood links navigate to the future Vibe Control page; they do not set context or generate results.

## Requirements

- Python 3.11+ (verified with Python 3.11.15).
- A modern browser supporting ES modules, Fetch, and `AbortSignal.timeout`.
- No frontend package manager or build step is needed.

## First-time setup

Run from the project root:

```sh
cd /Users/jayanth/Desktop/Waveform
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements-dev.txt
cp .env.example .env
```

`backend/requirements.txt` contains runtime dependencies only. `backend/requirements-lock.txt` captures the exact development versions verified for this checkpoint; use `python -m pip install -r backend/requirements-lock.txt` to reproduce those versions.

## Run locally

Backend, in terminal 1:

```sh
cd /Users/jayanth/Desktop/Waveform
source .venv/bin/activate
python -m uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```

Frontend, in terminal 2:

```sh
cd /Users/jayanth/Desktop/Waveform
python3.11 -m http.server 5173 --bind 127.0.0.1 --directory frontend
```

Open [Waveform](http://127.0.0.1:5173), [API health](http://127.0.0.1:8000/api/health), or [API documentation](http://127.0.0.1:8000/docs). Serve the frontend over HTTP; ES modules will not work reliably with `file://`.

In Settings, choose **Check connection** to verify the frontend can reach FastAPI. If a port is occupied, stop the existing process or choose another port and update the corresponding configuration.

## Configuration

The backend reads the root `.env` file, with environment variables taking precedence.

| Variable | Default | Purpose |
| --- | --- | --- |
| `APP_NAME` | `Waveform` | API name |
| `APP_ENV` | `development` | Environment label reserved for later configuration |
| `CORS_ORIGINS` | `["http://localhost:5173", "http://127.0.0.1:5173"]` | JSON array of allowed frontend origins |
| `DATABASE_URL` | `sqlite:///./data/waveform.db` | Reserved database configuration; Phase 1 does not create a database |

The frontend API defaults to `http://127.0.0.1:8000`. To use another backend origin, assign `window.WAVEFORM_API_BASE` in a script before the module script in `frontend/index.html`. This value is public browser configuration; never put credentials there. Python's static server does not read `.env` files.

## Validation

```sh
cd /Users/jayanth/Desktop/Waveform
.venv/bin/python -m pytest -c backend/pytest.ini -q
curl http://127.0.0.1:8000/api/health
```

Expected health response:

```json
{"status":"ok","app":"Waveform","phase":1}
```

Manual review: navigate every sidebar route, select a fictional sample, verify it remains selected during navigation, resize to mobile, open/close navigation, test keyboard focus, and check Settings with the backend running and stopped. Browser refresh resets the selected sample; persistent user state is scheduled for Phase 3.

See [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md) for actual checkpoint results and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for module responsibilities.

## Development phases

1. Foundation and design system — complete, awaiting review.
2. Real music catalogue, dataset/license research, search, and authorized audio playback.
3. Local profile, preferences, listening interactions, library, and playlists.
4. Genuine content-based filtering.
5. Context-aware ranking and Vibe Control.
6. Collaborative filtering and hybrid recommendations where catalogue alignment permits.
7. Recommendation comparison, real listening analytics, and offline evaluation.
8. Final polish, integration testing, documentation, and deployment.

Each phase requires explicit authorization before the next begins. No automated commits, pushes, or pull requests.
