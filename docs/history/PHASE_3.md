# Phase 3 checkpoint archive


---

## README.md

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

---

## PROJECT_PROGRESS.md

# Waveform — Project progress

Last updated: 27 October 2026 (Asia/Kolkata).

## Current checkpoint

**Phase 3: User Preferences and Playlist Management — complete, awaiting user review and manual GitHub commit.**

Only revised Phase 3 was authorized. Phase 4 has not started. No automatic commits, pushes, destructive Git operations, pull requests or deployment were performed.

## Starting state and preserved work

- Working tree was clean at the start, with the Phase 2.5 pivot committed.
- Inspected roadmap/progress, frontend state/routes/cards/editor, API/client/models/configuration, existing tests and local preview workflow.
- Retained the design system, responsive navigation, eight genuine catalogue records, search/filtering, track details, credits and metadata-only architecture.
- Preserved the original catalogue and all eight ignored legacy MP3 files without modification. Existing documents are archived in `docs/history/PHASE_2_5.md` before updates.
- No database/user records existed before this phase. Added the first schema without destructive migration or changes to the original source manifest. No audio playback/streaming was reintroduced.

## Implemented

### Local persistence and validation

- SQLAlchemy models for a local singleton profile, saved playlists with ordered metadata snapshots, explicit track feedback and future genuine recommendation sessions.
- SQLite configuration resolves relative paths against the project root. Startup initializes missing tables and a default profile; sessions close/roll back correctly.
- Profile preferences: name, favorite/disliked genres, favorite artists, energy range, instrumental preference and familiarity/discovery preference. Contradictory genres and invalid ranges are rejected.
- Like/Dislike feedback is mutually exclusive, persistent and reversible; imported unmatched tracks do not masquerade as catalogue feedback.
- Saved playlist create/read/update/delete, title/description editing, track removal/reordering and save a copy. UUIDs, UTC timestamps and atomic revision comparisons prevent stale updates/deletions silently overwriting newer state.
- Actionable database 503, network/timeout, validation and conflict messages. Raw file/preference input is omitted from validation responses.

### Frontend experience

- Real Settings form and Your Library replace the corresponding placeholders.
- Library shows actual saved playlists, liked/disliked tracks and profile favorites. Delete is a separate disclosure/explicit action; edit loads the saved revision.
- Shared editor now tracks saved ID/revision, dirty state and editor generation. Save results do not clear newer edits or bind a different loaded/new draft.
- Versioned session-storage draft recovery survives refresh in the same tab; backend saves are the durable playlist store. Storage failures preserve in-memory work and report recovery limitations.
- New/open actions protect unsaved tracks with a Replace/Cancel choice. Imports are previewed before explicit replacement. Clear retains metadata; New playlist starts an independent empty editor.
- Sidebar identity follows the saved local profile. Unavailable/pending feedback controls reflect real request state.
- No generated recommendations, fabricated sessions, playback events or listening statistics are shown. The recommendation-session table is genuinely empty.

### Files and external searches

- Actual UTF-8 CSV/TXT/JSON downloads from the editor or saved library, independent of music-platform accounts.
- Validated imports with previews, exact catalogue-ID/ISRC matching, canonical catalogue credits, duplicate removal, explicit unmatched `user_import` provenance and unknown optional metadata.
- JSON retains complete validated metadata. CSV/TXT preserve documented portable fields; CSV handles commas/quotes/Unicode/multiline values and reversible formula/control-character escaping.
- Waveform TXT v1 and JSON v1 formats; CSV requires Track Title and Artist. Empty playlists round trip with metadata. One million UTF-8 bytes/500-track limits, local-artwork restrictions and malformed-file rejection.
- Encoded fixed-origin searches for Spotify, Apple Music and YouTube Music on cards/details/editor tracks. No guessed destination track IDs, direct API integration or claimed transfer success.
- Full format/matching/provider boundaries are documented in `docs/FILE_FORMATS.md`.

## Important files added/modified

