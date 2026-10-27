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
