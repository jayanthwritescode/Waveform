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