- Backend database/models: `backend/app/database/core.py`, `backend/app/models/workspace.py`.
- Backend API/services/schemas: `api/workspace.py`, `schemas/workspace.py`, `services/playlists.py`, `services/portable.py`, application startup/errors/CORS and phase health response.
- Frontend state/API: `state/draft.js`, `state/workspace.js`, `api/client.js`.
- Frontend UI: Settings/Library/Builder, playlist tools, feedback/platform actions, shared cards/details, main route/events, sidebar identity and `css/workspace.css`.
- Tests: `backend/tests/test_workspace.py`, updated health/catalogue checks, expanded draft tests and `frontend/tests/platforms.test.mjs`.
- Documentation: root README, roadmap, architecture, data notes, format reference, history and this checkpoint. SQLite journal files are Git-ignored.

## Validation actually performed

| Check | Result |
| --- | --- |
| `.venv/bin/python -m pytest -c backend/pytest.ini -q` | **30 passed**: catalogue regressions, profile/preferences validation/persistence/conflicts, explicit feedback, playlist CRUD/order/revisions/reopen, three format round trips, Unicode/multiline quoting, formula-safe CSV, unknown imported metadata, empty exports, malformed files, UTF-8 byte bounds/no payload reflection and database-error response |
| `node --test frontend/tests/*.test.mjs` | **10 passed**: duplicate/order/boundary behavior, immutable snapshots, metadata/notifications, unknown duration/input handling, saved/recovered/imported draft identity and dirty state, encoded platform queries and local artwork safety |
| Node syntax and Git whitespace | All ES modules and `git diff --check` passed |
| Browser preferences | Saved name, genres, an artist, energy range and instrumental preference; reloaded and verified values persisted |
| Browser feedback | Like → Dislike → Like updated a single explicit track preference; library showed the correct liked state |
| Browser save/update | Saved a two-track QA playlist, reopened it, renamed/reordered it and saved revision 2 |
| Draft recovery | Refreshed the saved editor and then an imported unsaved editor; title, order and two tracks recovered correctly |
| Real download | Browser downloaded `waveform-playlist.json`; inspected UTF-8 JSON and verified playlist metadata/order |
| Real import | Selected that downloaded file using the actual file input; preview reported 2 exact catalogue matches, left the editor unchanged until explicit load, then loaded an unsaved independent draft |
| Restart persistence | Stopped/restarted FastAPI; saved playlist revision 2, profile favorites and feedback remained |
| Failed save | Stopped backend and attempted a save; editor retained both tracks/title and showed a restart/retry instruction |
| Unsaved-change guard | Opening a saved version over an unsaved draft showed Replace/Cancel; Cancel preserved the editor |
| Browser delete/cleanup | Deleted only the QA playlist through the UI, cleared only QA feedback, restored the initially empty/default profile and reset the QA draft |
| Control visibility | Final visual review caught a hidden Save a copy button overridden by component CSS; a global semantic hidden rule now keeps it hidden for unsaved drafts. Browser computed display verified `none` |
| Platform links | Expanded editor links and verified all three encoded HTTPS artist/title search URLs without creating platform playlists |
| Responsive checks | Library at 320, 390, 768, 1024, 1440px; Builder/Settings at 320, 768, 1440px: no horizontal overflow |
| Data integrity | SQLite `integrity_check` returned `ok`; original manifest + eight legacy MP3s remained unchanged |
| Clean local workspace | One default profile; zero saved QA playlists, zero feedback rows and zero recommendation sessions remain after cleanup |

Negative tests deliberately generated an unavailable-backend request; no unhandled application failure occurred. Browser file automation took longer than normal interaction, but both the download and import completed successfully. Review screenshots show the clearly named QA playlist before cleanup; they are not fabricated user history. A QA JSON export remains in the browser's Downloads directory for inspection.

Test servers are stopped after final validation. Use README commands to start the app.

## Known limitations

- No known blocking Phase 3 defects from the checks above. QA used the in-app browser, not a full cross-browser/accessibility matrix.
- Single local user, no authentication/public multi-user deployment. SQLite is the verified database; PostgreSQL requires a driver and later deployment/migration work.
- Tab recovery is not permanent storage; Save to Your Library is required for durable playlists. Conflicting edits return 409 and need reloading the saved version or saving a copy.
- CSV/TXT preserve portable fields, not all JSON metadata. TXT accepts Waveform v1 exports, not arbitrary prose lists. Third-party transfer tools may treat spreadsheet-safe CSV prefixes differently; JSON is the lossless format.
- Exact external track availability and playlist creation are not verified. Search links are not direct exports and no platform integration/authentication was implemented.
- The eight-track, single-composer catalogue remains a scaffold. Missing musical features remain unknown. Preferences/feedback are stored but do not yet change catalogue ranking.
- No recommendation generation/session exists yet. The table/library empty state are ready for genuine Phase 4 output; no manual draft/save/import is counted as a recommendation session.
- Initial schema creation uses `create_all`; future schema changes need explicit migrations rather than destructive resets.

