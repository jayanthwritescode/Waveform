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
