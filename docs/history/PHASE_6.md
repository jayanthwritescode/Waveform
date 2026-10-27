# Phase 6 checkpoint archive

---

## README.md

# Waveform

**Your music. Your moment.**

Waveform is a platform-independent music discovery and playlist project. **Phase 6 is complete:** a separate collaborative artist experiment, configurable catalogue hybrid and basic model comparison.

## Working today

- 520 genuine metadata records: eight preserved Incompetech tracks and a reproducible 512-track FMA metadata subset, covering 368 artist names and 18 primary genres.
- Available-signal hybrid with per-request weights, explicit missing collaborative track signal and recorded weight restoration. Basic content/context/hybrid comparison creates no sessions.
- Separate Artist Lab fitted on 92,834 real HetRec Last.fm user–artist relations; optional non-commercial research data, no invented track mapping.
- Vibe Control: mood, activity, manual time/optional weather, moment energy/instrumental/genre/artist preferences and catalogue-relative discovery.
- Count or duration-budget generation, visible duration gaps and alternative batches that exclude previous results.
- Recommendations from reference tracks, recent explicit likes and saved genre/artist/energy/instrumental preferences. Dislikes and explicit exclusions remove candidates.
- Real score contributions and source-based explanations; cold-start discovery has no personalized score. Generate 1–30 unique tracks, then refine/save/export through the existing editor.
- Recorded recommendation sessions reopen their original results, explanations and model version.
- Paginated catalogue search, details, local profile/feedback, persistent playlist CRUD, revision protection, CSV/TXT/JSON files and external service searches.
- Responsive midnight/lavender interface, refresh recovery and retained drafts on request failures.

Vibe Control uses documented heuristics over genuine source features. The full Recommendation Explorer and Taste Insights remain Phase 7. No audio hosting/playback or direct music-service integration is included.

## Setup and run

Use Python 3.11+ and a modern browser with native ES modules, Fetch, structuredClone, Blob downloads and File/TextDecoder APIs. Node.js is optional for frontend tests. No frontend install/build is needed, and no audio download is required.

```sh
cd /Users/jayanth/Desktop/Waveform
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements-dev.txt
```

For a fresh checkout, copy `.env.example` to `.env` if custom configuration is needed. Preserve an existing `.env`. Runtime dependencies are in `backend/requirements.txt`; `requirements-lock.txt` captures the verified versions. The model uses NumPy, Pandas, SciPy and scikit-learn; Phases 5–6 add no package dependencies. The bundled metadata subset makes first startup offline; no raw dataset download or model training is required.

Backend, terminal 1:

```sh
cd /Users/jayanth/Desktop/Waveform
.venv/bin/python -m uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```

Frontend, terminal 2:

```sh
cd /Users/jayanth/Desktop/Waveform
python3.11 -m http.server 5173 --bind 127.0.0.1 --directory frontend
```