## Revised phase status

| Phase | Status |
| --- | --- |
| 1 — Foundation/design system | Complete |
| 2 — Original catalogue/player | Complete; player retired in 2.5 |
| 2.5 — Product pivot | Complete |
| 3 — User preferences and playlist management | Complete; awaiting review |
| 4 — Content-based recommendation engine | Not started |
| 5 — Context-aware playlist generation | Not started |
| 6 — Collaborative/hybrid recommendations | Not started |
| 7 — Recommendation Explorer and Taste Insights | Not started |
| 8 — Integration, polish and deployment | Not started |

**Next phase:** legitimate dataset preprocessing/feature engineering, user preference profiling, content-based recommendation API, basic playlist generation, explanations and evaluation tests. Do not start without explicit authorization.

Suggested manual commit: `feat: add persistent preferences playlist management and portable exports`

**STOP after Phase 3. Await user review, manual GitHub commit and explicit authorization for Phase 4.**

---

## docs/ARCHITECTURE.md

# Waveform architecture — Phase 3

Waveform retains the buildless vanilla frontend, metadata catalogue and FastAPI boundaries established in Phase 2.5. Phase 3 adds a local persistent workspace, portable files and external searches. Prior architecture is archived in [history/PHASE_2_5.md](history/PHASE_2_5.md); scope remains defined by [ROADMAP.md](ROADMAP.md).

## Database and startup

`database/core.py` normalizes relative SQLite URLs against the project root, creates the parent directory, builds a SQLAlchemy engine and yields transactional sessions. SQLite enables foreign-key enforcement and a bounded busy timeout; the dependency rolls back errors and closes sessions. FastAPI lifespan creates the initial tables without dropping data and seeds one default profile before serving concurrent requests.

`models/workspace.py` defines:

- `profiles`: the local singleton profile, favorite/disliked genres, favorite artists, energy range, instrumental/discovery preferences and revision.
- `playlists`: UUID, title, description, ordered validated track snapshots, creation/update UTC timestamps and revision.
- `track_feedback`: one like/dislike per catalogue track; clearing removes the row. It is explicit feedback, never a simulated audio play.
- `recommendation_sessions`: reserved storage/read support for future genuine model output. Phase 3 inserts no records and exposes no fake generation endpoint.

This is the first database schema, so `create_all` bootstraps empty installations. Future schema changes need explicit migrations. The database and journal files are ignored by Git; back up SQLite while the server is stopped. Existing catalogue/audio data is unchanged. No complex authentication or multiple profiles are introduced; bind locally as documented.

## API and service separation

- `api/tracks.py` and `services/catalogue.py` retain metadata-only search, filters, pagination and detail lookups. No streaming endpoint exists.
- `schemas/workspace.py` bounds input sizes, accepts known preference enums, rejects contradictory genres/energy ranges, validates URLs/ISRCs and sanitizes artwork to local assets.
- `api/workspace.py` handles profile/feedback, playlist CRUD, import preview/export, and library retrieval using injected sessions. Updates/deletes compare revisions atomically and return 409 on stale requests. Transactions do not silently overwrite newer data.
- `services/playlists.py` normalizes source identities and removes duplicates. Only stable catalogue IDs/exact ISRCs canonicalize source metadata. Unmatched imported tracks get stable `import:` IDs and explicit provenance; artist/title similarity does not claim a match.
- `services/portable.py` is independent of database/platform access. It serializes UTF-8 CSV/TXT/JSON and parses documented formats. JSON retains complete validated metadata; CSV/TXT are portable subsets. CSV uses proper quoting and reversible spreadsheet formula/control-character escaping. Parsing has file/track bounds, malformed inputs fail without saving, and preview never mutates the database.
- `main.py` permits required local-origin GET/POST/PUT/DELETE CORS methods, exposes attachment headers, reports version 0.3.0, handles database errors as useful 503 responses, and omits raw import/preference payloads from 422 responses.

