# Revised Waveform roadmap

**Product:** context-aware music discovery, recommendation and playlist generation.
**Tagline:** Your music. Your moment.
**Journey:** Choose Context → Generate Recommendations → Refine Playlist → Save or Export.

Waveform does not host or stream music. It operates independently of music-platform APIs. Every phase stops for user review and a manual GitHub commit; never automatically commit, push or begin the next phase.

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Foundation and design system | Completed under original roadmap |
| 2 | Catalogue and functional player | Completed under original roadmap; metadata retained, player retired |
| 2.5 | Product pivot: remove playback, retain discovery, add frontend playlist draft/editor/dock, update architecture and tests | Complete |
| 3 | Local profile; favorite genres/artists; likes/dislikes; persistent playlist CRUD; CSV/TXT/JSON import/export; Spotify/Apple Music/YouTube Music track search links; previous recommendation sessions where actual sessions exist | Complete; awaiting review |
| 4 | Legitimate dataset preprocessing, feature engineering, content similarity, preference profiles, recommendation API, basic playlist generation, explanations and evaluation tests | Not started |
| 5 | Vibe Control: moods, activities, energy/instrumental/genre/artist preferences, desired length, familiarity/discovery, time and optional weather; context-aware ranking, length controls, regeneration and honest explanations | Not started |
| 6 | Appropriate interaction data, collaborative model or separate benchmark when unaligned, normalized hybrid signals, cold start, configurable weights and model comparison | Not started |
| 7 | Recommendation Explorer, Taste Insights, actual feedback/context/playlist statistics, held-out evaluation and reproducible metrics | Not started |
| 8 | Finalize portable exports/search workflows, consider permitted official direct integrations, matching reliability, design/responsiveness/accessibility/performance, integration tests, documentation and deployment | Not started |

## Export and platform boundaries

- Mandatory portable formats in Phase 3: UTF-8 CSV with correct escaping, human-readable TXT, and JSON preserving playlist metadata. Include known titles, artists, album, duration, ISRC and source identifiers. Do not claim every platform directly imports these files.
- Mandatory external searches in Phase 3: encoded artist/title queries opening Spotify, Apple Music and YouTube Music search interfaces; no invented song-specific IDs or account linking required.
- Optional direct integration: verify current official API capabilities, developer access, authorization/scopes, restrictions, rate limits, matching and playlist creation support before implementing any provider. No undocumented scraping/private endpoints. Confirm success from the destination before reporting a transfer.
- Phase 3 implements portable files and fixed-origin external search links. Direct provider integration remains optional future work, separate from playlist state and serialization.

## Data and measurement boundaries

Use actual metadata and available/derived, documented features. Never invent missing values or claim collaborative training without sufficient interactions. Do not silently align incompatible datasets. Context must influence ranking beyond genre filtering when Phase 5 is implemented. Use real score contributions for explanations; no fabricated match percentages.

Record future explicit feedback, saves and recommendation interactions without presenting them as audio plays or listening time. Optional imported listening data must remain identified by its source. Do not fabricate sessions or analytics.
