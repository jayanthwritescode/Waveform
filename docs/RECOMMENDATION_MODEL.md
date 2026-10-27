# Content-only recommendation model

This endpoint retains Phase 4 behavior. Phase 5 adds a separate [Vibe Control context layer](CONTEXT_MODEL.md) with moment scoring, discovery blending and count/duration controls.

This is an unsupervised metadata similarity index, fitted at API startup. It is not a supervised relevance predictor or a collaborative model. No audio is read, and titles/artwork are not used to guess features.

## Features and similarity

The catalogue combines eight preserved Incompetech records with 512 attributed FMA records. Source genre labels are case/whitespace normalized, multi-hot encoded and L2 normalized. Their dot product is cosine similarity. Source tags and instrument labels receive prefixed tokens, TF-IDF weighting and cosine similarity using scikit-learn. Artist similarity is an exact normalized display-name match; aliases and spelling variants are not silently merged.

Numerical columns are duration, BPM, energy, valence, acousticness and instrumentalness. Pandas coerces invalid/nonfinite/out-of-bounds values to internal NaN. Each column is scaled between its catalogue 5th and 95th percentiles and clipped to [0,1]. Constant/all-missing columns are excluded. Original API nulls remain null. A pair compares only shared known, active columns:

`numeric_similarity = exp(-4 × mean((scaled_seed - scaled_candidate)^2))`

Content similarity is the weighted mean of available genre (0.40), metadata (0.25), artist (0.10) and numerical (0.25) blocks. Absent blocks are omitted and weights renormalized per pair. With multiple seeds, available pair similarities are averaged. Explicit seeds take precedence; otherwise the most recently updated 50 known likes supply seeds. Requests allow up to five explicit seeds.

## Saved taste and ranking

Explicit favorite genres match any source genre label (weight 0.40); favorite artists match the normalized artist label (0.25). A restricted energy range scores `1 - distance to the range`, clipped to [0,1] (0.20). Instrumental preference uses source instrumentalness for prefer, or `1 - instrumentalness` for avoid (0.15). Unset preferences and unavailable values are omitted, with remaining weights renormalized. Preferences never impute unknown source values.

The final score combines available content similarity (0.65) and preference score (0.35), again renormalizing available weights. Per-result signal values, normalized weights and contributions reproduce the score. Explanations identify real shared metadata, the closest seed and nearby source numerical values. They describe only nonzero-weight signals. The closest seed explains one comparison, while the content score averages all usable seeds.

Explicit reference tracks and requested exclusions are removed. With saved taste enabled, disliked tracks and any disliked source genre are removed; likes are omitted unless Include liked is selected. A liked seed may return when Include liked is enabled, whereas an explicit reference is always excluded. Results have unique catalogue identities, deterministic ID tie breaks and no repeats to fill short requests. Missing-score candidates can follow scored candidates when needed; their score remains null.

No positive usable signal triggers deterministic genre round-robin discovery, preferring new artists within each genre when possible. These results have null scores and explicit fallback labels. Empty candidate sets return no tracks and create no session. Scores are relative ranking values, not probabilities, accuracy or match percentages.

The familiarity/discovery slider is stored but unused, with a notice for nondefault values. Mood, activity, time, weather and desired duration do not affect Phase 4. Unsupported request fields are rejected. Context-aware generation belongs to Phase 5.

## Configuration, API and history

`backend/app/recommender/settings.json` contains weights, numerical gamma and liked-seed cap. Settings require finite nonnegative weights with the documented keys and positive sums. Restart after changing them. The model version fingerprints catalogue rows and settings; no trained binary is required.

- GET `/api/recommendations/model`: feature coverage, counts, weights and version.
- POST `/api/recommendations`: `{seed_ids, exclude_ids, use_profile, include_liked, limit}`; limit is 1–30. Generates once and records a nonempty successful result.
- GET `/api/recommendations/sessions/{id}`: original ordered result/metadata/score/explanation snapshot, even after preferences change. Does not rerank or create a session.

Sessions reuse the existing table and store request/profile-feature/feedback snapshots with a UUID and UTC timestamp. No schema reset or migration is needed. Manual editing/import/save actions are not recommendation sessions. The library returns compact summaries; full result snapshots are fetched individually.

## Evaluation and limits

Run `.venv/bin/python scripts/evaluate_content.py` for 12 reproducible real-seed neighbor diagnostics: valid IDs, uniqueness, seed exclusion, finite bounded scores and contribution accounting. Backend tests also check cosine properties, missing/constant/invalid values, cold start, profile sensitivity, exclusions, configuration and persisted sessions. These are correctness diagnostics, not measured relevance accuracy. No held-out user labels, Precision@K, recall or fabricated performance claims are reported.

The FMA subset is genre-balanced by construction, contains historical independent music and favors feature-complete records. It is not representative of all music or a popularity sample. Display-name identity can conflate artists; standardized source features can be imperfect. Global numeric scaling and heuristic weights have not been tuned against user judgments. Collaborative/hybrid training, held-out evaluation, context scoring and model comparisons remain later phases.

Implementation references: [scikit-learn TF-IDF](https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.TfidfVectorizer.html), [cosine similarity](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.pairwise.cosine_similarity.html), [FMA source](https://github.com/mdeff/fma).
