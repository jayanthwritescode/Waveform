# Phase 5 checkpoint archive

---

## README.md

# Waveform

**Your music. Your moment.**

Waveform is a platform-independent music discovery and playlist project. **Phase 5 is complete:** Vibe Control adds explicit context-aware ranking, duration budgets, regeneration and contextual explanations.

## Working today

- 520 genuine metadata records: eight preserved Incompetech tracks and a reproducible 512-track FMA metadata subset, covering 368 artist names and 18 primary genres.
- Vibe Control: mood, activity, manual time/optional weather, moment energy/instrumental/genre/artist preferences and catalogue-relative discovery.
- Count or duration-budget generation, visible duration gaps and alternative batches that exclude previous results.
- Recommendations from reference tracks, recent explicit likes and saved genre/artist/energy/instrumental preferences. Dislikes and explicit exclusions remove candidates.
- Real score contributions and source-based explanations; cold-start discovery has no personalized score. Generate 1–30 unique tracks, then refine/save/export through the existing editor.
- Recorded recommendation sessions reopen their original results, explanations and model version.
- Paginated catalogue search, details, local profile/feedback, persistent playlist CRUD, revision protection, CSV/TXT/JSON files and external service searches.
- Responsive midnight/lavender interface, refresh recovery and retained drafts on request failures.

Vibe Control uses documented heuristics over genuine source features. Collaborative models, Explorer comparisons and Taste Insights remain later phases. No audio hosting/playback or direct music-service integration is included.

## Setup and run

Use Python 3.11+ and a modern browser with native ES modules, Fetch, structuredClone, Blob downloads and File/TextDecoder APIs. Node.js is optional for frontend tests. No frontend install/build is needed, and no audio download is required.

```sh
cd /Users/jayanth/Desktop/Waveform
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements-dev.txt
```

For a fresh checkout, copy `.env.example` to `.env` if custom configuration is needed. Preserve an existing `.env`. Runtime dependencies are in `backend/requirements.txt`; `requirements-lock.txt` captures the verified versions. The model uses NumPy, Pandas, SciPy and scikit-learn; Phase 5 adds no dependencies. The bundled metadata subset makes first startup offline; no raw dataset download or model training is required.

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

