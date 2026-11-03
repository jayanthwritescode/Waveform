# Context suitability model

The Phase 5 context endpoint remains available. Phase 6 adds a selectable [available-signal hybrid and separate artist experiment](HYBRID_MODEL.md).

Vibe Control adds explicit moment inputs to the Phase 4 metadata model. It operates locally, without audio, location, weather services, music-platform APIs or a language model. This is an inspectable heuristic ranking system, not a classifier trained on measured mood/activity labels. Collaborative/hybrid interaction models remain Phase 6.

## Request and controls

POST `/api/recommendations/context` accepts the existing seed IDs, explicit exclusions, use-profile/include-liked controls and limit (1–30), plus:

| Field | Values |
| --- | --- |
| `context.mood` | any, calm, happy, energetic, melancholic, relaxed, focused |
| `context.activity` | any, focus, workout, relax, commute, social |
| `context.time_of_day` | any, morning, afternoon, evening, night |
| `context.weather` | any, clear, rainy, overcast, snowy |
| `context.energy_target` | null or finite 0–1 |
| `context.instrumental_preference` | any, prefer, avoid |
| `context.favorite_genres`, `favorite_artists` | Up to 20 bounded, nonempty source-label strings each |
| `context.discovery` | null (use saved preference), or finite 0–1 |
| `length_mode` | count or duration |
| `duration_minutes` | Required only in duration mode, finite 1–180 |

Unselected categorical inputs are `any`; they introduce no rule. Time and optional weather are manual choices, not inferred current conditions. Home mood links preselect Vibe Control without generating. The UI provides low/balanced/high energy presets; API requests can use intermediate targets. Recorded intermediate energy/discovery values appear as Custom choices when restored. Context exclusion lists allow 1,000 IDs to accommodate a 500-track draft plus previous results. Unknown request fields/enum values, invalid ranges and contradictory length modes return 422 without recording a session.

GET `/api/recommendations/context/model` exposes rule targets, tolerances, weights, source coverage and model version. The Phase 4 `/api/recommendations` endpoint remains a content-only comparison flow; it rejects context fields and does not apply discovery blending.

## Context rules and equations

`backend/app/recommender/context_rules.json` is the versioned configuration. Mood/activity/time/weather each specify targets for available source energy, valence, acousticness, instrumentalness and/or BPM. Examples: calm targets energy 0.2, valence 0.5 and acousticness 0.7; workout targets energy 0.9 and BPM 140. These associations are product heuristics, not properties independently measured for each recording. They do not assert what a person will feel or how a track sounds.

A known feature `x` contributes target proximity:

`proximity = exp(-0.5 × ((x - target) / tolerance)^2)`

Tolerances are 0.35 for energy/valence, 0.4 for acousticness/instrumentalness and 45 for BPM. Values come from the feature index's cleaned source matrix. Invalid/nonfinite/out-of-range data stays unavailable; no values are inferred from titles or artwork. Normalized target features may be constant across a small fixture and still valid for explicit target comparison; unlike content-distance scaling, target comparison uses raw observed values.

Rule targets each have weight 1. Explicit moment energy and instrumental choices have weight 2 and replace corresponding energy/instrumental targets from all mood/activity/time/weather rules. Preferred moment genres and artists each have weight 2 and score exact normalized source-label matches as 1/0. These are soft boosts, not hard filters. Artist spelling variants and genre aliases are not invented. Saved profile preferences still supply the separate base signal when enabled, so moment choices replace heuristic targets without silently rewriting the profile.

Context score is the sum of known weighted proximities divided by the total requested target weight. Unavailable targets contribute no observed score and remain explicitly listed as unknown. This is an evidence coverage penalty: equivalently, the weighted mean of available target scores is multiplied by available/requested target weight. It prevents a track with only BPM from claiming a full fit for a moment requiring energy, valence and instrumentalness. It is not a missing-feature imputation or a confidence probability. If all requested features are missing, the context block is omitted entirely. Per-track `context_signals` show their requested-normalized weights and contributions; those weights can sum below 1. Their contributions sum to the context block's value. `context_coverage` reports that weight coverage.

## Taste, discovery and final ranking

