# Phase 6: Collaborative experiment and available-signal hybrid

Phase 6 adds a real collaborative artist experiment, an independently configurable hybrid for catalogue tracks and basic comparisons. It does not claim an integrated collaborative track recommender. The original 520-track dataset has no verified common item identifiers with the artist interaction dataset. Exact display-name equality is not accepted as an identity crosswalk, and no artist-to-track score projection is performed.

## Official interaction data and license

[GroupLens HetRec 2011](https://lenskit.grouplens.org/datasets/hetrec-2011/) distributes the [Last.fm archive](https://files.grouplens.org/datasets/hetrec2011/hetrec2011-lastfm-2k.zip). The source [README](https://files.grouplens.org/datasets/hetrec2011/hetrec2011-lastfm-readme.txt) permits non-commercial use and directs commercial users to Last.fm. This is a local research experiment. The recording catalogue's CC BY metadata license does not apply to these interaction data. No commercial deployment rights are asserted.

Attribution: Last.fm; dataset built by Ignacio Fernández-Tobías with Iván Cantador and Alejandro Bellogín, Universidad Autónoma de Madrid. Workshop citation: Cantador, Brusilovsky and Kuflik, 2nd Workshop on Information Heterogeneity and Fusion in Recommender Systems, RecSys 2011.

`scripts/prepare_collaborative.py --download --build` downloads the bounded 2.5 MB official ZIP and validates its pinned SHA-256 (`6738f48195667ff03caaab4d32ca9a3133d8cc026b7c3cdaf6ce1010e913c59c`). Only three explicit members are read with ZIP CRC checks: artists, user–artist interactions and README. Artist/interaction tables are UTF-8; README is Latin-1. No generic extraction, images, friends or tags are used. Positive counts are binarized; duplicate user–artist pairs or nonpositive source counts fail preparation.

The resulting matrix has **1,892 users × 17,632 artists and 92,834 positive relations**. Fitted full-data artifacts and raw data remain ignored in `data/processed/lastfm/` and `data/raw/lastfm/`. They are optional and are not bundled/redistributed in Git. `data/catalogue/lastfm_provenance.json` records source/member hashes, transformation, real counts, usage boundary and model version. It is a provenance file, not a track catalogue supplement. Fresh checkouts keep all catalogue features working without the optional artist model.

## Collaborative model

`recommender/collaborative.py` implements binary cosine user-neighborhood filtering:

1. Each training user's positive artist vector is L2 normalized.
2. An anonymous query profile contains the selected artist IDs with equal positive weight and is L2 normalized.
3. Cosine similarity selects up to 40 positive-similarity training profiles, with source user-ID tie breaks.
4. Candidate artist score is the similarity-weighted sum of binary neighbor interactions divided by the sum of selected neighbor similarities.
5. At least two selected neighbors must support an artist. Seed/excluded artists are removed; scores tie-break by artist ID.

Scores lie in [0,1] and describe weighted neighbor support, not probability of liking an artist. Source listening counts are deliberately not interpreted as negative feedback or confidence calibrated to the current user. There is no latent-factor or ALS training claim: fitting prepares the genuine user–artist matrix and normalized neighbor index.

No seeds, no overlapping training profiles or insufficient supported candidates trigger a clearly labeled train-popularity fallback with null personalized scores. Unknown source IDs return 422. Excluding every candidate returns an empty result. Cold/unobserved artists never receive invented interaction evidence. Popularity counts distinct positive training users, not global Last.fm popularity. The experiment uses source IDs, never playlist track IDs. No local profile, likes or playlist is automatically mapped or sent to it.

`#/lab` provides source artist search, up to five selected references in the UI (API permits 20), real neighbor results and supporting profile counts. Results remain artist-only: there is no Add to playlist or fabricated track metadata. Artist requests do not create track recommendation sessions or listening events. The lab is linked from Vibe Control. Optional artifacts load lazily; missing/corrupt artifacts return an unavailable status/useful 503 while catalogue generation stays operational. Restart after building artifacts.

## Track hybrid and normalized signals

`recommender/hybrid.py` keeps catalogue identity and hard exclusions from the existing content engine, then independently combines:

| Component | Starting weight | Scale and availability |
| --- | --- | --- |
| content | 0.25 | Mean shared-known content similarity, [0,1]; needs usable seeds |
| preference | 0.25 | Existing explicit saved-preference score, [0,1]; unset/missing preference features omitted |
| context | 0.30 | Source-feature target proximity with Phase 5 evidence coverage, [0,1] |
| discovery | 0.10 | Catalogue-relative familiarity boost, [0,1]; neutral setting/no known artist labels omitted |
| collaborative | 0.10 | Unavailable for tracks: zero verified artist-to-track mappings |

These are analytically bounded scales; there is no batch min/max transformation that changes scores when unrelated candidates are added. Valid available zero values remain zero signals. Positive configured weights are normalized per candidate over available components only. The top-level contributions reproduce the final score. Per-track unavailable signals, context coverage and nearest seed facts are exposed. Explanations describe enabled contributors only; context details retain the actual requested-normalized target contributions.

The collaborative weight never substitutes a fake zero or artist match; it is omitted and remaining weights renormalized. With only unavailable collaborative weight enabled, no usable score exists: output is deterministic balanced discovery with null scores. Empty eligible sets stay empty. Setting all weights to zero or using negative/nonfinite/out-of-range/unknown weights returns 422. Defaults are in `hybrid_weights.json`; request overrides are bounded by the same schema and stored with results. Weights are starting values, not tuned relevance claims. Request-specific weights get their own model-version suffix and effective weights are included in model/result metadata.

Hybrid generation retains count limits, no-overshoot greedy duration budgets, dislikes, explicit seed/draft exclusions, regeneration and editor replacement/save/export behavior. Its separate `hybrid-generation` session snapshots request, effective weights, ordered tracks, actual contributions/explanations and model version. Reopening restores the selected model and recorded weights without reranking. Existing Phase 4 content and Phase 5 context endpoints preserve their independent behavior.

## API and basic comparison

- GET `/api/recommendations/hybrid/model`: defaults, version, signal normalization and explicit unavailable collaborative mapping status.
- POST `/api/recommendations/hybrid`: context/count/duration request plus optional `weights`; records nonempty successful track results.
- POST `/api/recommendations/compare`: same seed/profile/exclusion/count inputs through content, context and hybrid. Count mode is required. Returns all requested results; UI shows the first five per model. It does not write sessions, replace the editor or measure relevance accuracy.
- GET `/api/experiments/collaborative/model`: optional model availability, source, license and matrix counts.
- GET `/api/experiments/collaborative/artists?q=...`: bounded source-label search.
- POST `/api/experiments/collaborative`: `{seed_ids, exclude_ids, limit}` using positive integer source artist IDs. No current-user or source-user selection endpoint exists.

Vibe Control chooses context or hybrid and exposes hybrid weight inputs. Comparisons clear when inputs change; generation still requires an explicit editor action. Both flows preserve previous results on errors and lock inputs during requests. Full Explorer visualization, model analytics and Taste Insights remain Phase 7.

## Actual evaluation and practical limits

`.venv/bin/python scripts/evaluate_collaborative.py` evaluates a deterministic split of the real interactions. One SHA-256-selected positive artist is held out for every user with at least five positives (1,877 users), leaving **90,957 training relations**. A fixed independent SHA-256 cohort selects 100 of those users. Train-only matrix/features/popularity are used; the query user is excluded from neighbor retrieval and the popularity baseline's user count. Known training artists are excluded from recommendations. No holdout is used for fitting or tuning.

The committed aggregate report records **29/100 hits at 10**, NDCG@10 **0.1664**, versus train-popularity **10/100 hits**, NDCG@10 **0.0504**, with no fallback users and 242 distinct recommended artists. With one held-out positive per user, hit rate equals recall@10 for this protocol. These numbers apply only to this fixed historical artist cohort. They do not establish track-playlist relevance or general superiority. There are no explicit negatives, temporal split, statistical significance claims, hyperparameter search or broad train/validation/test study. Unobserved artists are not assumed disliked. Full representative evaluation is future work.

Tests check hand-computable cosine/co-occurrence support, seed exclusion, minimum support, self-retrieval prevention, unknown IDs, popularity/empty fallbacks, optional-model failure, hybrid weight sensitivity, bounded contribution accounting, zero-weight explanations, duration/exclusion invariants, persisted weights and no-write comparisons. Existing suites and 12-seed content/four-context diagnostics protect prior behavior. The current app remains a local single-user prototype; no schema migration, new runtime package or public deployment is introduced.

Phase 7 now provides the full Explorer, Taste Insights and a broader two-split full-cohort artist evaluation. See [INSIGHTS_AND_EVALUATION.md](INSIGHTS_AND_EVALUATION.md). The earlier fixed 100-user results above retain their original protocol and scope.
