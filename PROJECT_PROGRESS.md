# Waveform — Project progress

Last updated: 28 October 2026 (Asia/Kolkata).

## Current checkpoint

**Phase 6 — collaborative experiment and available-signal hybrid: complete, awaiting review and manual Git commit.**

The user authorized Phase 6. Phase 7 has not started. Starting HEAD was `d153718`, with a clean tree. No automatic commit, push, PR, deployment, destructive Git operation or schema reset was performed. The prior checkpoint is archived in [Phase 5 history](docs/history/PHASE_5.md).

## Implemented

- Evaluated the official HetRec Last.fm interaction dataset and source usage terms. It is a non-commercial, artist-level dataset with no verified mapping to the 520-track catalogue. It remains a separate research experiment; no artist-name crosswalk or fabricated collaborative track score is used.
- Reproducible pinned-archive preparation and fitting: 1,892 users, 17,632 artists and 92,834 positive relations. Binary cosine user-neighborhood filtering uses up to 40 neighbors and two-neighbor support. Raw/fitted profile artifacts stay ignored; tracked provenance captures source hashes, actual counts and scope.
- Artist Lab provides source artist search, reference selection, real artist recommendations and supporting profile counts. Empty/no-overlap/insufficient-support queries get labeled train-popularity fallback with null personalized scores. It never adds artists as songs or writes track sessions.
- Catalogue hybrid independently combines normalized content, preferences, context and discovery using configurable defaults/request weights. Unavailable collaborative track evidence is explicitly omitted, with available weights renormalized. Cold-start and collaborative-only configurations remain unscored where no usable signal exists.
- Same-input/count content/context/hybrid comparison API and basic Vibe comparison view, without recording sessions or replacing the editor. Full Explorer visualization remains Phase 7.
- Hybrid generation retains duration bounds, dislikes/exclusions, regeneration and editor/save/export workflows. Effective weights, model version and original output are saved/reopened as actual hybrid sessions.
- Strict validation, optional model/setup/error handling, actual held-out artist benchmark, new unit/API/frontend tests and current documentation. No new runtime dependency, dataset mutation or migration was required.

## Important files

- `recommender/collaborative.py`, `hybrid.py`, `hybrid_weights.json`; strict request schemas, recommendation service/router and separate `api/experiments.py`.
- `scripts/prepare_collaborative.py`, `evaluate_collaborative.py`, `data/catalogue/lastfm_provenance.json`, `docs/collaborative-evaluation.json`.
- `frontend/js/pages/hybrid-controls.js`, `artist-lab.js`, generation/comparison/history integration, routing and responsive CSS.
- `backend/tests/test_collaborative.py`, `test_hybrid.py`, frontend hybrid controls test, health version check.
- [Hybrid/collaborative model documentation](docs/HYBRID_MODEL.md), README/run/setup instructions, architecture, roadmap, data notes and prior checkpoint archive.

## Validation actually performed

| Check | Result |
| --- | --- |
| Backend suite | **60 passed**: previous regressions plus hand-computable neighbor support, seed exclusions, self-retrieval prevention, popularity/empty/unknown fallbacks, absent optional model, hybrid weight sensitivity/contributions, disabled explanations, duration/exclusions, saved weights and no-write comparison |
| Frontend suite | **14 passed**: draft/platform/moment regressions plus custom/zero hybrid weight serialization and restoration |
| Prior diagnostics | All 12 content seed outputs and all four Phase 5 context diagnostic outputs match the committed reports exactly |
| Actual held-out artist benchmark | 1,877 deterministic holdouts; 90,957 train relations; fixed 100-user cohort, query users excluded from neighbors. KNN hits@10 **29/100**, NDCG@10 **0.1664**; train-popularity **10/100**, NDCG@10 **0.0504**; 242 distinct recommended artists, zero fallback users |
| Browser comparison | Same count/inputs returned content fallback versus scored context/hybrid; explicitly reports no session writes or accuracy metric |
| Browser hybrid save/history | Generated with context-only custom weights, saved four real tracks, reopened the original session with model and all five exact weights restored |
| Browser artist experiment | Selected Radiohead from real source search; returned Muse/Beatles/other artist neighbors with real weighted support and dataset model version |
| Browser cold start | Cleared the reference; result switched to labeled training popularity with no personalized score |
| Browser failure | Stopped backend; artist request kept ten previous artist results and showed a retry message |
| Responsive QA | Vibe custom hybrid/result/comparison and Artist Lab at 320, 390, 768 and 1440px: no horizontal overflow |
| Browser console | No warnings/errors in normal checked flows; unavailable-network request deliberately exercised separately |
| Integrity | Original/FMA manifests, FMA provenance, eight legacy MP3s and production SQLite file match all 12 starting hashes |
| Syntax/whitespace | All JavaScript modules parse; Git whitespace check passes |

Browser QA uses a temporary SQLite database. Production profile, feedback, playlists and historical sessions remain unchanged. Review screenshot shows actual artist experiment results. Test servers are stopped at completion.

## Scope and limits

No blocking Phase 6 defects are known from these checks. Collaborative evidence remains artist-only. The hybrid correctly falls back to available track signals and does not claim fully integrated collaborative filtering. Training matrix preparation is genuine neighborhood-model fitting, not matrix factorization/ALS.

The artist source is licensed for non-commercial use; raw/model artifacts are optional and ignored, with setup instructions for fresh checkouts. The benchmark is a small fixed historical cohort, one held-out positive per eligible user, no negatives or temporal split. Its metrics do not establish playlist relevance, general superiority, statistical significance or a tuned production model. Unobserved does not mean disliked.

Hybrid component scales are bounded by construction, with per-candidate availability renormalization. Defaults are starting values, not tuned accuracy claims. Missing context evidence and discovery limitations remain documented. Existing local-only single-user SQLite, tab recovery, metadata-only export/search and duration-greedy limitations still apply. No audio playback, direct streaming integration, multi-user deployment, Explorer analytics or Taste Insights were added.

**Next:** Phase 7 — full Recommendation Explorer, genuine interaction/context/playlist insights and broader reproducible evaluation. Await explicit authorization.

Suggested manual commit: `feat: add collaborative artist experiment and configurable hybrid recommendations`

**STOP after Phase 6. Await review, manual commit and explicit Phase 7 authorization.**
