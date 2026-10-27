# Waveform

**Your music. Your moment.**

Waveform is a platform-independent music discovery, recommendation and playlist generation project. **Phase 3 is complete: local preferences, feedback, saved playlists and portable files.** Recommendation algorithms start in Phase 4; the app does not simulate generated recommendations or listening history.

## Working today

- Responsive midnight/lavender interface, eight real credited track metadata records and catalogue search/filtering.
- Local single-user profile: name, favorite/disliked genres, favorite artists, energy range, instrumental and familiarity/discovery preferences.
- Persisted Like/Dislike feedback with mutually exclusive, reversible selections.
- Playlist Builder: title/description, add/remove/reorder, estimated duration, explicit save/update and save a copy.
- Your Library: saved playlist editing/deletion, file exports, liked/disliked tracks, favorite artists/genres, and an honest empty recommendation-session state.
- UTF-8 CSV, TXT and JSON export; validated imports with previews, exact source-ID matching and clearly labeled unmatched metadata.
- Properly encoded Spotify, Apple Music and YouTube Music searches on catalogue/details/editor tracks. These are search links, not direct playlist transfers or verified destination matches.
- SQLite persistence through SQLAlchemy; saved records survive frontend reloads and backend restarts. Revision checks protect against stale edits/deletions in another tab.
- Editor recovery on refresh in the current tab using session storage. Save to Your Library for permanent storage. Failed requests retain the draft and form inputs.

The home generation link still explains future generation. No recommendation model, automatic playlist generation, Taste Insights metrics, playback or third-party account integration has been added.

## Setup and run

Use Python 3.11+ and a modern browser with native ES modules, Fetch, structuredClone, Blob downloads and File/TextDecoder APIs. Node.js is optional for frontend tests. No frontend install/build is needed, and no audio download is required.

```sh
cd /Users/jayanth/Desktop/Waveform
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements-dev.txt
```

For a fresh checkout, copy `.env.example` to `.env` if custom configuration is needed. Preserve an existing `.env`. Runtime dependencies are in `backend/requirements.txt`; `requirements-lock.txt` captures the verified versions. Phase 3 adds no package dependencies.

Backend, terminal 1:

```sh
cd /Users/jayanth/Desktop/Waveform
.venv/bin/python -m uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```

Frontend, terminal 2:

```sh
cd /Users/jayanth/Desktop/Waveform
python3.11 -m http.server 5173 --bind 127.0.0.1 --directory frontend
```