Open [Waveform](http://127.0.0.1:5173), [Your Library](http://127.0.0.1:5173/#/library), [Settings](http://127.0.0.1:5173/#/settings), [Vibe Control](http://127.0.0.1:5173/#/vibe), [Recommendations](http://127.0.0.1:5173/#/recommend), or [API docs](http://127.0.0.1:8000/docs). Serve the frontend over HTTP and only from `frontend/`, outside the preserved legacy audio directory.

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
| GET `/api/health` | Status and phase 5 |
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
| GET `/api/recommendations/sessions/{id}` | Original result snapshot; no reranking |
| GET `/api/library` | Saved playlists, feedback, profile and real recommendation sessions |

Playlist inputs contain title, description and ordered track metadata. Imports and saves normalize catalogue identities and remove duplicates. Unknown imported records retain provenance and missing values. No arbitrary remote URLs are fetched. Input validation errors omit raw file payloads; database failures return a useful 503; stale revisions return 409 and retain the editor.

## Testing and review

```sh
cd /Users/jayanth/Desktop/Waveform
.venv/bin/python -m pytest -c backend/pytest.ini -q
node --test frontend/tests/*.test.mjs
```

**50 backend tests and 13 frontend tests pass.** Database tests use isolated temporary SQLite files, not the user's workspace. Tests cover persistence/reopen, profile validation, feedback, playlist CRUD/order/revision conflicts, all three file round trips, Unicode/multiline CSV/quotes, formula-safe CSV, empty exports, unmatched imports, malformed files, byte limits, database failures, draft identity and encoded platform searches.

Browser QA verified context-sensitive ranking, alternatives, duration budget, generated playlist saving, recorded context/length restoration, failure retention and responsive layouts from 320 to 1440px. Tests use isolated SQLite databases; production state is preserved. See [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md).

## Content model and dataset

See [CONTEXT_MODEL.md](docs/CONTEXT_MODEL.md) for Vibe Control rules, length/regeneration behavior and limitations. [RECOMMENDATION_MODEL.md](docs/RECOMMENDATION_MODEL.md) for the scoring formulas, missing-data rules, configurable weights and evaluation limits, and [data/README.md](data/README.md) for provenance, licensing and reproducible preprocessing.

```sh
.venv/bin/python scripts/evaluate_content.py
.venv/bin/python scripts/evaluate_context.py
# Optional: fetch only the three official metadata CSV members, then reproduce the subset
.venv/bin/python scripts/prepare_fma.py --download --build
```

The diagnostic script checks ranking invariants on 12 real seeds. It does not measure relevance accuracy: there are no held-out user relevance labels. FMA's metadata license is distinct from recording rights. Missing original-track features stay null. Search links do not verify destination availability.

Open Vibe Control, choose a mood/activity and optional preferences, select track count or duration budget, then Generate playlist. Regenerate with different tracks excludes the immediately previous batch; Generate again uses current inputs without that extra exclusion. The separate Recommendations page still supports content-only references. Use these tracks in the editor preserves their order; save explicitly for a durable playlist. Saved profile preferences affect recommendations, while catalogue search retains its source order. Vibe Control applies familiarity/discovery to liked/favorite artist labels when available; the content-only Recommendations page keeps its Phase 4 behavior. Familiarity is not listening history.

See [roadmap](docs/ROADMAP.md), [architecture](docs/ARCHITECTURE.md) and [Phase 4 archive](docs/history/PHASE_4.md). **Stop after Phase 5 for manual review/commit.** No automated commits, pushes or Phase 6 work.

---

## PROJECT_PROGRESS.md

# Waveform — Project progress

Last updated: 28 October 2026 (Asia/Kolkata).

## Current checkpoint

**Phase 5: Context-Aware Playlist Generation — complete, awaiting review and manual Git commit.**

The user authorized Phase 5. Phase 6 has not started. No automatic commit, push, PR, deployment or destructive Git operation was performed. Starting HEAD was `dbc1624` with a clean working tree. Prior checkpoint documentation is archived in [Phase 4 history](docs/history/PHASE_4.md).

## Implemented

- Functional Vibe Control replaces its placeholder: mood/activity, optional manual time/weather, moment energy and instrumental choices, preferred genre/artist labels, familiarity/discovery and count/duration controls.
- Context suitability changes ranking using actual source energy, valence, acousticness, instrumentalness and BPM. Configurable versioned target/tolerance rules are explicitly labeled heuristics, not measured mood/activity labels or trained suitability predictions.
- Evidence coverage reduces the context contribution when requested features are missing. Source values remain unknown; explanations identify omitted features and actual weighted contributions. Explicit energy/instrumental choices replace corresponding inferred rule targets.
- Existing content/taste ranking combines with context and catalogue-relative discovery. Familiarity uses likes/favorite artist labels, not listening history. Missing familiarity signals produce a notice and omit that block. Saved dislikes and explicit exclusions are never silently relaxed.
- Duration-budget generation respects an upper ceiling, reports remaining gaps and omits unknown-duration tracks. Count mode retains unique bounded results. Regeneration excludes the immediately preceding batch and current draft selections.
- Shared editor/save/export integration retains replacement guards and explicit saves. Generation locks controls while pending; failures retain input, prior results and draft.
- Actual context generation snapshots store input context, length, ordered results, explanations and model version. Library routes content/context sessions to the right page, restoring recorded controls without reranking or creating another session.
- Home mood links preselect Vibe Control; Settings describes discovery's implemented behavior. Phase 4 content-only endpoint remains independently available and unchanged in rank output.

## Important files

- `backend/app/recommender/context.py` and `context_rules.json`: context features, coverage, discovery, final ranking and length selection.
- `schemas/recommendation.py`, `api/recommendations.py`, `services/recommendations.py`: strict context/length schema, model/generation routes and transactional session snapshots.
- `frontend/js/pages/moment-controls.js`, `recommendations.js`, shared CSS, routing, home/settings/library and API client.
- `backend/tests/test_context.py`, `frontend/tests/moment-controls.test.mjs`, `scripts/evaluate_context.py` and actual `docs/context-evaluation.json`.
- [Context model](docs/CONTEXT_MODEL.md), README/run instructions, architecture, roadmap, prior checkpoint archive and this report. No package or dataset changes were needed.

## Validation performed

| Check | Result |
| --- | --- |
| Backend suite | **50 passed**: existing regressions plus same-genre context sensitivity, mood/activity/time/weather/instrumental effects, explicit override, discovery/fallback, duration bounds, partial/missing evidence, hard exclusions, validation, recorded context and alternatives |
| Frontend suite | **13 passed**: existing draft/platform behavior plus zero-valued controls, comma/newline labels, context/length restoration and escaped contribution labels |
| Real-catalogue context diagnostic | **4 contexts passed** determinism, ranking sensitivity, valid unique results, score accounting, alternative-batch exclusion and duration ceiling; actual report in `docs/context-evaluation.json` |
| Phase 4 regression diagnostic | All **12 content seeds** produce exactly the same diagnostic report/model version as the committed Phase 4 report |
| Browser ranking | Calm focus/rainy night and energetic workout returned distinct real record sets |
| Browser alternatives | Regenerated workout batch contained no IDs from the immediately preceding batch |
| Browser duration | 12-minute budget with 4-track cap returned **686 seconds (11:26)**, a 34-second gap and no overshoot |
| Browser editor/save | Loaded the context selection, saved a 4-track QA playlist and found it in Library |
| Browser history | Original four IDs, energetic/workout context, 12-minute duration mode and 4-track cap restored; opening history created no new session |
| Failure retention | With backend stopped, generation retained 4 results, 4 draft tracks, context and length; actionable error appeared and controls re-enabled |
| Responsive layout | Vibe form/results at **320, 390, 768, 1024 and 1440px**, no horizontal overflow |
| Browser console | No warning/error logs in normal tested flows; failed network request was deliberately exercised separately |
| Preservation | Original/FMA manifests, provenance, eight legacy MP3s and production SQLite database match all starting hashes |
| Syntax/whitespace | All JavaScript modules parse; `git diff --check` passes |

Browser QA uses a separate temporary SQLite database. Production preferences, playlists, feedback and history are preserved. The review screenshot shows actual recorded QA recommendations. Review identified and corrected partial-feature ranking bias: BPM-only records initially competed as if they satisfied a richer context. Coverage weighting and a regression test now expose and reduce that contribution. Test servers are stopped at completion.

## Limits and next phase

No blocking Phase 5 defects are known from the checks above. Rules/tolerances/weights are documented product heuristics; no relevance accuracy or psychological suitability is established. The historical feature-complete FMA subset and artist-display-name identity retain their selection/source limitations. Context score coverage is not a probability. Final blocks renormalize available evidence, which can still affect cross-record comparability.

Time/weather are explicit manual inputs; no live services, geolocation or listening data are accessed. Duration selection is greedy ranking order with a ceiling, not exact-fit optimization. Unknown durations are omitted in duration mode. Regeneration excludes only the immediately preceding batch and current exclusions, so older batches can recur. Generation/editing is metadata-only; files/search links do not verify streaming-platform availability.

No collaborative or interaction-data hybrid training, Explorer comparison, Taste Insights, playback, direct platform integration or public multi-user deployment was added. Existing local single-user SQLite/tab-recovery limitations remain. No schema reset/migration or dependency change was required.

**Next:** Phase 6 — appropriate interaction data and collaborative/hybrid modeling, preserving dataset alignment and honest benchmark boundaries. Do not begin without authorization.

Suggested manual commit: `feat: add context-aware Vibe Control and playlist regeneration`

**STOP after Phase 5. Await review, manual commit and explicit Phase 6 authorization.**

---

## docs/ARCHITECTURE.md

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

---

## docs/CONTEXT_MODEL.md

# Phase 5: Vibe Control and context suitability

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