The catalogue is loaded once per backend startup. User state is queried from the database and is independent of the source JSON. Imported saved playlists store metadata snapshots, so they remain readable if catalogue coverage later changes.

## Frontend state and rendering

- `state/draft.js`: copied, duplicate-safe editor state plus saved ID/revision, dirty status and a generation counter. Session storage journals a versioned draft for refresh recovery in the same tab. Backend saves remain the durable source of saved playlists. Storage failures preserve in-memory editing and expose a recovery limitation.
- `state/workspace.js`: separately loads profile/feedback, drives a connection notice, disables unready/pending feedback actions and synchronizes successful server responses. Failed feedback is not presented as saved.
- `main.js`: existing route/search guards and shared draft actions, plus mounts for Library/Settings and delegated persistence/file controls. API failures preserve editor/form contents. Async actions guard against overwriting a different loaded/new draft.
- `pages/settings.js`: a real profile/preferences form with validation feedback; artist/genre entries are newline-separated. Successful saves update the sidebar identity; failed saves keep inputs.
- `pages/library.js`: actual saved records, explicit liked/disliked tracks, favorite artists/genres and genuine session records or their empty state. Saved playlist editing loads an existing revision; delete is a separate explicit action.
- `components/playlist-tools.js`: save/update/copy, generation/fingerprint guards for edits made during a pending save, Blob file downloads, UTF-8 import decoding/preview, explicit import replacement, and protection before opening a saved playlist/new editor over unsaved changes.
- `pages/builder.js`: retains ordered editing, summaries and shared draft state; adds save/file tools, imported-track labels, unknown duration fallback and service searches. Unknown imports do not link to non-existent catalogue detail routes.
- `components/track-actions.js` and `utils/platforms.js`: mutually exclusive Like/Dislike actions and fixed-origin encoded search links. Search links neither call an API nor claim destination IDs/availability/playlist creation.
- `api/client.js`: typed-purpose request helpers, network/timeout/validation/database messages, JSON requests and Blob responses. No secrets or third-party account tokens exist in browser configuration.
- CSS: existing design system and shell are retained; `workspace.css` adds Settings, Library, feedback, file tools and responsive styles.

An editor save snapshots the payload. If the user edits while it is pending, the returned revision is adopted but newer edits remain dirty; loading/new actions change the generation so an old response cannot bind a different draft. A saved copy gets a new UUID. Session-recovered drafts retain their binding; imported files deliberately become unsaved independent copies. Clear removes tracks but keeps editor metadata. Replacement prompts provide Cancel rather than discarding unsaved edits silently.

## Files and third-party boundaries

[FILE_FORMATS.md](FILE_FORMATS.md) documents formats, columns, versions, escaping and matching. Imports are limited to one million UTF-8 bytes and 500 tracks. No arbitrary remote URL is fetched. Imported image URLs are not loaded; untrusted metadata/title/description is escaped in HTML. Downloads are actual local files, not reported as service transfers.

Spotify/Apple Music/YouTube Music links open public search interfaces with encoded artist/title queries and safe new-tab attributes. No account credentials, OAuth scopes, private APIs or scraping are used. Any future provider architecture must verify official capabilities/permissions and remain separate from the serializer and ordered playlist state.

## Phase boundary

Preferences and explicit feedback are persisted but do not yet change catalogue ranking. A recommendation session is not fabricated from a manual draft, import or save. Phase 4 will introduce genuine feature processing, content-based recommendations and recorded recommendation sessions. Context scoring remains Phase 5; collaborative/hybrid models, Taste Insights and final integration/polish remain later phases.

---

## data/README.md

# Waveform metadata catalogue — Phase 3

## Preserved source records

