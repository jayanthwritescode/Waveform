# Historical Phase 2.5 checkpoint

Archived before Phase 3. Follow the current root README for startup and current functionality.

---

## Original README.md

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

---

## Original PROJECT_PROGRESS.md

# Waveform — Project progress

Last updated: 27 October 2026 (Asia/Kolkata).

## Current checkpoint

**Phase 2.5: Product Pivot and Architectural Refactoring — complete, awaiting user review and manual GitHub commit.**

**Product:** context-aware music discovery, recommendation and playlist generation.
**Tagline:** Your music. Your moment.

Only the transition phase was authorized and implemented. Phase 3 has not started. No automatic commits, pushes, destructive Git operations, pull requests or deployment were performed.

## Repository audit

- The working tree was clean at the start, at commit `8625bfc` (`feat: implement music catalogue`). No uncommitted user changes were overwritten.
- Read/inventoried the existing architecture, routes, data, settings, styles, documentation and tests. Baseline: 15 backend tests and 5 frontend tests passed.
- Phase 1 provided the reusable design system, responsive shell, navigation and FastAPI foundation.
- Phase 2 genuinely provided an eight-track metadata catalogue, search/filtering, credits and a working local player. No database models/files, saved playlists, preferences, listening history, trained model or genuine recommendations existed.
- Full technical assessment of retained/modified/removed components and migration risks: [docs/PIVOT_AUDIT.md](docs/PIVOT_AUDIT.md).

## Preserved

- Waveform branding and the midnight/lavender design language, original illustrations, responsive sidebar/top bar, reusable cards and accessibility primitives.
- All eight genuine catalogue records and their original source/license provenance. The original manifest remains byte-for-byte unchanged.
- Search/filter behavior, pagination, typed metadata/detail API, source credits, loading/empty/error/retry states, and configurable API/CORS boundaries.
- SQLAlchemy, database URL and reserved model/service/recommender directories. No database migration was needed.
- All eight ignored local MP3 files remain byte-for-byte unchanged, unserved and unused. No existing data or user-generated files were deleted.
- Historical README/progress/architecture/data notes are archived in [docs/history/PHASE_2.md](docs/history/PHASE_2.md).

## Removed

- Persistent audio player, Audio element creation, playback queue/history policy, buffering/error logic, play/pause/previous/next/shuffle/repeat/seek/volume controls and playback-only icons/styles.
- Local GET/HEAD audio endpoint and file availability checks. Public API records no longer expose audio URLs, checksums or availability fields.
- Audio download script, AUDIO_DIR setting/example and audio-only tests. Existing `.env` files are not overwritten; legacy AUDIO_DIR is ignored.
- No audio-exclusive installed dependency existed. General FastAPI, HTTP testing and SQLAlchemy dependencies are retained.

## Modified and added

- Home is playlist-oriented, with the new tagline, original decorative playlist illustration and an honest “Generate Your Playlist” entry to Vibe Control's future-feature explanation. Manual building is functional today; no generation is simulated.
- Playlist Builder replaces Smart Playlists in navigation. `#/playlists` remains a compatible alias. Listening Insights becomes Taste Insights at the existing `#/insights` route.
- Catalogue and detail pages add/remove tracks from a shared frontend draft. Selected states stay synchronized when returning to a page.
- `state/draft.js`: duplicate-safe ordered track snapshots, editable title/description, removal, move controls, clear and observable changes. Defensive copies prevent accidental external mutation.
- Playlist Builder: title/description fields, artist/title/album/duration rows, up/down controls, boundary handling, remove/clear, estimated totals and an empty state. Keyboard focus is restored after row changes.
- Optional draft dock: title, count, estimated duration, editor link and clear; shown only for a nonempty draft. Layout space is reserved only while visible.
- Draft state survives internal navigation and search; it remains in memory only. Clear keeps title/description and removes tracks.
- Metadata API adds dataset/source identifiers and nullable release year. It does not infer release year from upload dates. Historical audio provenance remains in the original manifest, ignored by public models; presentation omits obsolete audio-use wording.
- Health/API version reports phase 2.5. Only health and catalogue list/detail routes remain.
- Updated root README, architecture, data documentation, migration audit, revised roadmap and this checkpoint.

## Important files changed

- Backend: `app/api/tracks.py`, `app/api/health.py`, `app/services/catalogue.py`, `app/schemas/track.py`, `app/config.py`, `app/main.py`, metadata/health tests.
- Frontend: shell/cards/draft action components, `state/draft.js`, `pages/builder.js`, Home/Discover/placeholders, router/events, API client, index/styles/icons and new draft tests.
- Documentation: root README/progress, `data/README.md`, architecture, audit, roadmap and historical checkpoint.
- Removed source files: player controller, queue policy, player CSS, downloader and playback-only tests. Their history remains available through Git.