Open [Waveform](http://127.0.0.1:5173), [Your Library](http://127.0.0.1:5173/#/library), [Settings](http://127.0.0.1:5173/#/settings), [Vibe Control](http://127.0.0.1:5173/#/vibe), [Artist Lab](http://127.0.0.1:5173/#/lab), [Recommendations](http://127.0.0.1:5173/#/recommend), or [API docs](http://127.0.0.1:8000/docs). Serve the frontend over HTTP and only from `frontend/`, outside the preserved legacy audio directory.

## Local storage and configuration

The backend loads the root `.env`, with environment variables taking precedence.

| Variable | Default | Purpose |
| --- | --- | --- |
| APP_NAME | Waveform | API name |
| APP_ENV | development | Environment label |
| CORS_ORIGINS | `["http://localhost:5173", "http://127.0.0.1:5173"]` | Allowed frontend origins; JSON array |
| DATABASE_URL | `sqlite:///./data/waveform.db` | Local workspace database; relative SQLite paths resolve from the project root |

First startup creates the initial tables and default local profile without dropping existing data. Database files are Git-ignored. Back up the SQLite file while the server is stopped; do not commit it. Existing source metadata and legacy MP3 files remain unchanged and are not served. Legacy AUDIO_DIR is ignored.

This is a single-user local app bound to loopback, with no account authentication. It is not configured for public multi-user deployment. SQLAlchemy keeps database access separate from routes; PostgreSQL needs an appropriate driver and future deployment/migration work. Phase 3 introduces the first schema using `create_all`; future schema changes require explicit migrations.

The editor's tab recovery is separate from saved playlists. It survives a reload in the same tab; closing/clearing the browser session may remove it. If session storage is unavailable, the editor reports that limitation and remains usable in memory. Save to the backend to keep a playlist. New/open/import actions distinguish replacing the editor from updating a saved playlist. Clear removes tracks but retains the current title/description.

The frontend API defaults to `http://127.0.0.1:8000`. Override with `window.WAVEFORM_API_BASE` before the module script; this browser-visible setting must not contain secrets.

## Using the app

1. In Settings, edit your profile and preferences, then Save preferences. Use one artist/genre per line; commas inside an artist name are preserved. Conflicting favorite/disliked genres or invalid energy ranges are rejected without losing the form.
2. In Discover, search/filter, select Like/Dislike, and add tracks to the draft. Clicking the active feedback again clears it.
3. In Playlist Builder, edit metadata/order and Save playlist. Open saved playlists from Your Library, then Save changes or Save a copy. Delete uses a separate disclosure and explicit delete action.
4. Download CSV/TXT/JSON from the editor or saved library. No file download is represented as a transfer to a streaming service.
5. Select a file to preview its metadata, matches and warnings. Load it explicitly as a new unsaved draft, then save if wanted. Invalid files do not replace the draft.
6. Expand Find on music services to search by artist/title without linking an account.

[FILE_FORMATS.md](docs/FILE_FORMATS.md) defines accepted file versions/columns, escaping, matching, unknown metadata and size limits. JSON retains full validated metadata; CSV/TXT retain portable fields. TXT import supports Waveform v1 exports; CSV requires Track Title and Artist. No exact platform availability is assumed.

## API

| Method/path | Behavior |
| --- | --- |
| GET `/api/health` | Status and phase 6 |
| GET `/api/tracks`, `/api/tracks/{catalogue_id}` | Metadata search/details; no audio routes |
| GET/PUT `/api/profile` | Local profile/preferences; revision required for update |
| GET `/api/feedback`; PUT `/api/feedback/{catalogue_id}` | Explicit like/dislike/null feedback |
| GET/POST `/api/playlists` | List/create saved playlists |
| GET/PUT/DELETE `/api/playlists/{id}` | Read/update/delete; updates and deletes require current revision |
| GET `/api/playlists/{id}/export?format=csv|txt|json` | Export saved playlist |
| POST `/api/playlist-export?format=csv|txt|json` | Export editor payload without saving |
| POST `/api/playlist-import` | Validate `{format, content}` and preview; no database write |
| GET `/api/recommendations/model` | Algorithm, weights, version and feature coverage |
| POST `/api/recommendations` | Generate real results and record successful nonempty sessions |
| GET `/api/recommendations/context/model` | Context rules, weights and feature coverage |
| POST `/api/recommendations/context` | Context-aware generation, count/duration control and session recording |
| GET `/api/recommendations/hybrid/model`; POST `/api/recommendations/hybrid` | Available-signal hybrid defaults/generation; optional request weights |
| POST `/api/recommendations/compare` | Same count/inputs across three catalogue models; no writes |
| GET `/api/experiments/collaborative/model`, `/artists?q=...`; POST `/api/experiments/collaborative` | Separate artist experiment; no track/session writes |
| GET `/api/recommendations/sessions/{id}` | Original result snapshot; no reranking |
| GET `/api/library` | Saved playlists, feedback, profile and real recommendation sessions |

Playlist inputs contain title, description and ordered track metadata. Imports and saves normalize catalogue identities and remove duplicates. Unknown imported records retain provenance and missing values. No arbitrary remote URLs are fetched. Input validation errors omit raw file payloads; database failures return a useful 503; stale revisions return 409 and retain the editor.

## Testing and review

```sh
cd /Users/jayanth/Desktop/Waveform
.venv/bin/python -m pytest -c backend/pytest.ini -q
node --test frontend/tests/*.test.mjs
```

**60 backend tests and 14 frontend tests pass.** Database tests use isolated temporary SQLite files, not the user's workspace. Tests cover persistence/reopen, profile validation, feedback, playlist CRUD/order/revision conflicts, all three file round trips, Unicode/multiline CSV/quotes, formula-safe CSV, empty exports, unmatched imports, malformed files, byte limits, database failures, draft identity and encoded platform searches.

Browser QA verified model comparison, custom hybrid generation/save/history, collaborative artist search/results, cold-start popularity, failure retention and responsive layouts from 320 to 1440px. Tests use isolated SQLite databases; production state is preserved. See [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md).

## Optional collaborative artist experiment

The catalogue works without the artist model. The official HetRec Last.fm data permits **non-commercial use**; its source README and commercial-use contact are documented in [HYBRID_MODEL.md](docs/HYBRID_MODEL.md). Raw data and fitted profile artifacts are ignored and not bundled in Git. To reproduce locally:

```sh
.venv/bin/python scripts/prepare_collaborative.py --download --build
.venv/bin/python scripts/evaluate_collaborative.py
```

Restart the backend after building. Artist Lab then searches/recommends source artists from 1,892 training users. It does not insert artists as tracks or map your saved profile into the experiment. Missing optional artifacts produce setup guidance while catalogue generation remains available. The tracked evaluation report measures only a fixed historical artist cohort, not track-playlist relevance.

## Content model and dataset

See [HYBRID_MODEL.md](docs/HYBRID_MODEL.md) for collaborative data, hybrid equations, model comparison and the actual held-out artist benchmark. See [CONTEXT_MODEL.md](docs/CONTEXT_MODEL.md) for Vibe Control rules, length/regeneration behavior and limitations, [RECOMMENDATION_MODEL.md](docs/RECOMMENDATION_MODEL.md) for the scoring formulas, missing-data rules, configurable weights and evaluation limits, and [data/README.md](data/README.md) for provenance, licensing and reproducible preprocessing.

```sh
.venv/bin/python scripts/evaluate_content.py
.venv/bin/python scripts/evaluate_context.py
# Optional: fetch only the three official metadata CSV members, then reproduce the subset
.venv/bin/python scripts/prepare_fma.py --download --build
```

The diagnostic script checks ranking invariants on 12 real seeds. It does not measure relevance accuracy: there are no held-out user relevance labels. FMA's metadata license is distinct from recording rights. Missing original-track features stay null. Search links do not verify destination availability.

Open Vibe Control, choose hybrid or context, optionally adjust hybrid weights, then choose a mood/activity and optional preferences, select track count or duration budget, then Generate playlist. Regenerate with different tracks excludes the immediately previous batch; Generate again uses current inputs without that extra exclusion. The separate Recommendations page still supports content-only references. Use these tracks in the editor preserves their order; save explicitly for a durable playlist. Saved profile preferences affect recommendations, while catalogue search retains its source order. Vibe Control applies familiarity/discovery to liked/favorite artist labels when available; the content-only Recommendations page keeps its Phase 4 behavior. Familiarity is not listening history.

See [roadmap](docs/ROADMAP.md), [architecture](docs/ARCHITECTURE.md) and [Phase 5 archive](docs/history/PHASE_5.md). **Stop after Phase 6 for manual review/commit.** No automated commits, pushes or Phase 7 work.

---

## PROJECT_PROGRESS.md

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

---

## docs/ARCHITECTURE.md

# Waveform architecture — Phase 6

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

---

## docs/HYBRID_MODEL.md

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