The original `catalogue/tracks.json` is preserved byte-for-byte from Phase 2. It contains eight genuine Kevin MacLeod tracks, retrieved from the public [Incompetech pieces.json](https://incompetech.com/music/royalty-free/pieces.json) on 27 October 2026. Genre IDs were mapped using the [catalogue page](https://incompetech.com/music/royalty-free/music.html). Phase 2.5 repurposed those factual records for discovery and playlist drafts. Phase 3 adds saved user state in a separate local SQLite database.

| ISRC | Title | Source genre | Source duration |
| --- | --- | --- | --- |
| USUAN1500027 | Dreams Become Real | Contemporary | 6:50 |
| USUAN1100844 | Cipher | Electronica | 3:51 |
| USUAN1400037 | Carefree | Contemporary | 3:25 |
| USUAN1300010 | Local Forecast | Jazz | 2:45 |
| USUAN1400011 | Monkeys Spinning Monkeys | Soundtrack | 2:05 |
| USUAN2100030 | Space Jazz | Jazz | 6:10 |
| USUAN1100192 | Ishikari Lore | World | 2:44 |
| USUAN1100772 | Sneaky Snitch | Soundtrack | 2:17 |


## Available and missing metadata

Titles, artist, ISRC, genre, duration, source-provided tempo, instrument labels, feel tags, source upload date, credits and source URLs are available. The API also supplies the catalogue name as `dataset_source` and the ISRC as `source_identifier`.

Album, release year, energy, valence, acousticness and instrumentalness are unavailable and remain null. `source_uploaded` is an upload date, not a release date. Playlist duration is an estimate from source durations; unknown durations will be labeled rather than invented. The illustrations are original Waveform assets, not source album art.

One composer, eight tracks and five genres are adequate for exercising search/draft editing but insufficient for representative recommendation evaluation or collaborative training. Phase 3 stores explicit user preferences/feedback and saved playlists separately. No trained model, generated recommendation session or reliable platform track matching exists. Do not assume these records are on every streaming service.

## Provenance and credits

Keep attribution to Kevin MacLeod / incompetech.com and the supplied [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) license/source links with the catalogue. Individual track pages retain those credits. No additional music or cover art is downloaded during this phase.

The original JSON includes historical `audio_source_url`, `audio_sha256` and audio-use attribution wording. These remain in the original file for provenance and preservation, but public API models ignore audio fields and presented credits omit the obsolete “Audio unmodified” notice. The raw file is not exposed through an API/static route.

## Legacy audio preservation

Existing MP3 files remain untouched in ignored `data/audio/`. They are not deleted, read, indexed, served or needed by Waveform. The download script, streaming route, AUDIO_DIR setting and player were removed. The frontend static server must continue serving only `frontend/`, as documented; do not point it at the repository root.

No database or user-generated playlist file existed at the Phase 2.5 audit. Phase 3 initializes `data/waveform.db` (Git-ignored) with a local profile, saved playlists, explicit feedback, and an empty session table. The original metadata/audio files remain unchanged. Historical documentation is archived under `docs/history/`.

## Future dataset strategy

The earlier source evaluation is retained in the historical checkpoint: [FMA](https://github.com/mdeff/fma) provides metadata and feature data suitable for later content-based experiments; [HetRec Last.fm](https://lenskit.grouplens.org/datasets/hetrec-2011/) is an artist-interaction candidate for a separate collaborative experiment. Neither was imported or trained. Review their licenses and feature coverage before using them. Do not merge unaligned artist-level interactions with these track records or fabricate matches.

A broader legitimate metadata dataset and documented preprocessing are Phase 4 work. Direct platform identifiers need reliable matching; Phase 3 provides encoded external search queries and portable CSV/TXT/JSON workflows, with no direct service integration.

`raw/` and `processed/` remain reserved/ignored. There is no training catalogue or trained artifact yet.


## Phase 3 imported metadata and user state

Import previews and playlist saves resolve known IDs/exact ISRCs to canonical catalogue records. Unmatched tracks remain explicitly labeled `user_import` with stable imported IDs, unknown optional features and no claimed platform match. Imported image references are restricted to local artwork. The original catalogue manifest is never changed by imports, likes/dislikes, preferences or saved playlists.

Full JSON exports preserve validated playlist/track metadata; CSV/TXT use documented portable fields. Files do not contain profiles or account tokens. See `docs/FILE_FORMATS.md`. No preference settings or playlists are inferred from audio listening. Recommendation-session history remains genuinely empty until an engine creates output in Phase 4.
