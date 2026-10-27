# Waveform — Project progress

Last updated: 28 October 2026 (Asia/Kolkata).

## Current checkpoint

**Phase 4: Content-Based Recommendation Engine — complete, awaiting review and manual Git commit.**

User authorized Phase 4. Phase 5 has not started. No automatic commit, push, PR, deployment or destructive Git operation was performed. Starting HEAD was `c7f7c3d` with a clean working tree. The previous checkpoint is preserved in [Phase 3 history](docs/history/PHASE_3.md).

## Implemented

- Legitimate FMA metadata preprocessing: official ZIP member range download, CRC/SHA checks, streaming exact-ID join and reproducible balanced 512-record subset. Attribution, selection rules, feature source and separate metadata/recording-license scope are documented. No audio was downloaded or analyzed.
- Combined 520-track catalogue: 368 artist names, 18 primary genres; original eight records and their missing values preserved. Discover pagination, mixed-source credits and FMA detail/identity support.
- Feature engineering with genre cosine, source tag/instrument TF-IDF cosine, artist labels and shared-known robust-scaled numeric distance. Configurable validated weights and a catalogue/configuration fingerprint.
- User preference profiling from recent explicit likes, favorite genres/artists, saved energy range and instrumental preference. Dislikes and requested exclusions remove candidates; deterministic cold-start discovery has no personalized score.
- Recommendation API/model metadata, real ranked results, score contributions and source-based explanations. Unique results, bounded counts and explicit empty-result behavior.
- Basic playlist generation UI, optional reference search, draft exclusions and existing editor/save/export workflow. Failed requests retain prior results and editor contents.
- Genuine generation sessions with original metadata/result/explanation snapshots, model version and request/profile-feature/feedback snapshots. Library reopens recorded results without reranking or writing another session.
- Correctness diagnostics and regression tests, model/data documentation, refreshed dependency lock and archived prior checkpoint.

## Important files

- `scripts/prepare_fma.py`, `data/catalogue/fma.json`, `data/catalogue/fma_provenance.json` and `data/README.md`.
- `backend/app/recommender/features.py`, `engine.py`, `settings.json`; recommendation service/schema/router and catalogue/playlist normalization.
- `frontend/js/pages/recommendations.js`, `frontend/css/recommendations.css`; routing/navigation, Discover pagination, shared cards/details, API client and Library history.
- `backend/tests/test_recommender.py`, updated catalogue/health tests, `scripts/evaluate_content.py`.
- `docs/RECOMMENDATION_MODEL.md`, architecture, roadmap, file formats, README and this checkpoint.

## Validation performed

| Check | Result |
| --- | --- |
| Backend suite | **40 passed**: prior workspace regressions, feature math/missing/invalid/constant data, rank sensitivity, deterministic scores, exclusions, cold start, weight validation, API/history persistence, FMA portable round trips and dataset hash |
| Frontend suite | **10 passed**: draft correctness, identity/revision behavior, safe artwork and encoded external searches |
| Model diagnostic | **12 real seeds passed** deterministic/unique/valid-ID/seed-exclusion/bounded-score/contribution checks; output in `docs/content-evaluation.json` |
| Reproducible build | Rebuilt the subset from raw metadata and verified pinned source/output hashes |
| Browser generation | Cold-start fallback has null scores; explicit/reference-search seeds produce ranked picks and real explanations |
| Browser editor | Loaded 10 generated tracks, saved the playlist and found the exact order/metadata in Library |
| Browser history | Reopened original results without a new generation; verified model version and UTC session timestamp |
| Browser details/pagination | Verified FMA features, unknown ISRC, metadata-license label, Find similar link and next/previous catalogue pages |
| Failure retention | Stopped backend and retried generation: useful retry message; all 10 prior results and editor tracks retained |
| Responsiveness | Recommendations at 320/390/768/1024/1440px and Discover at 320/768/1440px: no horizontal overflow |
| Browser console | No warning/error logs during normal tested flows; unavailable-backend request deliberately exercised later |
| Preservation | Original source manifest, all eight legacy MP3s and production database match all 10 starting SHA-256 hashes |
| Syntax/whitespace | JavaScript syntax and `git diff --check` passed |

Browser QA used an isolated temporary SQLite database, preserving production playlists/profile/feedback/history. Screenshots show real generated QA output. Review caught and fixed a JSON dirty-tracking issue that initially omitted session ID/timestamp from stored snapshots; regression tests now inspect both returned history and persisted JSON. Test servers are stopped at completion.

## Limits and next checkpoint

No blocking Phase 4 defects are known from these checks. The index is unsupervised and the historical genre-balanced subset has selection bias. Correctness tests do not establish user relevance accuracy; there are no held-out interaction labels or invented Precision@K/recall metrics. Source numeric features and artist display-name matching have documented limits.

Context inputs, desired-duration generation and familiarity/discovery blending remain Phase 5. The discovery slider is retained but unused by this model. Collaborative/hybrid training remains Phase 6; Explorer/Insights and held-out evaluation remain Phase 7. No playback, direct platform integration, audio hosting or public multi-user deployment was added.

Existing local-only, single-user SQLite and tab-recovery limitations still apply. Files/search links do not prove destination availability or create platform playlists. FMA metadata rights do not grant recording rights. No schema change/reset was required.

Suggested manual commit: `feat: add content-based recommendations and playlist generation`

**STOP after Phase 4. Await review, manual commit and explicit Phase 5 authorization.**
