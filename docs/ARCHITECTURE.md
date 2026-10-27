# Waveform architecture — Phase 5

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
