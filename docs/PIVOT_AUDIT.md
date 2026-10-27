# Phase 2.5 repository audit and migration

## Verified before editing

- Git working tree was clean. Most recent commit: `8625bfc` (`feat: implement music catalogue`). No uncommitted user work needed reconciliation.
- Phase 1 and 2 source files were inventoried and their README, progress, architecture, data notes, tests and relevant implementation read.
- Baseline validation: 15 backend tests and 5 frontend tests passed before refactoring.
- Frontend: buildless HTML/CSS, vanilla ES modules, hash router, reusable cards, debounced Fetch search and typed API metadata.
- Backend: FastAPI health, catalogue list/detail and GET/HEAD audio routes; separated catalogue service and Pydantic schemas. Database URL and SQLAlchemy dependency exist, but there are no database models, database files, profiles, playlists or listening-history records.
- Catalogue: eight genuine, credited Kevin MacLeod records. One composer and five source genres. Album, release year and standardized energy/valence/acousticness/instrumentalness are unavailable. Source upload date is not release year. No recommendation model or external platform matching exists.
- Playback-specific implementation: one Audio element, queue/history/repeat/shuffle policy, media controls/styles/icons, availability checks, local streaming endpoint, download utility and audio-only tests.
- A hash snapshot was taken of the original catalogue manifest and all eight local MP3 files before editing.

## Retain

The dark/lavender design system, brand, responsive shell, reusable components, catalogue illustrations/metadata, search/filters, loading/empty/error states, health/API client boundaries, configuration, SQLAlchemy and database URL. Keep source/licensing attribution and null missing features.

## Modify

Use the tagline **Your music. Your moment.** Replace playback actions with add/remove draft actions. Add Playlist Builder navigation and rename Listening Insights to Taste Insights. Keep the old `#/playlists` URL as a builder alias and the `#/insights` URL with its revised name.

Use a frontend-only observable draft store with copied metadata snapshots, duplicate prevention, editable title/description, ordered selection, accessible move controls, summaries and clear. Cards, details, editor and optional dock share this store. The dock only appears when tracks are selected. Refresh clears the draft, as disclosed in the builder.

The API returns metadata, dataset provenance, source identifiers and unknown release year instead of audio availability/URLs. Health reports phase 2.5. The original manifest is unchanged; legacy audio URLs/checksums remain preserved in it but are ignored by the public metadata model. Its historical “Audio unmodified” notice is omitted from the presented attribution.

## Remove

Delete playback-exclusive JavaScript, queue policy, player CSS, transport icons/styles, media element creation, streaming endpoint, file availability checks, downloader, AUDIO_DIR setting/example and audio-only tests. There were no standalone audio packages to uninstall. Retain general HTTP and backend dependencies.

## Migration risks and handling

- Audio API fields and routes are intentionally removed; old playback clients must migrate. The OpenAPI schema now exposes only health and catalogue list/detail routes. Tests verify streaming is unavailable.
- Existing MP3 files remain in ignored `data/audio/`, unmodified, unserved and unused. No local data or user-generated files are deleted. The original manifest remains byte-for-byte intact. No database migration is needed because no database exists.
- A pre-pivot documentation snapshot is preserved in `docs/history/PHASE_2.md`. Runtime instructions are updated in the root README; history is explicitly labeled obsolete.
- Drafts survive internal navigation but do not survive refresh/tab closure. Persistent playlists, likes/dislikes, feedback, CSV/TXT/JSON export and external platform search links belong to revised Phase 3.
- Mood links and the “Generate Your Playlist” CTA lead to an honest Vibe Control explanation. Automatic generation begins in Phase 4, with context scoring in Phase 5. No model outputs or percentages are simulated.
- The small, single-composer catalogue is a metadata scaffold, not an adequate representative recommendation benchmark. ISRC is available, but platform-specific IDs and reliable cross-platform matches are not. No destination URLs or transfer success are invented.
