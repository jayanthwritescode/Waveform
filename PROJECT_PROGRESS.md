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
