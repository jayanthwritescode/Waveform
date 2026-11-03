# Waveform static pivot — progress

Updated 3 November 2026. Branch: `waveform-static-pivot`, remote: `https://github.com/jayanthwritescode/Waveform.git`.

The simplified architecture brief supersedes the former Phase 8 Render deployment. It authorizes automatic phase commits and pushes through static Phase 7. Prior progress and unfinished work are preserved under `legacy/`. No paid resources will be created.

## Phase 2.5 — architectural pivot

Implemented the frontend data-service boundary, normalized track model, versioned local workspace/profile/feedback/playlists and retained editor. Preserved styles, shell, illustrations and useful pages. Historical backend/deployment tooling moved to `legacy/`; root source data/private database remain untouched. Navigation omits Artist Lab and backend model comparisons. Static Node development server serves only `frontend/`. No Python/database/authentication is required.

Validation: 23 JavaScript tests passed; static browser verification confirmed Home, editor, local save and reload recovery with no console errors. No Python process was started. Live catalogue and contextual ranking intentionally follow in later phases.

Phase 2.5 checkpoint: `a26b594`, pushed successfully to `origin/waveform-static-pivot`.

## Phase 3 — live music discovery

Added official MusicBrainz recording and artist adapters, source normalization, literal query escaping, debounced search, genre queries, serial requests with a cross-tab Web Lock held for at least 1.1 seconds, bounded retry/timeout/Retry-After handling, 24-hour cache and explicit source states. A 208-record attributed fallback uses preserved genuine metadata. Missing metadata stays unknown. No artwork enrichment, audio or proxy is needed.

Validation: 28 JavaScript tests pass, including rate spacing, cache, 429/503/cooldown, malformed replies, abort, timeout and missing fields. Actual browser search for Get Lucky returned 690 MusicBrainz results with no CORS errors; browser fetch binding was corrected during this check. Artist searches also use the same browser endpoint. Vercel/Netlify deployed-origin verification remains for Phase 7.

Phase 3 checkpoint: `46fdefb`, pushed successfully to `origin/waveform-static-pivot`. Actual artist-name search for Daft Punk returned 2,028 source recordings.

## Phase 4 — contextual recommendation engine

Implemented configurable six-mood/seven-activity mappings, combined live candidate searches, 35/25/20/10/10 scoring with missing-weight redistribution, source-based explanations, explicit preferences/exclusions, editorial energy proxies, conservative recording/version deduplication, artist/genre diversification, 10/20/30 selection, shortfalls, seeded regeneration and reserve replacement. Vibe Control reuses existing panels and cards; generated playlists load into the retained editor through its unsaved-change guard. Last ten genuine generation snapshots and last settings remain local.

Validation: 34 JavaScript tests pass, including all 42 mood/activity combinations at all three lengths using the genuine fallback, deterministic ordering, preference effects, score sums, artist limits, versions, exclusions, outage candidates and replacement. Browser QA generated 20 real fallback tracks, verified explanations, replaced a track from reserve and loaded the editor. Fixed the discovered genre-chip input hit area before completion. See `docs/RECOMMENDATION_MODEL.md`.

Phase 4 checkpoint: `d4f04d6`, pushed successfully to `origin/waveform-static-pivot`.

## Phase 5 — playlist builder and export

Added editor reserve replacement, drag ordering with existing keyboard up/down controls, context retention, local named saves, UTF-8 CSV/TXT/full JSON downloads, file preview/import (including old JSON v1 migration), clipboard fallback, encoded service searches and documented manual Soundiiz guidance. No OAuth/account connection or simulated transfer is included.

Validation: 40 JavaScript tests pass. Actual browser downloads each contained 20 tracks; CSV had exact title/artist/album/isrc/duration headers and seconds, TXT had 20 Artist - Title lines, JSON retained stable IDs and explanations. Actual downloaded JSON was selected through the file picker, previewed and loaded through the dirty-editor guard. Browser replacement, button reordering, local save and clipboard contents were verified. CSV/TXT parser tests cover quoting, Unicode, formula protection, unknowns, malformed files and limits. Official Soundiiz format/import instructions verified; no third-party account transfer was attempted.
