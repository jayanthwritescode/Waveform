# Waveform architecture — Phase 7

Waveform uses a buildless vanilla JavaScript frontend and a FastAPI/SQLAlchemy SQLite backend. Phase 4 extends the persistent workspace with metadata feature processing, content recommendations and real session snapshots. The previous detailed workspace architecture is preserved in [Phase 3](history/PHASE_3.md).

## Data and model boundary

`scripts/prepare_fma.py` validates official metadata ZIP members, streams CSV preprocessing, joins exact IDs and builds the attributed deterministic FMA subset/provenance. Original Incompetech metadata and ignored audio files are preserved. `services/catalogue.py` loads both manifests, rejects duplicate IDs and presents metadata-only public schemas with origin, license scope and unknown features intact.

`recommender/features.py` constructs genre cosine, TF-IDF source metadata, artist equality and robust-scaled shared-known numerical comparisons. `recommender/engine.py` applies explicit taste/exclusions, configurable score weights, deterministic ranking and cold-start discovery. It has no database or network dependency. Startup warms one cached index. Model equations, configuration, limitations and diagnostics are documented in [RECOMMENDATION_MODEL.md](RECOMMENDATION_MODEL.md).

## Persistence and API

Existing `profiles`, `playlists`, `track_feedback` and `recommendation_sessions` tables remain unchanged. Startup creates missing tables and the local default profile without resetting existing data. Relative SQLite paths resolve from the repository root. Transactions roll back on failure; playlist/profile revisions still protect stale edits. No schema migration is required for Phase 4.

`services/recommendations.py` reads current profile and recent feedback, calls the engine, attaches canonical public metadata and records nonempty successful generation in one transaction. Session context stores request, used profile features/feedback and full result snapshot. Timestamp and session identity are assigned before serializing the snapshot. Library retrieval returns compact summaries; `api/recommendations.py` exposes model metadata, generation and original session retrieval. History does not recompute scores or write new sessions. Invalid/empty generations do not fabricate history.

`services/playlists.py` now resolves exact dataset/source-identifier pairs as well as known IDs/ISRCs, preserving FMA identity through portable formats without manufacturing ISRCs. Existing CRUD/import/export, bounded input, formula-safe CSV, local artwork sanitation and fixed-origin music search links remain intact. API version is 0.4.0; health reports phase 4.

## Frontend

`pages/recommendations.js` provides optional reference-track search, count, saved-taste/include-liked/draft-exclusion controls, generation state, real ranking explanations and model coverage. Results enter the shared editor through the existing unsaved-replacement guard. Saving remains explicit. API failures preserve draft and prior results. Historical routes fetch the recorded snapshot and label it as original output.

`main.js` parses route query parameters, supports hyphenated FMA IDs and guards stale asynchronous navigation/search responses. Discover now paginates 24 records and resets offset when filters change. Track details show true numeric source features, license scope and a Find similar action. Library links to real recorded sessions. Cards retain safe service searches and persistent feedback; routing results register visible tracks for existing draft actions.

The existing immutable draft store, tab recovery, dirty/revision checks, save-copy behavior, validation/error handling and safe HTML rendering remain shared. `recommendations.css` extends the established responsive design. Taste Insights and model comparison stay at their documented future boundaries.

## Operating boundary

Bind both servers to loopback. The app remains single-user with no authentication, no public deployment, no audio serving and no direct music-platform API calls. Source data/model features are local; recommendations require no network. Optional preprocessing downloads only public metadata from the documented official archive. Production user state is separate from datasets and isolated test databases. Back up SQLite while stopped; future schema changes require explicit migrations.

## Phase 5 context layer

`recommender/context.py` composes the unchanged content engine with `context_rules.json`. It ranks all eligible base candidates using source-feature target proximity, explicit moment labels, evidence coverage and catalogue-relative discovery. It applies a count cap or greedy duration ceiling after ranking. It does not fetch weather/location or infer musical features. GET/POST `/api/recommendations/context` model/generation routes use strict schemas and the same transactional result-snapshot service. Context sessions use a distinct kind/model version and reuse the existing table; no schema change is needed. See [CONTEXT_MODEL.md](CONTEXT_MODEL.md) for full equations and limitations.

The shared generation page renders context controls only on `#/vibe`; `moment-controls.js` handles request serialization, duration UI and recorded input restoration. Both flows reuse editor replacement guards, safe cards and score rendering. Vibe regeneration excludes the preceding result batch. Async generation disables form controls and retains old results on errors. Library routes content/context history to their corresponding page. Home mood links preselect context without auto-generating. Settings now explains the discovery slider's actual Vibe behavior. Application version is 0.5.0 and health reports phase 5. The Phase 4 content-only endpoint and model remain independently available.

## Phase 6 hybrid and artist experiment

`recommender/hybrid.py` uses the same catalogue feature index and hard exclusions, combines independent content/preference/context/discovery components on bounded [0,1] scales, and omits unavailable collaborative track evidence. Defaults live in `hybrid_weights.json`; strict request overrides are snapshotted and fingerprinted. Existing context/content engines retain their ranking output. The shared service can compute without recording for the count-only three-model comparison endpoint; generation still records nonempty snapshots transactionally with `hybrid-generation` kind. No schema change is needed.

`recommender/collaborative.py` is a separate binary-cosine user-KNN artist model. `scripts/prepare_collaborative.py` validates the official archive and builds ignored local sparse/user-profile artifacts. `api/experiments.py` lazily loads verified optional artifacts and exposes artist-only search/recommendations. Missing/corrupt models yield setup guidance/503 without disabling catalogue endpoints. It does not query the user's workspace or write sessions. There is no verified artist-to-track crosswalk. Source/provenance, algorithms, licenses and held-out benchmark are documented in [HYBRID_MODEL.md](HYBRID_MODEL.md).

Vibe Control adds model/weight selection and basic three-column comparison, keeping editor guards and error retention. `artist-lab.js` provides a clearly separated non-commercial artist flow with no track-add/export actions. Hybrid library history restores effective weights and model. Phase 7 still owns full Explorer/Insights visuals. Version is 0.6.0; no new packages, migration, deployment or audio behavior was introduced.

## Phase 7 read-only analysis and full Explorer

`services/insights.py` aggregates actual current profiles/feedback/playlist snapshots separately from UTC-windowed stored generation sessions. `api/insights.py` exposes the read-only summaries and a cached, bounded saved evaluation report. Neither endpoint records views or creates sessions; no schema changes are needed. Definitions and missing-value/window rules are in [INSIGHTS_AND_EVALUATION.md](INSIGHTS_AND_EVALUATION.md).

Explorer reuses the shared validated comparison/generation controller, with expandable controls, all requested ranks, exact-identity overlap, actual component meters and explicit guarded editor selection. `explorer-results.js` is pure rendering/overlap logic. `evaluation.js` loads independent saved artist metrics. `insights.js` and pure `analysis-charts.js` render real counts, source-energy means, SVG UTC series and equivalent accessible tables; `analysis.css` supplies responsive panels and internal table scrolling. Obsolete placeholder pages are removed.

`scripts/evaluate_models.py` performs two fixed full-eligible-user artist holdout experiments with frozen KNN settings, train-only baseline, self-exclusion, cold-target misses, standard rank metrics, profile strata and descriptive bootstrap intervals. It uses copies of ignored fitted matrices, preserving the interactive model. Only aggregate report/protocols are tracked. All catalogue ranking engines remain unchanged. Version is 0.7.0; no new packages, schema reset or deployment is introduced.
