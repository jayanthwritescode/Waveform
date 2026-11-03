# Phase 7 checkpoint archive

---

## README.md

# Waveform

**Your music. Your moment.**

Waveform is a platform-independent music discovery and playlist project. **Phase 7 is complete:** full Recommendation Explorer, genuine Taste Insights and reproducible multi-split artist evaluation.

## Working today

- 520 genuine metadata records: eight preserved Incompetech tracks and a reproducible 512-track FMA metadata subset, covering 368 artist names and 18 primary genres.
- Recommendation Explorer: full rankings, overlap/rank offsets, contribution charts, editor selection and a saved evaluation panel.
- Taste Insights: actual current likes/playlists and windowed generation/mood/activity/model statistics, with honest empty/missing values.
- Available-signal hybrid with per-request weights, explicit missing collaborative track signal and recorded weight restoration. Basic content/context/hybrid comparison creates no sessions.
- Separate Artist Lab fitted on 92,834 real HetRec Last.fm user–artist relations; optional non-commercial research data, no invented track mapping.
- Vibe Control: mood, activity, manual time/optional weather, moment energy/instrumental/genre/artist preferences and catalogue-relative discovery.
- Count or duration-budget generation, visible duration gaps and alternative batches that exclude previous results.
- Recommendations from reference tracks, recent explicit likes and saved genre/artist/energy/instrumental preferences. Dislikes and explicit exclusions remove candidates.
- Real score contributions and source-based explanations; cold-start discovery has no personalized score. Generate 1–30 unique tracks, then refine/save/export through the existing editor.
- Recorded recommendation sessions reopen their original results, explanations and model version.
- Paginated catalogue search, details, local profile/feedback, persistent playlist CRUD, revision protection, CSV/TXT/JSON files and external service searches.
- Responsive midnight/lavender interface, refresh recovery and retained drafts on request failures.

Vibe Control uses documented heuristics over genuine source features. Explorer statistics are descriptive; held-out artist metrics remain separate from track quality. No audio hosting/playback or direct music-service integration is included.

## Setup and run

Use Python 3.11+ and a modern browser with native ES modules, Fetch, structuredClone, Blob downloads and File/TextDecoder APIs. Node.js is optional for frontend tests. No frontend install/build is needed, and no audio download is required.

```sh
cd /Users/jayanth/Desktop/Waveform
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements-dev.txt
```

For a fresh checkout, copy `.env.example` to `.env` if custom configuration is needed. Preserve an existing `.env`. Runtime dependencies are in `backend/requirements.txt`; `requirements-lock.txt` captures the verified versions. The model uses NumPy, Pandas, SciPy and scikit-learn; Phases 5–7 add no package dependencies. The bundled metadata subset makes first startup offline; no raw dataset download or model training is required.

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

Open [Waveform](http://127.0.0.1:5173), [Your Library](http://127.0.0.1:5173/#/library), [Settings](http://127.0.0.1:5173/#/settings), [Vibe Control](http://127.0.0.1:5173/#/vibe), [Artist Lab](http://127.0.0.1:5173/#/lab), [Explorer](http://127.0.0.1:5173/#/explorer), [Taste Insights](http://127.0.0.1:5173/#/insights), [Recommendations](http://127.0.0.1:5173/#/recommend), or [API docs](http://127.0.0.1:8000/docs). Serve the frontend over HTTP and only from `frontend/`, outside the preserved legacy audio directory.

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
| GET `/api/health` | Status and phase 7 |
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
| GET `/api/insights?days=30` (7, 30 or 90) | Read-only current-state summaries and windowed UTC generation statistics |
| GET `/api/evaluation` | Saved, aggregate artist benchmark report; no training |
| GET `/api/library` | Saved playlists, feedback, profile and real recommendation sessions |

Playlist inputs contain title, description and ordered track metadata. Imports and saves normalize catalogue identities and remove duplicates. Unknown imported records retain provenance and missing values. No arbitrary remote URLs are fetched. Input validation errors omit raw file payloads; database failures return a useful 503; stale revisions return 409 and retain the editor.

## Testing and review

```sh
cd /Users/jayanth/Desktop/Waveform
.venv/bin/python -m pytest -c backend/pytest.ini -q
node --test frontend/tests/*.test.mjs
```

**67 backend tests and 19 frontend tests pass.** Database tests use isolated temporary SQLite files, not the user's workspace. Tests cover persistence/reopen, profile validation, feedback, playlist CRUD/order/revision conflicts, all three file round trips, Unicode/multiline CSV/quotes, formula-safe CSV, empty exports, unmatched imports, malformed files, byte limits, database failures, draft identity and encoded platform searches.

Browser QA verified empty/populated Insights, real generation/feedback/save totals, full comparison and explicit editor selection, UTC filtering, accessible count tables, report display, failure retention and responsive layouts from 320 to 1440px. Tests use isolated SQLite databases; production state is preserved. See [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md).

## Explorer and Taste Insights

[INSIGHTS_AND_EVALUATION.md](docs/INSIGHTS_AND_EVALUATION.md) defines all denominators, UTC windows, rank overlap and evaluation protocols. Compare shows full ranked sets without recording sessions. Use a model's tracks explicitly loads an unsaved editor selection; Save is still required. Generate separately records genuine nonempty results.

Taste Insights separates current likes/playlists from recorded generations in the selected window. Refresh after changing state. It never infers listening time, plays or mood. Missing source features remain unknown.

```sh
.venv/bin/python scripts/evaluate_models.py > docs/evaluation-report.json
```

The committed report displays offline without optional artist artifacts. Reproduction evaluates all 1,877 eligible source users in two fixed splits with train-only features, self-exclusion and descriptive bootstrap intervals. These are historical artist metrics; catalogue relevance metrics remain unavailable. Restart after replacing the saved report.

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

See [roadmap](docs/ROADMAP.md), [architecture](docs/ARCHITECTURE.md) and [Phase 6 archive](docs/history/PHASE_6.md). **Stop after Phase 7 for manual review/commit.** No automated commits, pushes or Phase 8 work.

---

## PROJECT_PROGRESS.md

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

---

## docs/ARCHITECTURE.md

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

---

## docs/INSIGHTS_AND_EVALUATION.md

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
