# Waveform — Project progress

Last updated: 28 October 2026 (Asia/Kolkata).

## Current checkpoint

**Phase 7 — Recommendation Explorer, Taste Insights and reproducible evaluation: complete, awaiting review and manual Git commit.**

The user authorized Phase 7. Phase 8 has not started. Starting HEAD was `2d83e50` with a clean tree. No automatic commit, push, PR, deployment, destructive Git operation, new dependency or schema reset was performed. The previous checkpoint is archived in [Phase 6 history](docs/history/PHASE_6.md).

## Implemented

- Full Recommendation Explorer replaces the placeholder, reusing validated common inputs and the existing read-only comparison endpoint. It shows all requested ranks, exact-ID overlap/Jaccard, other-model rank offsets, response artist/genre diversity, actual contribution meters and source explanations.
- Explicit model-result selection loads the shared editor through its replacement guard. Comparison and selection create no generation sessions; explicit Generate still records actual nonempty output and Save remains separate.
- Taste Insights replaces its placeholder with current playlist/feedback totals, explicit saved preferences, liked/saved source metadata distributions, known/missing energy means and playlist duration estimates. These are saved-state properties, not inferred listening.
- Windowed UTC generation counts, explicit recorded moods/activities, snapshot model use, fallback counts and daily charts/count tables use genuine stored sessions. Empty states and unknown features are labeled. Current state and windowed session denominators are visibly distinct.
- Read-only `/api/insights` and `/api/evaluation`, independent report-error behavior, stale-response guards, refresh failure retention, safe source-label rendering and responsive internally scrolling tables.
- Broader held-out artist evaluation uses all 1,877 eligible source users in two fixed splits, train-only features/popularity, self-exclusion, cold-target misses, precision/recall/NDCG/MRR, coverage, profile groups and descriptive bootstrap intervals. The saved aggregate report displays independently of optional model artifacts.
- Existing catalogue ranking engines and the fitted Artist Lab model remain unchanged. No collaborative track mapping or track relevance metric is fabricated. Obsolete placeholder code is removed.

## Important files

- `backend/app/services/insights.py`, `api/insights.py`: real persisted-state summaries and bounded/cached saved evaluation report.
- `frontend/js/pages/insights.js`, `analysis-charts.js`, `explorer-results.js`, `evaluation.js`, shared generation controller and route integration; `frontend/css/analysis.css`.
- `scripts/evaluate_models.py`, actual `docs/evaluation-report.json` and [definitions/protocols](docs/INSIGHTS_AND_EVALUATION.md).
- `backend/tests/test_insights.py`; frontend chart/Explorer tests; version/health and API helpers.
- README/run instructions, architecture, roadmap, Phase 6 archive, checkpoint and real QA review screenshots.

## Validation actually performed

| Check | Result |
| --- | --- |
| Backend suite | **67 passed**: existing regressions plus true empty/current-state summaries, source/missing energy, distinct occurrence/identity denominators, reversible feedback, actual-session versus comparison counts, UTC boundaries, legacy sessions, no-write reads, independent report failure and hand-calculated ranking metrics |
| Frontend suite | **19 passed**: prior behavior plus exact-identity overlap/empty union, escaped source labels, actual contributions, empty charts and accessible daily-count tables |
| Full artist benchmark | Both fixed splits evaluate all **1,877** eligible users with **90,957** training relations. User-KNN recall@10 **0.1865 / 0.1721**; train-popularity **0.0645 / 0.0677**; **213 / 212** held-out targets absent from training remain misses |
| Reproduction | Re-ran the full benchmark; parsed aggregate report matches exactly, including bootstrap intervals, coverage and profile groups |
| Browser empty state | Fresh temporary database showed zero genuine totals, no sample charts, unknown/no-sample feature labels and no fabricated history |
| Browser genuine actions | Generated one real hybrid session, liked one result, explicitly selected three compared tracks and saved one playlist; Insights showed exactly 1 generation, 1 like, 1 playlist and 3 saved occurrences |
| Browser Explorer | Full rank lists, ID overlap/Jaccard, outside-returned-set labels, contribution details and explicit guarded model selection worked. Comparisons and editor selection did not inflate session totals |
| Browser time windows | Selected seven UTC days; displayed boundaries/daily counts changed while current saved-state totals remained distinct |
| Report UI | Both saved splits, standard metrics, intervals, cold targets, coverage, profile groups and limits displayed independently of live comparison |
| Failure retention | With backend stopped, failed comparison kept all three completed model columns; failed Insights refresh kept its populated figures and displayed window, with an actionable retry message |
| Responsive QA | Both populated Insights and Explorer/results/report at **320, 390, 768, 1024 and 1440px**, no horizontal overflow; evaluation tables scroll within their panels |
| Browser console | No warnings/errors during normal tested flows. Unavailable-network requests were deliberately exercised separately |
| Preservation | Original/FMA metadata, provenance, eight legacy MP3s, production SQLite database and fitted artist artifacts match all starting hashes |
| Syntax/whitespace | All JavaScript modules parse; `git diff --check` passes |

Browser QA uses a separate temporary SQLite database. Production preferences, feedback, playlists and sessions are preserved. Screenshots show genuine QA state with a clearly named Phase 7 playlist, not fabricated user activity. Test servers are stopped at completion.

## Limits and next phase

No blocking Phase 7 defects are known from these checks. Insights describe current rows/snapshots and actual generation sessions, not a complete event log. Feedback clears and playlist deletions change current totals. UTC windows apply only to generations, not current preferences/playlists. Imported metadata contributes only as explicitly labeled saved snapshot data. No audio play count, listening time or mood inference is collected.

Explorer overlap/diversity is descriptive, and model score magnitudes are not comparable accuracy estimates. Comparisons use count mode; duration remains a separate generation control. Collaborative artist data has no verified track mapping, so track relevance metrics remain unavailable. Separate artist metrics are historical, non-commercial, positive-only, non-temporal and selection-biased. Two splits reuse users; bootstrap intervals are descriptive and cannot be pooled as independent population evidence. Weights/neighbor settings remain frozen rather than tuned on holdouts.

Existing local-only single-user SQLite, tab recovery, metadata-only export/search and greedy-duration limitations remain. No streaming integration, playback, multi-user public deployment or Phase 8 polish/deployment work was added.

**Next:** Phase 8 — final integration/export reliability, accessibility/responsiveness/performance review, integration checks, documentation and deployment decisions. Await explicit authorization.

Suggested manual commit: `feat: add recommendation explorer taste insights and reproducible evaluation`

**STOP after Phase 7. Await review, manual commit and explicit Phase 8 authorization.**