The existing content engine produces all eligible candidates from explicit seeds, recent likes and saved preferences. Explicit seeds/exclusions, dislikes and disliked source genres remain hard exclusions when their respective controls apply. Moment genre/artist choices do not override saved dislikes. Include liked allows known likes back into the pool; explicit reference tracks stay excluded.

Familiarity is catalogue-relative: a liked track or an artist label from liked tracks/favorite artists. It is not inferred listening history or proof of prior exposure. At discovery setting `d`, familiar candidates receive `1-d`; others receive `d`. At 0.5 the block is omitted because it cannot distinguish candidates. No familiarity labels means no discovery score and an explicit notice. Null discovery uses the saved slider when saved taste is enabled; otherwise it uses neutral 0.5. No-profile mode never reads saved likes/favorites for this purpose. Likes are excluded by default even in familiar mode; other tracks with familiar artist labels can qualify.

Final blocks have configured weights: base content/taste 0.35, context 0.55 and discovery 0.10. Available blocks are renormalized per candidate; zero-weight blocks contribute no explanation. Top-level signal contributions sum to the final score. Base content/taste contributions and detailed context contributions are expandable separately. Context can change ranking within the same genre through source numerical features, rather than only applying genre filters.

Ties use catalogue ID order. Scores are relative ranking values, not match percentages, probabilities, model accuracy or suitability guarantees. A complete lack of positive context/taste/discovery signals retains deterministic genre/artist-balanced discovery with null scores. Unknown-score candidates may follow scored candidates if more results are needed. Empty eligible sets stay empty; exclusions are never silently relaxed.

## Length and regeneration

Count mode returns up to the requested number of unique eligible tracks. Duration mode scans final ranking order and accepts known-duration tracks that fit the remaining budget, up to the requested maximum count (at most 30). It never overshoots or splits tracks. Unknown durations are omitted in duration mode; count mode reports unknown-duration counts separately. Returned duration is an estimate based on source metadata, not measured playback.

This is a greedy budget algorithm, not an optimal knapsack or exact-duration solver. It can leave gaps even when another combination would fit better; notices report selected seconds, requested seconds, remaining gap and track cap. A budget shorter than every eligible track returns nothing and creates no session.

Regenerate with different tracks uses the current visible controls and excludes the immediately preceding result IDs in addition to current draft exclusions. It makes a real new request/session. Repeated regeneration can revisit tracks from older batches; it does not claim an infinite new sequence. Generate again uses current controls without automatically excluding the prior batch, so deterministic input can repeat. The editor changes only after Use these tracks; its unsaved-replacement guard remains in effect. Input controls are disabled during generation to avoid confusing in-flight edits. Failed requests keep prior results and editor state.

## Persistence and reproducibility

Context sessions reuse the existing table, with `kind=context-generation`. Request, explicit moment, length report, full ordered metadata/results, explanations, rule/model version, used profile features and feedback are snapshotted transactionally. Historical results remain original even after settings change; controls restore the recorded request. Generating again uses current saved taste and current exclusions. Library lists both content and context sessions and opens the corresponding page. No history is fabricated from manual drafts/imports/saves. No database schema reset/migration was required.

Version combines the context algorithm generation, rule configuration hash and existing content fingerprint. Configuration changes require restart. No additional package dependency, dataset change or trained binary is introduced.

## Validation and limits

Run `.venv/bin/python scripts/evaluate_context.py` for four real-catalogue contexts, deterministic rank sensitivity, uniqueness, contribution accounting, non-repeating alternatives and a duration ceiling. `docs/context-evaluation.json` records actual diagnostic output. Unit/API tests additionally cover same-genre sensitivity, time/weather/instrumental effects, missing/partial features, explicit overrides, discovery fallback, negative preferences, bounded inputs, persistence and context replay. Frontend tests cover zero-valued controls, multiline artists, history restoration, length constraints and escaped explanations.

These checks establish implementation correctness, not relevance accuracy. No held-out mood labels, user judgments or Precision@K/recall claims are available. Feature-complete FMA selection bias, historical features and artist-name identity limitations remain. Missing evidence can still affect comparability when other final blocks renormalize. The heuristic targets/tolerances and weights need user evaluation before claims of recommendation quality. Weather inputs do not imply meteorological or psychological accuracy. There is no collaborative training, listening analysis, live weather or public deployment in this phase.
