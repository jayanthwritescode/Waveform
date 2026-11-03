# Static pivot verification

Verified locally on 3 November 2026. Real browser checks used a static Node server only, never Python or the original database.

- Phase 2.5: Home, editor, save/reload and backend-free local state verified.
- Phase 3: direct browser CORS worked. Get Lucky returned 690 MusicBrainz recordings; artist-name Daft Punk search returned 2,028. Missing genre/duration values stayed unknown. No proxy was required.
- Phase 4: generated 20 real fallback tracks, reviewed explanations, replaced one and loaded the shared editor. Tests cover all 42 mood/activity combinations at 10/20/30 tracks.
- Phase 5: actual CSV, TXT and JSON downloads each contained the expected 20 tracks. CSV headers and second durations parsed correctly; JSON retained metadata/explanations. Downloaded JSON was imported through the browser file chooser and the unsaved-editor guard. Reordering, replacement, saving and actual clipboard contents were verified. Soundiiz format checked against official documentation; no third-party-account transfer was attempted.
- Phase 6: live combined-query generation produced ten MusicBrainz tracks; native mouse drag reordered two tracks. Mobile menu opened, closed on route selection and Escape, restored menu focus and made hidden links inert. Seven screens (Home, Discover, Vibe, Builder, Library, Settings, Insights) fit 320/768/1024/1440px with document width equal to viewport width; no console errors were captured. Original dark/violet design and SVG illustrations were retained.
- Current suite: 38 active JavaScript tests pass. Nine historical backend-comparison/control tests were archived with their inactive UI modules; prior larger counts are historical, not current-suite totals. New tests cover API retries/timeouts/rate spacing/cache/malformed results, candidate outages, real fallback ranking, portable formats, editor state, local CRUD/revision protection and corrupt/null/full storage. Tests inject API failures; no fake responses are labeled as live UI data.
- Preservation: all 27 original files under root `data/` match the pre-pivot SHA-256 baseline, including private database, audio and fitted artifacts. The baseline is stored outside Git at `/tmp/waveform-pivot-preservation.json`.

Offline shell caching is disabled on development port 5173 to avoid stale previews. Production build/offline reload is now verified below; external deployment verification remains unavailable. No accessibility certification or cross-browser matrix is claimed. Current browser QA is the in-app browser; secure-context Web Locks are required for live access, with fallback on unsupported clients.

## Phase 7 production checks

- `npm test`: 38 active tests passed; `npm run build` and `npm run verify` passed with zero dependencies/functions. The final artifact contains 63 public files (62 precache entries including the app root), totaling 343,587 bytes.
- `node tools/verify.mjs http://127.0.0.1:4173`: all 68 HTTP checks passed, covering public assets and six private/retired paths. CSP/security headers were active in the production browser.
- Actual production-origin browser workflow: chose mood/activity/genre, generated ten LIVE MusicBrainz tracks from combined queries, replaced one, loaded Builder, reordered, saved Late-night clarity, downloaded and parsed its ten-track CSV, opened manual Soundiiz guidance, navigated to Library and reloaded the saved playlist.
- Waited for OFFLINE DEMO READY, stopped the owned static server, confirmed the server was unavailable, reloaded the cached Library successfully and generated ten FALLBACK tracks from cached static metadata. The server was restarted for the final HTTP checks. No browser JavaScript/CSP errors were captured.
- No Vercel/Netlify account/integration was connected; no public URL was created and deployed-origin CORS was not tested. Exact manual verification is in `DEPLOYMENT.md`.
