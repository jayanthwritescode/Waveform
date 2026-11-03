# Static pivot roadmap

The 3 November 2026 simplified-architecture brief supersedes the historical full-stack/Render roadmap. It authorizes automatic phase commits and pushes on `waveform-static-pivot`; no force pushes or main-branch rewrites.

| Phase | Completed scope |
| --- | --- |
| 2.5 | Audit, preserved design/data/history, static data service, normalized tracks, local draft/profile/playlists, inactive backend archive |
| 3 | Official MusicBrainz searches, real browser CORS, rate queue/cache/retry/timeout, normalization and verified fallback |
| 4 | Mood/activity mappings, combined candidates, weighted browser scoring/explanations, diversity/version/artist limits, variation/reserve |
| 5 | Editing, drag/keyboard order, local saves/recovery, CSV/TXT/JSON, imports/clipboard, service searches/manual transfer |
| 6 | Responsive visual polish, mobile focus, source/error/empty/loading states, storage recovery, local Insights and offline shell |
| 7 | Static build/allowlist, Vercel/Netlify configs, production browser/HTTP/offline verification, final docs/repository review |

All implementation phases are complete locally. Public deployment/deployed-origin CORS is unverified because no destination account was connected. No paid hosting resources or OAuth integrations were created. Historical milestones/research results remain under `docs/history/` and `legacy/`.
