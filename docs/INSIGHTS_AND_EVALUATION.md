# Phase 7: Explorer, Taste Insights and evaluation

Phase 7 adds full live catalogue model comparison, descriptive statistics from actual persisted state and a broader reproducible artist benchmark. It adds no audio tracking, inferred listening, fabricated interactions or database schema changes.

## Recommendation Explorer

`#/explorer` reuses the validated generation controls and the read-only `/api/recommendations/compare` endpoint. Context and hybrid settings are expandable; comparisons use track-count mode to keep the same request count, seed/profile/exclusion inputs across content, context and hybrid. Existing duration-budget generation remains available through the explicit Generate action, while Compare asks for count mode.

Every returned track is shown for every model, with actual score contributions, source reasons, context target details and omitted hybrid signals. Contributions are normalized ranking components, not compatibility percentages. Fallbacks stay unscored. A track's other-model rank is displayed only if it occurs in that returned set; otherwise it is labeled outside the returned set. This does not assert a rank beyond the response boundary. Rank offsets are other-model rank minus the current rank; positive means a worse position in the other result.

Overlap uses exact track identities: shared count, union count and Jaccard = intersection / union. If both sets are empty, Jaccard is undefined, not a fabricated perfect match. Artist-label/primary-genre counts describe diversity of this response, not relevance. Model scores have different contributing signals, so their numerical magnitudes are not cross-model accuracy comparisons.

Use a model's tracks in the editor explicitly loads the whole ordered returned selection through the existing unsaved-change guard. This action creates an unsaved draft, not a recommendation session. Save remains explicit. Compare does not write sessions. Generate uses the existing generation endpoint and records a genuine nonempty session. The editor is not automatically replaced by a comparison or generation. Changing inputs clears the comparison, and failed requests preserve the last completed result. The basic five-result Vibe comparison remains available.

Artist-level collaborative data has no verified track mapping. Explorer links to the separate Artist Lab and labels collaborative track evidence unavailable. It does not manufacture collaborative track rankings. The saved evaluation panel reads `/api/evaluation`, independent of live comparison; report failure does not disable live catalogue comparison.

## Taste Insights definitions

GET `/api/insights?days=7|30|90` is read-only. It does not seed a profile, create sessions or record page visits. Existing app startup/profile behavior is unchanged. Scope is explicit:

| View | Denominator/source |
| --- | --- |
| Saved playlist/track totals | Current saved records, not past save actions. Track occurrences count again across playlists; unique identities count stable catalogue/import IDs once. |
| Current likes/dislikes | Current feedback rows, not a history of toggles. Clearing/replacing feedback changes these totals. Unresolvable catalogue IDs are counted and disclosed. |
| Stated taste | Current saved favorite genre/artist labels and energy range, shown separately from track-derived summaries. Default unrestricted settings are not an inferred preference. |
| Liked genres/artists/energy | Current known catalogue metadata for current liked tracks. Unresolved/unknown energy values are missing, never zero-imputed. |
| Saved genres/artists/energy | Stored playlist track snapshots, including imported metadata. Counts and means use track occurrences. Missing genres are Unknown. |
| Playlist duration | Sum of known stored durations with unknown-duration count. It is a metadata estimate, never listening time. |
| Generation/mood/activity/model charts | Actual stored sessions within the chosen UTC-day window. Comparison, artist, import and save requests are not sessions. Mood/activity `any` values are omitted from selection counts. |
| Model use | Snapshot model name where recorded, with legacy session label fallback. Fallback-generation count is reported separately. |
| Daily chart | All selected UTC calendar days, including genuine zero-count days. Daily count table provides the same values. |

The window includes the current UTC day and preceding `days-1` days, from midnight inclusive to the next midnight exclusive. The UI states UTC and shows the exact displayed boundaries. Current feedback/playlist totals are not filtered by that generation window. All-time generation count is separate. Historical sessions outside the window are not counted as recent mood selections. Reopening a session or viewing Insights does not increase counts.

Energy means include only known valid [0,1] values and show known/missing denominators. No samples produces a no-samples label; all-unknown data remains unknown. Charts show the top ten labels when more exist and disclose that limit. Empty states contain no sample distributions or fictional trend lines. Failed refreshes keep previous data and its displayed window label, with an explicit retry message. Refresh reads current state; deleting a playlist or clearing a like is reflected on the next refresh/navigation. No listening duration, play count, mood inference or hidden profile model is introduced.

## Broader artist evaluation

The Phase 6 non-commercial HetRec data/model is reused without mutation. Run:

```sh
.venv/bin/python scripts/evaluate_models.py > docs/evaluation-report.json
```

The script evaluates **all 1,877 source users with at least five positive artist relations**, in two fixed SHA-256 split schemes (`waveform-phase7-a`, `waveform-phase7-b`). Each split holds out one positive artist per eligible user before fitting any training features. Each has 90,957 train relations. All eligible users are evaluated, rather than selecting the earlier 100-user cohort. The query user's row is excluded from neighbor retrieval and from the train-popularity baseline's user counts; known training artists are excluded from returned rankings. Neighbor count 40 and minimum support 2 remain frozen from Phase 6, with no tuning on these holdouts.

Precision@10 = hit / 10, including short/empty rankings; recall@10 = hit because there is one held-out positive; NDCG@10 = 1/log2(rank+1) for a hit; MRR@10 = 1/rank for a hit. Misses, including targets absent from all training profiles, count as zero. Candidate coverage is distinct recommended artist IDs divided by artists present in training. Profile-size strata expose different observed-profile lengths. These are artist metrics only.

| Split | Users | Cold held-out targets | User-KNN recall@10 | Popularity recall@10 |
| --- | --- | --- | --- | --- |
| a | 1,877 | 213 | 0.1865 | 0.0645 |
| b | 1,877 | 212 | 0.1721 | 0.0677 |

The full report includes all metric values, training/model/source fingerprints, coverage, fallback counts and profile groups. Five hundred fixed-seed user-bootstrap resamples per model/split give descriptive percentile 95% intervals. Splits reuse the same users and are not independent replication samples; do not pool them as 3,754 independent people. Intervals do not account for dataset/split/selection bias and are not significance tests. The earlier Phase 6 100-user metrics remain archived and are not silently replaced or claimed as general accuracy.

The script fits only copies of the matrix; the full-data interactive Artist Lab model is preserved. The saved report is tracked as aggregate evidence and served with a size/version check. The UI never launches training. Fresh checkouts can display the committed report without optional raw/model artifacts; reproducing it requires the documented non-commercial dataset preparation, then a backend restart to refresh the report cache.

There are no held-out track judgments or aligned track interactions. Content/context/hybrid relevance metrics are therefore unavailable; Explorer's overlap/diversity/contribution checks do not stand in for them. Other limits: historical selection-biased artist data, no temporal split or explicit negatives, no randomized user judgments, no hyperparameter selection study or broad population inference. Unobserved artists are not labeled disliked. These results support a reproducible local experiment, not a claim of production playlist suitability.

## Validation and boundaries

Backend tests cover current-state versus session denominators, missing energy, reversible feedback, UTC boundaries, legacy records, no-write reads/comparisons, report failure independence and hand-calculated ranking metrics. Frontend tests cover identity overlap, empty-set division, real contributions, escaped labels, empty charts and daily count accessibility. Browser QA uses an isolated database and genuine actions to check both empty/populated states, comparison-to-editor/save, filter/refresh, report display, failure retention and mobile layouts.

Phase 8 remains for final integration/polish/deployment work. No automatic commit, push, deployment, playback, account linking or public multi-user support is added here.
