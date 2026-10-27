# Waveform

**Music that understands your moment.**

Waveform is a context-aware music discovery project built with vanilla JavaScript and FastAPI. **Phases 1 and 2 are complete; Phase 3 awaits explicit authorization.**

## Current experience

- Midnight/lavender interface, original illustrations, responsive sidebar and persistent player.
- Real, attributed eight-track Kevin MacLeod catalogue with five source genres.
- Discover search across title, artist, genre, instruments and source tags; combinable genre/artist filters, clear filters, empty results, loading and retry states.
- Track detail pages with source metadata, individual credits, license links, and honest missing-feature information.
- Actual local MP3 playback: play/pause, previous/next, seeking, volume, shuffle, repeat off/all/one, queue completion, and missing-audio recovery.
- Playback and its queue continue across internal navigation and search. The queue is the result list visible when you select a track; playing from track details uses a one-track queue.
- Future pages explain upcoming functionality. Mood links and mix concepts are still placeholders; no recommendation model, analytics, profile, or listening history exists yet.

## Requirements and setup

Python 3.11+ and a modern browser supporting ES modules, Fetch and HTML5 Audio. No frontend installation or build is required. Node.js is optional for the frontend tests.

```sh
cd /Users/jayanth/Desktop/Waveform
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements-dev.txt
cp .env.example .env
python scripts/download_audio.py
```

On this working copy the dependencies and all eight audio files are already installed. The installer verifies and reuses them if run again. A fresh clone must download the audio because MP3 files are Git-ignored. Network access is needed only for package/audio installation, not normal playback.

`backend/requirements.txt` contains runtime dependencies. `backend/requirements-lock.txt` records the exact verified development versions; use it instead for a version-matched installation.

## Run locally

Backend in terminal 1:

```sh
cd /Users/jayanth/Desktop/Waveform
.venv/bin/python -m uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```

Frontend in terminal 2:

```sh
cd /Users/jayanth/Desktop/Waveform
python3.11 -m http.server 5173 --bind 127.0.0.1 --directory frontend
```

Open [Waveform](http://127.0.0.1:5173), [Discover](http://127.0.0.1:5173/#/discover), or [API documentation](http://127.0.0.1:8000/docs). Use HTTP rather than `file://` for JavaScript modules. Select an artwork's play button to start audio; select the title to view track details and credits. Playback requires a user gesture and starts only when requested.

Previous restarts a track after three seconds; before that it returns to queue history/the previous track. Shuffle visits remaining tracks without immediate repeats and stops after exhaustion with repeat off. Repeat all loops the queue; repeat one loops the current track at its natural end. Next still advances with repeat one. Browser refresh resets playback, filters, and queue; persistent user state is Phase 3 work.

## Configuration

The backend and audio installer load the root `.env`, with environment variables taking precedence.

| Variable | Default | Purpose |
| --- | --- | --- |
| `APP_NAME` | `Waveform` | API name |
| `APP_ENV` | `development` | Environment label |
| `CORS_ORIGINS` | `["http://localhost:5173", "http://127.0.0.1:5173"]` | JSON array of allowed frontend origins |
| `AUDIO_DIR` | `data/audio` | MP3 directory; relative paths resolve from project root |
| `DATABASE_URL` | `sqlite:///./data/waveform.db` | Reserved for Phase 3; no database created yet |

The browser API defaults to `http://127.0.0.1:8000`. To override it, assign `window.WAVEFORM_API_BASE` in a script before the module script in `frontend/index.html`. Browser configuration is public; do not place credentials there. Python's static server does not read `.env`.

## API

| Method and path | Behavior |
| --- | --- |
| `GET /api/health` | Application status, name, and phase 2 |
| `GET /api/tracks` | Catalogue page; `q`, `genre`, `artist`, `limit` (1–100), `offset` (0+) |
| `GET /api/tracks/{ISRC}` | Metadata, credits, audio availability and local playback URL |
| `GET` / `HEAD /api/tracks/{ISRC}/audio` | MP3 response with byte-range seeking; 404 for missing tracks/audio |

Search is case-insensitive, all query terms must match the searchable metadata, and filters combine with AND. Catalogue order is stable source/curation order, not a recommendation ranking. All filter options describe the complete collection. The API does not fetch arbitrary URLs or accept user filesystem paths.

## Testing

```sh
cd /Users/jayanth/Desktop/Waveform
.venv/bin/python -m pytest -c backend/pytest.ini -q
node --test frontend/tests/queue.test.mjs
curl http://127.0.0.1:8000/api/health
curl 'http://127.0.0.1:8000/api/tracks?q=piano&genre=Contemporary'
```

Expected automated results: 15 backend tests and 5 frontend tests pass. Tests do not download audio. Backend stream tests use temporary synthetic byte payloads to verify HTTP ranges; real MP3 decoding was checked separately in the browser for every catalogue track.

Review manually: search for `piano` (three matches), select Contemporary (one match), clear filters, play a track, pause/resume/seek, try next/previous and repeat/shuffle, navigate to another page while playing, and inspect individual credits. Settings has a backend connection check. The UI gives installation instructions when audio is missing and a retry state when the API is offline.

## Sources and limitations

Music is by Kevin MacLeod, [Incompetech](https://incompetech.com/music/royalty-free/music.html), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Audio is unmodified. The artwork is original Waveform illustration, not source album artwork. Individual credits and source links are on track pages and in the tracked catalogue manifest.

See [data/README.md](data/README.md) for licensing, source records, SHA-256 download verification, dataset evaluation, and the separation of playback data from future research experiments. The collection is small and contains one composer. Album and standardized energy/valence/acousticness/instrumentalness values are unavailable; they are not invented. No collaborative training data or model exists.

[PROJECT_PROGRESS.md](PROJECT_PROGRESS.md) records the review checkpoint and actual validation. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) describes the modules.

## Remaining phases

3. Local profile, preferences, likes/dislikes, listening interactions, library and playlist management.
4. Genuine content-based recommendations.
5. Context-aware ranking and Vibe Control.
6. Collaborative filtering and hybrid recommendations where alignment permits.
7. Recommendation comparison, real listening analytics, offline evaluation.
8. Final polish, integration testing, documentation and deployment.

Each phase stops for manual review and a user-managed GitHub commit. No automated commits, pushes or pull requests.
