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
