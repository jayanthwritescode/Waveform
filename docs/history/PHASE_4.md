# Phase 4 checkpoint archive

---

## README.md

# Waveform

**Your music. Your moment.**

Waveform is a platform-independent music discovery and playlist project. **Phase 4 is complete:** content-based recommendations, saved taste, explainable ranking and basic playlist generation.

## Working today

- 520 genuine metadata records: eight preserved Incompetech tracks and a reproducible 512-track FMA metadata subset, covering 368 artist names and 18 primary genres.
- Recommendations from reference tracks, recent explicit likes and saved genre/artist/energy/instrumental preferences. Dislikes and explicit exclusions remove candidates.
- Real score contributions and source-based explanations; cold-start discovery has no personalized score. Generate 1–30 unique tracks, then refine/save/export through the existing editor.
- Recorded recommendation sessions reopen their original results, explanations and model version.
- Paginated catalogue search, details, local profile/feedback, persistent playlist CRUD, revision protection, CSV/TXT/JSON files and external service searches.
- Responsive midnight/lavender interface, refresh recovery and retained drafts on request failures.

Context scoring and Vibe Control remain Phase 5. Collaborative models, Explorer comparisons and Taste Insights remain later phases. No audio hosting/playback or direct music-service integration is included.

## Setup and run

Use Python 3.11+ and a modern browser with native ES modules, Fetch, structuredClone, Blob downloads and File/TextDecoder APIs. Node.js is optional for frontend tests. No frontend install/build is needed, and no audio download is required.

```sh
cd /Users/jayanth/Desktop/Waveform
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements-dev.txt
```

For a fresh checkout, copy `.env.example` to `.env` if custom configuration is needed. Preserve an existing `.env`. Runtime dependencies are in `backend/requirements.txt`; `requirements-lock.txt` captures the verified versions. Phase 4 adds NumPy, Pandas, SciPy and scikit-learn. The bundled metadata subset makes first startup offline; no raw dataset download or model training is required.

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

Open [Waveform](http://127.0.0.1:5173), [Your Library](http://127.0.0.1:5173/#/library), [Settings](http://127.0.0.1:5173/#/settings), [Recommendations](http://127.0.0.1:5173/#/recommend), or [API docs](http://127.0.0.1:8000/docs). Serve the frontend over HTTP and only from `frontend/`, outside the preserved legacy audio directory.

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
| GET `/api/health` | Status and phase 4 |
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
| GET `/api/recommendations/sessions/{id}` | Original result snapshot; no reranking |
| GET `/api/library` | Saved playlists, feedback, profile and real recommendation sessions |

Playlist inputs contain title, description and ordered track metadata. Imports and saves normalize catalogue identities and remove duplicates. Unknown imported records retain provenance and missing values. No arbitrary remote URLs are fetched. Input validation errors omit raw file payloads; database failures return a useful 503; stale revisions return 409 and retain the editor.

## Testing and review

```sh
cd /Users/jayanth/Desktop/Waveform
.venv/bin/python -m pytest -c backend/pytest.ini -q
node --test frontend/tests/*.test.mjs
```

**40 backend tests and 10 frontend tests pass.** Database tests use isolated temporary SQLite files, not the user's workspace. Tests cover persistence/reopen, profile validation, feedback, playlist CRUD/order/revision conflicts, all three file round trips, Unicode/multiline CSV/quotes, formula-safe CSV, empty exports, unmatched imports, malformed files, byte limits, database failures, draft identity and encoded platform searches.

Browser QA verified cold-start generation, seeded ranking and explanations, loading/saving a generated playlist, recorded-session reopening, FMA details and responsive recommendation layouts. Previous Phase 3 workflows remain covered by regression tests. Exact scope and checks are in [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md).

## Content model and dataset

See [RECOMMENDATION_MODEL.md](docs/RECOMMENDATION_MODEL.md) for the scoring formulas, missing-data rules, configurable weights and evaluation limits, and [data/README.md](data/README.md) for provenance, licensing and reproducible preprocessing.

```sh
.venv/bin/python scripts/evaluate_content.py
# Optional: fetch only the three official metadata CSV members, then reproduce the subset
.venv/bin/python scripts/prepare_fma.py --download --build
```

The diagnostic script checks ranking invariants on 12 real seeds. It does not measure relevance accuracy: there are no held-out user relevance labels. FMA's metadata license is distinct from recording rights. Missing original-track features stay null. Search links do not verify destination availability.

Open Recommendations, optionally choose a reference track, then Generate playlist. Use these tracks in the editor preserves their order; save explicitly for a durable playlist. Saved profile preferences affect recommendations, while catalogue search retains its source order. The familiarity/discovery slider is stored for Phase 5 and currently has no ranking effect.

See [roadmap](docs/ROADMAP.md), [architecture](docs/ARCHITECTURE.md) and [Phase 3 archive](docs/history/PHASE_3.md). **Stop after Phase 4 for manual review/commit.** No automated commits, pushes or Phase 5 work.

---

## PROJECT_PROGRESS.md

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

---

## docs/ARCHITECTURE.md

# Waveform architecture — Phase 4

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

The existing immutable draft store, tab recovery, dirty/revision checks, save-copy behavior, validation/error handling and safe HTML rendering remain shared. `recommendations.css` extends the established responsive design. Vibe Control, Taste Insights and model comparison stay at their documented future boundaries.

## Operating boundary

Bind both servers to loopback. The app remains single-user with no authentication, no public deployment, no audio serving and no direct music-platform API calls. Source data/model features are local; recommendations require no network. Optional preprocessing downloads only public metadata from the documented official archive. Production user state is separate from datasets and isolated test databases. Back up SQLite while stopped; future schema changes require explicit migrations.

---

## docs/RECOMMENDATION_MODEL.md

# Phase 4 content recommendation model

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