Open [Waveform](http://127.0.0.1:5173), [Your Library](http://127.0.0.1:5173/#/library), [Settings](http://127.0.0.1:5173/#/settings), or [API docs](http://127.0.0.1:8000/docs). Serve the frontend over HTTP and only from `frontend/`, outside the preserved legacy audio directory.

## Local storage and configuration

The backend loads the root `.env`, with environment variables taking precedence.

| Variable | Default | Purpose |
| --- | --- | --- |
| APP_NAME | Waveform | API name |
| APP_ENV | development | Environment label |
| CORS_ORIGINS | `["http://localhost:5173", "http://127.0.0.1:5173"]` | Allowed frontend origins; JSON array |
| DATABASE_URL | `sqlite:///./data/waveform.db` | Local workspace database; relative SQLite paths resolve from the project root |

First startup creates the initial tables and default local profile without dropping existing data. Database files are Git-ignored. Back up the SQLite file while the server is stopped; do not commit it. Existing source metadata and legacy MP3 files remain unchanged and are not served. Legacy AUDIO_DIR is ignored.

This is a single-user local app bound to loopback, with no account authentication. It is not configured for public multi-user deployment. SQLAlchemy keeps database access separate from routes; PostgreSQL needs an appropriate driver and future deployment/migration work. Phase 3 introduces the first schema using `create_all`; future schema changes require explicit migrations.

The editor's tab recovery is separate from saved playlists. It survives a reload in the same tab; closing/clearing the browser session may remove it. If session storage is unavailable, the editor reports that limitation and remains usable in memory. Save to the backend to keep a playlist. New/open/import actions distinguish replacing the editor from updating a saved playlist. Clear removes tracks but retains the current title/description.

The frontend API defaults to `http://127.0.0.1:8000`. Override with `window.WAVEFORM_API_BASE` before the module script; this browser-visible setting must not contain secrets.

## Using the app

1. In Settings, edit your profile and preferences, then Save preferences. Use one artist/genre per line; commas inside an artist name are preserved. Conflicting favorite/disliked genres or invalid energy ranges are rejected without losing the form.
2. In Discover, search/filter, select Like/Dislike, and add tracks to the draft. Clicking the active feedback again clears it.
3. In Playlist Builder, edit metadata/order and Save playlist. Open saved playlists from Your Library, then Save changes or Save a copy. Delete uses a separate disclosure and explicit delete action.
4. Download CSV/TXT/JSON from the editor or saved library. No file download is represented as a transfer to a streaming service.
5. Select a file to preview its metadata, matches and warnings. Load it explicitly as a new unsaved draft, then save if wanted. Invalid files do not replace the draft.
6. Expand Find on music services to search by artist/title without linking an account.

[FILE_FORMATS.md](docs/FILE_FORMATS.md) defines accepted file versions/columns, escaping, matching, unknown metadata and size limits. JSON retains full validated metadata; CSV/TXT retain portable fields. TXT import supports Waveform v1 exports; CSV requires Track Title and Artist. No exact platform availability is assumed.

## API

| Method/path | Behavior |
| --- | --- |
| GET `/api/health` | Status and phase 3 |
| GET `/api/tracks`, `/api/tracks/{ISRC}` | Metadata search/details; no audio routes |
| GET/PUT `/api/profile` | Local profile/preferences; revision required for update |
| GET `/api/feedback`; PUT `/api/feedback/{catalogue_id}` | Explicit like/dislike/null feedback |
| GET/POST `/api/playlists` | List/create saved playlists |
| GET/PUT/DELETE `/api/playlists/{id}` | Read/update/delete; updates and deletes require current revision |
| GET `/api/playlists/{id}/export?format=csv|txt|json` | Export saved playlist |
| POST `/api/playlist-export?format=csv|txt|json` | Export editor payload without saving |
| POST `/api/playlist-import` | Validate `{format, content}` and preview; no database write |
| GET `/api/library` | Saved playlists, feedback, profile and real recommendation sessions |

Playlist inputs contain title, description and ordered track metadata. Imports and saves normalize catalogue identities and remove duplicates. Unknown imported records retain provenance and missing values. No arbitrary remote URLs are fetched. Input validation errors omit raw file payloads; database failures return a useful 503; stale revisions return 409 and retain the editor.

## Testing and review

```sh
cd /Users/jayanth/Desktop/Waveform
.venv/bin/python -m pytest -c backend/pytest.ini -q
node --test frontend/tests/*.test.mjs
```

**30 backend tests and 10 frontend tests pass.** Database tests use isolated temporary SQLite files, not the user's workspace. Tests cover persistence/reopen, profile validation, feedback, playlist CRUD/order/revision conflicts, all three file round trips, Unicode/multiline CSV/quotes, formula-safe CSV, empty exports, unmatched imports, malformed files, byte limits, database failures, draft identity and encoded platform searches.

Browser QA verified profile reload, feedback changes, playlist save/reopen/rename/reorder, editor recovery, a real JSON download and import preview/load, backend restart persistence, failed-save retention and responsive library/editor/settings layouts. No platform playlist was created. Exact results and checkpoint status are in [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md).

## Data and remaining work

The original catalogue contains eight Kevin MacLeod records and one composer. It is not representative enough to evaluate recommendation quality. Album, release year and standardized energy/valence/acousticness/instrumentalness remain unknown; upload date is not release year. See [data/README.md](data/README.md) for source/credit details and preservation notes.

Profile preferences and feedback are saved now; they do not yet change catalogue ranking. The recommendation session table remains empty until the engine records genuine output. Manual drafts/imports are not fabricated sessions or audio plays.

- Phase 4: legitimate preprocessing, content-based recommendations, basic playlist generation and explanations.
- Phase 5: context-aware playlist generation and Vibe Control.
- Phase 6: collaborative/hybrid models where valid.
- Phase 7: Explorer and Taste Insights from genuine interactions/evaluation.
- Phase 8: export refinements, optional official integrations, polish, tests and deployment.

See [roadmap](docs/ROADMAP.md), [architecture](docs/ARCHITECTURE.md) and the archived [Phase 2.5 checkpoint](docs/history/PHASE_2_5.md). Stop after Phase 3 for manual review/commit. No automated commits, pushes, destructive Git operations or Phase 4 work.