## Validation actually performed

| Check | Result |
| --- | --- |
| `.venv/bin/python -m pytest -c backend/pytest.ini -q` | **13 passed**: metadata integrity, provenance/null missing fields, health/CORS, search/filtering/pagination, query validation, details/404, metadata-only response and removed streaming routes/OpenAPI contract |
| `node --test frontend/tests/draft.test.mjs` | **6 passed**: duplicate protection, order/boundaries/removal, copied state, metadata/clear/notifications, unknown durations, invalid input/bounded and escaped rendering primitives |
| Node syntax checks | All remaining ES modules passed |
| Browser initial load | Catalogue loaded eight real metadata records; no audio/video elements; empty draft dock hidden |
| Adding/editing/reordering | Added Dreams Become Real, Cipher and Carefree; title/description edits worked; moved Carefree up; order and **14:06 estimated** summary updated |
| Navigation consistency | Title, description, selected track states, order and summaries survived navigation to Discover and back; removing/readding updated the same draft without duplicates |
| Removal/clear | Removed an editor row with usable focus; Clear removed all rows, hid dock, restored zero bottom offset and retained title/description |
| Search/filter regression | `piano` returned three results; Contemporary combined with it returned one; Clear restored eight; impossible query showed empty state |
| Detail actions | Added from an individual track detail page and returned to the same shared draft |
| Navigation | Home, Discover, Vibe Control, Your Library, Taste Insights, Explorer, Settings and Builder loaded; old playlists hash normalized to builder |
| Generation boundary | Home's Generate Your Playlist link opened the explanatory Vibe Control page, not a fabricated result |
| Responsive builder | 320, 390, 768, 1024 and 1440px: no horizontal overflow; dock actual height matched its reserved offset; no media elements |
| Console | No errors/warnings in the normal browser checks |
| Existing data | SHA-256 comparison confirmed all **nine** original data files (manifest + eight MP3s) preserved exactly |
| Repository checks | No obsolete playback imports/API calls in active frontend; Git whitespace checks passed |

Temporary local servers are stopped after verification. Use README commands to start them for review.

## Known limitations and remaining work

- No known blocking Phase 2.5 regressions from the checks above. Browser QA used the in-app browser; a wider browser/accessibility audit remains for Phase 8.
- Drafts are not saved: a full reload or closing the page resets them. This is clearly disclosed. Persistent playlists are Phase 3.
- Like/dislike feedback, favorite artists/genres, sessions, CSV/TXT/JSON import/export and Spotify/Apple Music/YouTube Music search links are Phase 3, not implemented now. No nonfunctional save/export buttons or fake integrations exist.
- Recommendation generation begins in Phase 4; mood/activity/context ranking follows in Phase 5. Current mood/theme links are explanatory navigation, not context scoring or automatic generation.
- The catalogue is small and limited to one composer. Album, release year, standardized musical features and platform-specific identifiers are unavailable. Nothing has been fabricated or claimed to exist on a destination platform.
- Public audio API fields/routes are deliberately incompatible with the retired player. Old links to streaming endpoints now return 404.
- Legacy MP3 files consume disk space but remain preserved, ignored and inaccessible through application routes. No manual audio installation is needed.

## Revised roadmap and next authorization

See [docs/ROADMAP.md](docs/ROADMAP.md) for the complete revised roadmap and export/provider boundaries.

| Phase | Status |
| --- | --- |
| 1 — Foundation and design system | Completed under original roadmap |
| 2 — Catalogue and functional player | Completed under original roadmap; player retired in 2.5 |
| 2.5 — Product pivot and architecture | Complete; awaiting review |
| 3 — User preferences and playlist management | Not started |
| 4 — Content-based recommendation engine | Not started |
| 5 — Context-aware playlist generation | Not started |
| 6 — Collaborative filtering and hybrid recommendations | Not started |
| 7 — Recommendation Explorer and Taste Insights | Not started |
| 8 — Export integration, polish and deployment | Not started |

**Next phase:** local profile/preferences, likes/dislikes, persistent playlist CRUD, portable CSV/TXT/JSON import/export and encoded external music searches; recommendation sessions only when actual sessions exist. No playback-based history will be invented.

Suggested manual commit: `refactor: pivot Waveform from music player to playlist recommendation platform`

**STOP after Phase 2.5. Do not begin Phase 3 until the user reviews, commits and explicitly authorizes it.**

---

