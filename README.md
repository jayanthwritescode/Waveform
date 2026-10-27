# Waveform

**Your music. Your moment.**

Waveform is a platform-independent music discovery, recommendation and playlist generation project. The current **Phase 2.5 transition** preserves the existing discovery catalogue and adds a working manual playlist draft. Automatic recommendations and persistent playlists are future phases.

The intended journey is **Choose Context → Generate Recommendations → Refine Playlist → Save or Export**. Waveform does not host or stream music and works independently of third-party platform APIs.

## Working today

- Existing midnight/lavender design system, responsive sidebar, navigation and original illustrations.
- Eight real Kevin MacLeod track metadata records, with source identifiers, ISRCs, genre, instruments, tags, tempo, duration and licensing provenance.
- Discover search across title, artist, genre, instruments and tags; combined genre/artist filters, clear filters, loading/empty/error/retry states.
- Metadata detail pages with individual source and credit links.
- Add/remove draft actions on catalogue cards and track details; no playback controls.
- Playlist Builder with editable title/description, ordered track list, accessible move up/down buttons, removal and clear.
- Optional draft dock with title, track count, estimated duration, editor link and clear action. It appears only while tracks are selected.
- Draft state remains consistent across internal navigation and search. **Refreshing or closing the page clears the draft.** Clear removes tracks but keeps the current title and description.
- Taste Insights replaces Listening Insights. Future pages clearly explain their planned scope.

The home “Generate Your Playlist” link opens an honest explanation of upcoming generation, with a route to manual building. It does not produce simulated recommendations. Saving, CSV/TXT/JSON import/export, feedback and external platform searches are revised Phase 3 work; no nonfunctional export or save buttons are shown.

## Setup

Use Python 3.11+ and a modern browser supporting ES modules, Fetch and `structuredClone`. Node.js is optional for frontend tests. No frontend dependency installation/build is required.

```sh
cd /Users/jayanth/Desktop/Waveform
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements-dev.txt
```

For a fresh checkout, copy `.env.example` to `.env` if custom configuration is needed. Preserve an existing `.env`. `backend/requirements.txt` lists runtime dependencies; `requirements-lock.txt` records the verified development versions.

**No audio download or installation is required.** Legacy MP3 files from Phase 2 remain untouched in ignored `data/audio/`, but the application neither reads nor serves them. The audio downloader and streaming endpoints have been retired.

## Run locally

Backend, in terminal 1:

```sh
cd /Users/jayanth/Desktop/Waveform
.venv/bin/python -m uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```

Frontend, in terminal 2:

```sh
cd /Users/jayanth/Desktop/Waveform
python3.11 -m http.server 5173 --bind 127.0.0.1 --directory frontend
```

Open [Waveform](http://127.0.0.1:5173), [Discover](http://127.0.0.1:5173/#/discover), [Playlist Builder](http://127.0.0.1:5173/#/builder), or [API docs](http://127.0.0.1:8000/docs). Serve the frontend over HTTP rather than `file://`.

## Manual review

1. Open Discover. The dock is hidden while the draft is empty.
2. Search `piano` (three tracks), then choose Contemporary (one track). Clear filters to restore all eight.
3. Add Dreams Become Real, Cipher and Carefree. The dock shows three tracks and **14:06 estimated**.
4. Open **Edit playlist**. Change the title and description; move Carefree up, remove a track, and check the row order/count/duration.
5. Visit Discover, Home and a track detail page, then return to the builder. The same draft and metadata remain; selected cards show **In your draft**.
6. Clear the draft. The dock hides and the editor shows its empty state; the title/description remain available for another selection.
7. Test keyboard focus and narrow mobile layouts. Refresh intentionally starts a new empty draft.
8. Stop the backend and search again to check the connection error. Restart it and choose **Try again**. Settings also has a connection check.

## Configuration

The backend loads the root `.env`, with environment variables taking precedence.

| Variable | Default | Purpose |
| --- | --- | --- |
| `APP_NAME` | `Waveform` | API application name |
| `APP_ENV` | `development` | Environment label |
| `CORS_ORIGINS` | `["http://localhost:5173", "http://127.0.0.1:5173"]` | JSON array of allowed frontend origins |
| `DATABASE_URL` | `sqlite:///./data/waveform.db` | Reserved database setting for Phase 3; no database created yet |

An old `AUDIO_DIR` entry in `.env` is ignored and can be removed manually; the pivot does not overwrite existing environment files.

The browser API defaults to `http://127.0.0.1:8000`. To override it, assign `window.WAVEFORM_API_BASE` before the module script in `frontend/index.html`. This is public configuration; do not put secrets there. Python's static server does not read `.env`.

## Metadata API

| Method and path | Behavior |
| --- | --- |
| `GET /api/health` | Application status and phase `2.5` |
| `GET /api/tracks` | Catalogue with `q`, `genre`, `artist`, `limit` (1–100), `offset` (0+) |
| `GET /api/tracks/{ISRC}` | Metadata, source identifiers, credits and provenance |

Search is case-insensitive; all query terms must match searchable metadata. Filters combine with AND. Ordering is deterministic catalogue order, not personalized ranking. Filter choices describe the whole collection.

The former `/api/tracks/{ISRC}/audio` route returns 404. Audio URLs, hashes and availability fields are not exposed by the API. The original manifest preserves historical audio provenance without requiring a destructive data migration. Restart FastAPI after editing catalogue metadata.

## Tests

```sh
cd /Users/jayanth/Desktop/Waveform
.venv/bin/python -m pytest -c backend/pytest.ini -q
node --test frontend/tests/draft.test.mjs
curl http://127.0.0.1:8000/api/health
curl 'http://127.0.0.1:8000/api/tracks?q=piano&genre=Contemporary'
```

Expected current results: **13 backend tests and 6 frontend tests pass**. Backend tests cover metadata integrity, health/CORS, search/filtering/pagination, validation, 404s, and removal of streaming endpoints/public audio fields. Frontend tests cover duplicate prevention, ordering/removal, copied state, metadata/clear notifications, unknown durations and safe rendering primitives. No tests download music or contact a music platform.

## Data and roadmap

The eight-track metadata scaffold contains one composer and is not representative enough for evaluating recommendation quality. Album, release year and standardized energy/valence/acousticness/instrumentalness are unavailable and remain null. The catalogue upload date is not used as release year. Platform-specific identifiers/matching are not available; presence in this collection does not guarantee presence on Spotify, Apple Music or YouTube Music.

Metadata and credits originate from [Incompetech](https://incompetech.com/music/royalty-free/music.html). Original Waveform illustrations are distinguished from artist album artwork. Details and limitations are in [data/README.md](data/README.md).

- [Revised roadmap](docs/ROADMAP.md): Phase 3 persistence, portable file export/import and external search; Phases 4–6 recommendation models; Phase 7 Explorer/Taste Insights; Phase 8 polish and optional official integrations.
- [Architecture](docs/ARCHITECTURE.md) and [pivot audit](docs/PIVOT_AUDIT.md): retained components, changes and compatibility risks.
- [Project progress](PROJECT_PROGRESS.md): completed work and actual validation.
- [Phase 2 history](docs/history/PHASE_2.md): preserved historical documentation, not current startup instructions.

Phase 2.5 stops for review and a user-managed GitHub commit. Do not begin Phase 3 until explicitly authorized. No automated commits, pushes, destructive Git operations or deployment.
