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