## Original docs/ARCHITECTURE.md

# Waveform architecture — Phase 2.5

Waveform is a music discovery and playlist-building application with a vanilla frontend and metadata-only FastAPI backend. Product direction and future phases are in [ROADMAP.md](ROADMAP.md); the verified migration audit is in [PIVOT_AUDIT.md](PIVOT_AUDIT.md). Historical architecture is preserved in [history/PHASE_2.md](history/PHASE_2.md).

## Frontend

`index.html` provides semantic shell landmarks and the optional `#draft-dock`. JavaScript is served as native ES modules without a framework, bundler or runtime dependencies.

- `main.js`: hash routing, asynchronous catalogue/detail loading, debounced search, race/abort guards, filter state, and delegated draft actions. Route changes replace main content while the draft store stays alive.
- `components/shell.js`: sidebar/top bar/navigation. Playlist Builder replaces Smart Playlists; Taste Insights uses the previous insights hash. Old `#/playlists` links redirect to the builder.
- `components/cards.js`: reusable track/mix templates, skeletons, attribution and request error UI. Artwork/title open details; separate buttons add/remove draft tracks.
- `state/draft.js`: an observable, frontend-only draft store. Snapshots and additions are copied to prevent mutation through shared references. IDs prevent duplicate entries; bounded metadata editing, removal, reordering and clear produce change notifications. No storage or backend writes occur.
- `components/draft-actions.js`: shared selection buttons, selected-state synchronization and dock summaries. The dock is hidden for an empty draft and reserves no page space until populated.
- `pages/builder.js`: editable title/description, ordered track rows, album/duration fallbacks, move/remove actions, summaries and an empty state. Metadata edits update the dock without rebuilding focused input fields. Reordering/removal restores usable keyboard focus after row rendering.
- `pages/discover.js`: catalogue/search and source/credit detail views; existing search/filter behavior is retained.
- `pages/home.js`: playlist-oriented discovery, honest future-generation entry point and original decorative playlist illustration. Mood links remain explanatory navigation until Phase 5.
- `pages/placeholder.js`: future feature boundaries, with no fabricated saved playlists, feedback, sessions or analytics.
- `api/client.js`: metadata-only Fetch boundary with public origin configuration, timeout and HTTP failure handling.
- `utils/html.js`: escapes rendered metadata and draft title/description; formats durations. Source URLs use validated HTTP(S) catalogue metadata and new-tab links use `noopener noreferrer`.
- CSS: retained variables, layout, global/components, responsive and catalogue styles; `playlist.css` adds the editor/dock and conditional layout offset. All player-specific styles and transport icons are removed.

Drafts survive internal navigation/search/filter requests. A complete refresh starts a new empty draft. Clear removes tracks but retains the current title and description. Displayed duration is an estimate from known source durations; unknown durations are counted rather than treated as real zero-length tracks. Subscribers drive dock/card/editor consistency. No generated playlist or recommendation ranking is claimed.

## Backend and data

- `config.py`: root `.env`, application settings, configured CORS origins and reserved database URL. Legacy AUDIO_DIR in an existing `.env` is ignored; the file need not be changed.
- `schemas/track.py`: validated metadata, provenance and response types. Album, release year and unavailable standardized musical features remain null. Source upload date is distinct from release year.
- `services/catalogue.py`: validates the unchanged original manifest, rejects duplicate IDs, and performs deterministic metadata search, exact case-insensitive genre/artist filtering and pagination. Public records contain dataset/source identifiers and omit legacy audio fields. It never reads audio files.
- `api/tracks.py`: query validation, list/detail endpoints and missing-track 404s.
- `api/health.py`: typed status reporting phase 2.5.
- `main.py`: FastAPI version 0.2.5, configured local CORS and route registration. No audio route, static file serving, remote proxy or platform API client exists.

The metadata manifest is loaded once at startup. Restart FastAPI after editing it. Original audio files and historical audio metadata are preserved for migration safety, but are not required, read or exposed by the application. The static frontend root is `frontend/`, outside the legacy audio directory.

SQLAlchemy and database configuration are retained for Phase 3. No profile, playlist database table, interaction record or recommendation model exists yet; no data migration was necessary.

## Future boundaries

Phase 3 adds persistent profiles/preferences/playlists, explicit likes/dislikes and actual recommendation sessions when available, portable file import/export and external search links. Playlist serializers and provider search/integration modules should consume the existing metadata and ordered draft without owning it. Direct provider authorization/creation is deferred until official capability checks. Recommendation models are Phase 4 onward; context selection/ranking is Phase 5. Taste Insights uses only genuine application data, not invented listening statistics.
