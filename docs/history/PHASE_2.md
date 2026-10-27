# Historical Phase 2 checkpoint

Archived before the Phase 2.5 product pivot. This is historical documentation; its playback commands and architecture are retired. Follow the current root README instead.

---

## Original README.md

# Waveform

**Music that understands your moment.**

Waveform is a context-aware music discovery project built with vanilla JavaScript and FastAPI. **Phases 1 and 2 are complete; Phase 3 awaits explicit authorization.**

## Current experience

- Midnight/lavender interface, original illustrations, responsive sidebar and persistent player.
- Real, attributed eight-track Kevin MacLeod catalogue with five source genres.
- Discover search across title, artist, genre, instruments and source tags; combinable genre/artist filters, clear filters, empty results, loading and retry states.
- Track detail pages with source metadata, individual credits, license links, and honest missing-feature information.
- Actual local MP3 playback: play/pause, previous/next, seeking, volume, shuffle, repeat off/all/one, queue completion, and missing-audio recovery.
- Playback and its queue continue across internal navigation and search. The queue is the result list visible when you select a track; playing from track details uses a one-track queue.
- Future pages explain upcoming functionality. Mood links and mix concepts are still placeholders; no recommendation model, analytics, profile, or listening history exists yet.

## Requirements and setup

Python 3.11+ and a modern browser supporting ES modules, Fetch and HTML5 Audio. No frontend installation or build is required. Node.js is optional for the frontend tests.

```sh
cd /Users/jayanth/Desktop/Waveform
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements-dev.txt
cp .env.example .env
python scripts/download_audio.py
```

On this working copy the dependencies and all eight audio files are already installed. The installer verifies and reuses them if run again. A fresh clone must download the audio because MP3 files are Git-ignored. Network access is needed only for package/audio installation, not normal playback.

`backend/requirements.txt` contains runtime dependencies. `backend/requirements-lock.txt` records the exact verified development versions; use it instead for a version-matched installation.

## Run locally

Backend in terminal 1:

```sh
cd /Users/jayanth/Desktop/Waveform
.venv/bin/python -m uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```

Frontend in terminal 2:

```sh
cd /Users/jayanth/Desktop/Waveform
python3.11 -m http.server 5173 --bind 127.0.0.1 --directory frontend
```

Open [Waveform](http://127.0.0.1:5173), [Discover](http://127.0.0.1:5173/#/discover), or [API documentation](http://127.0.0.1:8000/docs). Use HTTP rather than `file://` for JavaScript modules. Select an artwork's play button to start audio; select the title to view track details and credits. Playback requires a user gesture and starts only when requested.

Previous restarts a track after three seconds; before that it returns to queue history/the previous track. Shuffle visits remaining tracks without immediate repeats and stops after exhaustion with repeat off. Repeat all loops the queue; repeat one loops the current track at its natural end. Next still advances with repeat one. Browser refresh resets playback, filters, and queue; persistent user state is Phase 3 work.

## Configuration

The backend and audio installer load the root `.env`, with environment variables taking precedence.

| Variable | Default | Purpose |
| --- | --- | --- |
| `APP_NAME` | `Waveform` | API name |
| `APP_ENV` | `development` | Environment label |
| `CORS_ORIGINS` | `["http://localhost:5173", "http://127.0.0.1:5173"]` | JSON array of allowed frontend origins |
| `AUDIO_DIR` | `data/audio` | MP3 directory; relative paths resolve from project root |
| `DATABASE_URL` | `sqlite:///./data/waveform.db` | Reserved for Phase 3; no database created yet |

The browser API defaults to `http://127.0.0.1:8000`. To override it, assign `window.WAVEFORM_API_BASE` in a script before the module script in `frontend/index.html`. Browser configuration is public; do not place credentials there. Python's static server does not read `.env`.

## API

| Method and path | Behavior |
| --- | --- |
| `GET /api/health` | Application status, name, and phase 2 |
| `GET /api/tracks` | Catalogue page; `q`, `genre`, `artist`, `limit` (1–100), `offset` (0+) |
| `GET /api/tracks/{ISRC}` | Metadata, credits, audio availability and local playback URL |
| `GET` / `HEAD /api/tracks/{ISRC}/audio` | MP3 response with byte-range seeking; 404 for missing tracks/audio |

Search is case-insensitive, all query terms must match the searchable metadata, and filters combine with AND. Catalogue order is stable source/curation order, not a recommendation ranking. All filter options describe the complete collection. The API does not fetch arbitrary URLs or accept user filesystem paths.

## Testing

```sh
cd /Users/jayanth/Desktop/Waveform
.venv/bin/python -m pytest -c backend/pytest.ini -q
node --test frontend/tests/queue.test.mjs
curl http://127.0.0.1:8000/api/health
curl 'http://127.0.0.1:8000/api/tracks?q=piano&genre=Contemporary'
```

Expected automated results: 15 backend tests and 5 frontend tests pass. Tests do not download audio. Backend stream tests use temporary synthetic byte payloads to verify HTTP ranges; real MP3 decoding was checked separately in the browser for every catalogue track.

Review manually: search for `piano` (three matches), select Contemporary (one match), clear filters, play a track, pause/resume/seek, try next/previous and repeat/shuffle, navigate to another page while playing, and inspect individual credits. Settings has a backend connection check. The UI gives installation instructions when audio is missing and a retry state when the API is offline.

## Sources and limitations

Music is by Kevin MacLeod, [Incompetech](https://incompetech.com/music/royalty-free/music.html), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Audio is unmodified. The artwork is original Waveform illustration, not source album artwork. Individual credits and source links are on track pages and in the tracked catalogue manifest.

See [data/README.md](data/README.md) for licensing, source records, SHA-256 download verification, dataset evaluation, and the separation of playback data from future research experiments. The collection is small and contains one composer. Album and standardized energy/valence/acousticness/instrumentalness values are unavailable; they are not invented. No collaborative training data or model exists.

[PROJECT_PROGRESS.md](PROJECT_PROGRESS.md) records the review checkpoint and actual validation. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) describes the modules.

## Remaining phases

3. Local profile, preferences, likes/dislikes, listening interactions, library and playlist management.
4. Genuine content-based recommendations.
5. Context-aware ranking and Vibe Control.
6. Collaborative filtering and hybrid recommendations where alignment permits.
7. Recommendation comparison, real listening analytics, offline evaluation.
8. Final polish, integration testing, documentation and deployment.

Each phase stops for manual review and a user-managed GitHub commit. No automated commits, pushes or pull requests.

---

## Original PROJECT_PROGRESS.md

# Waveform — Project progress

Last updated: 27 October 2026 (Asia/Kolkata).

## Current checkpoint

**Phase 2: Music Catalogue and Functional Player — complete, awaiting user review and manual GitHub commit.**

Phases 1 and 2 are complete. The user's “continue” authorized Phase 2 only. Phase 3 has not started. No automated Git commits, pushes, pull requests, or deployment were performed.

## Phase 1 — completed foundation

Separated vanilla HTML/CSS/JavaScript frontend and FastAPI backend; responsive midnight/lavender design system, original illustrations, eight-page navigation, placeholder pages, accessible focus/skip navigation, environment settings, health route, documentation and initial backend tests. Phase 1's fictional track fixtures and disabled player shell were replaced by real catalogue data and playback in Phase 2. Future-feature pages remain honest placeholders.

## Phase 2 — implemented features

- Selected a curated **eight-track Kevin MacLeod / Incompetech collection** with real metadata and openly licensed MP3 audio, across five publisher-defined genres.
- Evaluated FMA and Last.fm as future research sources without downloading or merging those datasets. Documented source, licenses, feature coverage, single-composer bias, and lack of interaction data.
- Tracked metadata manifest with ISRC IDs, source URLs, CC BY 4.0 credits/license links, source tags, instruments, tempo, duration, and verified audio SHA-256 hashes.
- Unknown album/standardized energy, valence, acousticness, and instrumentalness remain null. Artwork is original Waveform illustration, explicitly distinguished from artist album covers.
- Typed track schemas, a separated catalogue service, metadata detail/retrieval endpoints, combinable case-insensitive search/genre/artist filters, pagination, and query validation.
- Local GET/HEAD MP3 routes with HTTP byte ranges for seeking and explicit missing-audio responses. Runtime routes resolve known manifest IDs and do not fetch arbitrary URLs or accept filesystem paths.
- Audio installer using root environment configuration, bounded downloads, pinned checksum verification, idempotent reuse, atomic replacement, partial-file cleanup, and nonzero failure exit status.
- All eight originals installed locally (about 60 MiB), deliberately ignored by Git. A fresh clone uses the download script.
- Discover search and filters, clear action, result counts, loading skeletons, empty/error/retry states, and individual track detail/credit pages.
- Home's catalogue cards now load real tracks from the API; fictional samples are no longer presented as music records.
- One persistent HTMLAudioElement with play/pause, previous/next, seeking, volume, shuffle, repeat off/all/one, queue completion and failure recovery.
- In-memory playback queue snapshots the visible results when a track is selected and survives search and internal navigation. Track-detail playback creates a one-track queue. Refresh intentionally resets playback.
- Queue policy separated from audio side effects. Shuffle consumes unvisited tracks, repeat all wraps, repeat one loops natural ending, and manual Next advances normally. Previous restarts after three seconds or follows queue history.
- All transport and volume controls remain available on narrow mobile layouts.
- Updated README, data/license documentation, architecture notes and this progress checkpoint. Root-only model-artifact ignore rule preserves future `backend/app/models` source files.

## Validation actually performed

| Check | Result |
| --- | --- |
| `.venv/bin/python -m pytest -c backend/pytest.ini -q` | **15 passed**: health/CORS, real records/credits, search/filter combinations, pagination, input bounds, details/404, missing audio, GET range/HEAD/416 responses, checksum failure preserving an existing file, reuse without networking |
| `node --test frontend/tests/queue.test.mjs` | **5 passed**: sequential progression/end, repeat modes, shuffle exclusion/exhaustion, escaping and duration formatting |
| Node syntax checks | All frontend ES modules passed |
| Audio download | Eight originals downloaded from composer URLs; SHA-256 hashes recorded and then independently reverified by rerunning the installer |
| MP3 structure | All eight inspected with local `ffprobe`; recognized MP3 streams and expected durations |
| Browser decoding | All eight selected and decoded with finite durations, correct local source URLs, and unpaused playback state; test audio volume muted |
| Playback progression | Cipher's actual media time advanced; pause/resume and keyboard seeking worked |
| Persistent playback | Cipher continued playing while navigating to Settings; exactly one audio element remained mounted |
| Previous/next | Next advanced Cipher → Carefree; seeking to start then Previous returned to Cipher |
| Repeat/shuffle | Repeat one restarted Cipher after seeking to its end; repeat all wrapped Sneaky Snitch → Dreams Become Real; shuffle changed tracks; pure policy tests covered exhaustion and edge cases |
| Search | `piano` returned three source matches; Contemporary combined with that search returned Dreams Become Real; impossible query showed empty state; Clear restored eight tracks |
| Details/credits | Individual source metadata and full license/attribution links rendered correctly |
| Home integration | Real catalogue cards loaded after navigating Home and back to Discover |
| Audio failure/recovery | Temporarily moved a locally installed original; HTTP 404 produced a persistent error. Restored file and pressed Play; decoding resumed and error cleared. Test file restored |
| Backend outage/retry | Stopped backend; catalogue showed connection error and retry button. Restarted backend; retry restored all eight results |
| Responsive layouts | Discover at 320, 390, 768, 1024 and 1440px: document width matched viewport; fixed player remained within viewport; seeking visible. Mobile transport, repeat, shuffle and volume visible |
| Assets | Final catalogue inspection: all rendered illustrations loaded |
| Expected errors | Deliberate offline/missing-file tests generated expected failed network requests; no unhandled application failure observed |

During implementation, a failed media load could incorrectly show “Paused” after its error. The pause-event handler now preserves the unavailable status; the failure/recovery path was retested successfully. An initial search check incorrectly expected two piano matches; the publisher metadata correctly contains three, including electric piano. No catalogue data was changed to fit that expectation.

Test servers are stopped after final verification. Exact startup and verification commands are in README.md.

## Known issues and limitations

- No known blocking Phase 2 defects from the checks above.
- Eight tracks from one composer are sufficient for playback demonstration, not a representative training/evaluation corpus.
- No model, recommendation scores, analytics, stored listening events, user profile, likes/dislikes, or playlist persistence exists yet.
- The source provides no standardized energy/valence/acousticness/instrumentalness or album values for this manifest; these fields remain unknown.
- Source duration is rounded; the player uses decoded media duration, which can differ slightly.
- A clean clone needs network access for the initial audio download. Changed source checksums require explicit source review before updating the manifest.
- Audio installed while the app is open requires a catalogue reload to refresh availability. Playback, queue, volume and filter state are in-memory and reset on full reload.
- Browser QA used the in-app browser; a full cross-browser and accessibility audit remains for Phase 8.
- Publisher source/download URLs may change in future; runtime local playback is independent of them after installation.

## Next phase objectives — not started

**Phase 3: User Preferences and Listening History**

1. Add SQLAlchemy persistence and a reliable local single-user profile.
2. Store favorite genres/artists and preference settings.
3. Implement track likes/dislikes, recorded plays/skips, and listening history.
4. Build Your Library from actual stored data.
5. Add playlist creation, renaming and deletion with persistent user state.
6. Validate reload persistence and database error handling, without adding complex authentication.

## Phase status

| Phase | Status |
| --- | --- |
| 1 — Foundation and design system | Complete |
| 2 — Catalogue and player | Complete; awaiting review |
| 3 — Preferences and history | Not started |
| 4 — Content-based recommendations | Not started |
| 5 — Context-aware recommendations | Not started |
| 6 — Collaborative and hybrid recommendations | Not started |
| 7 — Explorer and analytics | Not started |
| 8 — Polish, documentation, deployment | Not started |

Suggested manual commit: `feat: implement music catalogue and audio playback`

---

## Original docs/ARCHITECTURE.md

# Waveform architecture — Phase 1

## Frontend

The frontend is buildless HTML, CSS, and browser-native JavaScript ES modules. It is served separately from FastAPI. No framework or runtime JavaScript dependencies are used.

- `frontend/index.html`: semantic application landmarks and stable sidebar/player mounting points.
- `frontend/css/variables.css`: design tokens, including surfaces, accent, typography, and layout dimensions.
- Other CSS files: global primitives, layout, reusable components, player, and responsive overrides.
- `frontend/js/main.js`: hash routing and event delegation. Only main content changes on navigation; the player remains mounted.
- `components/`: icons, shell, navigation metadata, and reusable track/mix templates.
- `pages/`: home composition and honest future-feature empty states.
- `state/catalogue.js`: four fictional sample tracks and three illustrative mix concepts. No model output or actual music metadata.
- `player/player.js`: current sample selection and disabled playback layout. No audio engine or interaction recording.
- `api/client.js`: Fetch boundary, configurable API origin, timeout, and HTTP failure handling.
- `utils/toast.js`: accessible transient status messages.
- `assets/images/`: original SVG illustrations generated for this project. No external image/font requests.

Templates interpolate only static, trusted fixture data. Future APIs and user input must be inserted with text nodes or escaped before template interpolation.

## Backend

FastAPI exposes `GET /api/health` and OpenAPI docs. Pydantic validates the health response. `config.py` loads environment configuration from the root `.env`; the route layer is separate from configuration and application setup. CORS permits only configured origins.

The `models`, `schemas`, `services`, `recommender`, `database`, and `utils` directories reserve boundaries for future work. SQLAlchemy is installed, but no database schema or persistence is implemented yet. NumPy, Pandas, SciPy, and scikit-learn will be introduced when recommendation work actually requires them.

## Scope and data integrity

No dataset has been selected, audio obtained, model trained, or listening events recorded. The sample catalogue is explicitly fictional. Mood pills and mix cards are navigation entry points to explanatory placeholders. No match scores, fabricated listening metrics, or generated recommendations are shown.

## Accessibility and responsive behavior

Semantic links and buttons support keyboard use; current navigation uses `aria-current`. The main landmark receives focus after route changes. A skip link, accessible control names, status announcements, visible focus indicators, and reduced-motion overrides are included. The mobile sidebar is hidden from focus and accessibility when closed. At 680px the sidebar becomes a toggle menu; below 900px cards use two columns and mix concepts stack. The player remains fixed without replacing main content.

## Phase 2 boundary

Research dataset licensing and playable audio first. Build real track schemas/endpoints, search/filter UI, and an HTML5 Audio player with explicit unavailable-audio handling. Keep real catalogue items separate from fictional fixtures; do not silently promote fixtures into dataset records.

## Phase 2 — catalogue and audio playback

The Phase 1 description above is retained as a historical foundation. Real playback replaces the fictional catalogue/player shell in Phase 2; future recommendations and storage remain unimplemented.

### Data and backend

`data/catalogue/tracks.json` is a tracked, validated eight-track metadata manifest with stable ISRC IDs, provenance, licenses, source URLs and checksums. `schemas/track.py` defines source records and API response models. Missing audio feature fields remain null. `services/catalogue.py` loads and validates the manifest, performs case-insensitive metadata search and exact genre/artist filtering, and reports local file availability. `api/tracks.py` contains HTTP validation, 404 handling, metadata routes and byte-range file responses; catalogue logic stays in the service layer.

Audio is downloaded by `scripts/download_audio.py` into an ignored directory and served through a route that resolves only known manifest IDs. No runtime remote proxy or user-provided filesystem paths are accepted. The installer reads the same configuration as FastAPI, uses bounded downloads and atomic replacement, and verifies pinned source hashes. Valid existing files are reused; changed source files require review. Runtime availability checks test file presence/nonzero size, not full checksum verification on every HTTP request. The manifest is loaded once at server startup; restart after editing catalogue metadata.

### Frontend

- `api/client.js`: configured Fetch boundary and local audio URL resolution.
- `main.js`: asynchronous route loading, debounced search, filters, event delegation, and request-version guards/abort handling so stale searches cannot overwrite newer results or routes.
- `pages/discover.js`: catalogue search shell, empty results, metadata details and visible per-track licensing.
- `components/cards.js`: escaped API metadata templates, skeleton cards, retries and collection attribution.
- `utils/html.js`: HTML escaping and duration formatting.
- `player/player.js`: one persistent HTMLAudioElement, playback events, error recovery, controls, progress and in-memory queue/history. It is initialized once and never replaced on route changes.
- `player/queue.js`: deterministic queue policy separated from media effects, covering sequential/shuffled progression and repeat modes.
- `css/catalogue.css`: catalogue/details styling and active player controls, including all transport/volume controls on mobile.

Displayed search results are snapshotted as a playback queue only when the user explicitly plays a track; changing search/navigation does not alter an existing queue. No implicit listening events or user profile are recorded. Previous restarts after three seconds, otherwise uses actual queue history. Shuffle exhausts unvisited items before stopping with repeat off; repeat all starts another cycle. A repeat-one loop applies at natural ending; manual Next advances normally.

Loading/error/empty UI reflects real requests. Missing audio is indicated using API availability and handled again at media error time in case a file disappears after the catalogue was loaded. Playback errors remain visible and do not get replaced by a misleading pause status. No match percentages or recommendations are fabricated.

### Next boundary

Phase 3 will add SQLAlchemy models, a local profile, preferences, interaction history and playlist persistence. Phase 2 has not implemented any of those functions.

---

## Original data/README.md

# Waveform data and audio — Phase 2

## Selected playback collection

Waveform ships a curated metadata manifest for **eight Kevin MacLeod tracks** from the composer's [Incompetech catalogue](https://incompetech.com/music/royalty-free/music.html). The factual fields were retrieved from the public [pieces.json](https://incompetech.com/music/royalty-free/pieces.json) on 27 October 2026. Genre IDs were mapped using the genre lookup on that same catalogue page.

This is a small curated playback collection, not a research benchmark or a trained recommendation dataset. All eight tracks are from one composer. There are no user interactions, recommendation scores, or invented audio features.

| ISRC | Title | Source genre | Source duration |
| --- | --- | --- | --- |
| USUAN1500027 | Dreams Become Real | Contemporary | 6:50 |
| USUAN1100844 | Cipher | Electronica | 3:51 |
| USUAN1400037 | Carefree | Contemporary | 3:25 |
| USUAN1300010 | Local Forecast | Jazz | 2:45 |
| USUAN1400011 | Monkeys Spinning Monkeys | Soundtrack | 2:05 |
| USUAN2100030 | Space Jazz | Jazz | 6:10 |
| USUAN1100192 | Ishikari Lore | World | 2:44 |
| USUAN1100772 | Sneaky Snitch | Soundtrack | 2:17 |

The manifest retains source titles, artist, ISRC, genre, tempo, duration, instruments, feel tags, upload date, direct audio source, and source-page URL. `source_uploaded` is the catalogue's upload date, not an asserted recording/release date. `album`, `energy`, `valence`, `acousticness`, and `instrumentalness` remain null because those values are not supplied. Source tempo is not an independently measured tempo. Player duration uses decoded media metadata and can differ slightly from the catalogue's rounded duration.

## License and attribution

The current catalogue provides each track under **Creative Commons Attribution 4.0 International** and provides a visible attribution template. See the composer's [music FAQ](https://incompetech.com/music/royalty-free/faq.html) and [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/).

Attribution for each track above: **“[Track title]” — Kevin MacLeod (incompetech.com), licensed under Creative Commons Attribution 4.0.** Individual source URLs, license links, and full credit text are retained in `catalogue/tracks.json` and displayed on each track's detail page. Catalogue-level attribution appears on Home and Discover; the persistent player links to individual credits.

Audio files are downloaded unmodified from the composer's published download URLs. No audio is scraped from restricted streaming platforms. Waveform does not claim ownership of the music or imply composer endorsement. The illustrations are original Waveform graphics and are explicitly labeled as illustrations, not original album covers. The original fictional Phase 1 sample metadata is no longer used by the app.

## Installing audio

From the repository root, after installing Python dependencies:

```sh
.venv/bin/python scripts/download_audio.py
```

The installer uses the same `.env` / `AUDIO_DIR` configuration as FastAPI. Override with `--audio-dir /absolute/path` if needed, or select a track with repeated `--track ISRC` arguments. It downloads only curated HTTPS source URLs, writes to temporary files, verifies SHA-256 checksums pinned from the verified Phase 2 downloads, and then replaces the destination atomically. A checksum change stops replacement so the new source can be reviewed. Verified existing files are reused without network access. A failed download leaves a useful error, removes the partial file, and exits nonzero after processing remaining tracks.

The eight MP3 files total approximately 60 MiB. They are deliberately Git-ignored under `data/audio/`; a fresh clone needs this download step. Catalogue metadata and illustrations are tracked. Neither FastAPI nor the browser contacts Incompetech during normal local playback. If audio is missing, the API reports `audio_available: false`, the UI labels the track, and selection shows installation instructions. Reload the catalogue after installing missing files.

## Dataset evaluation and later experiments

| Candidate | Useful data | Playback / licensing / scope limits | Decision |
| --- | --- | --- | --- |
| [Incompetech public catalogue](https://incompetech.com/music/royalty-free/music.html) | Real titles, ISRCs, genres, BPM, duration, instruments, source tags; public MP3 downloads | One composer in this curated subset; no user interaction history or standardized energy/valence features; attribution required | Selected for reproducible local playback and initial metadata foundation |
| [FMA](https://github.com/mdeff/fma) | Track/artist metadata, genre taxonomy, extracted features; metadata spans 106,574 tracks | Metadata CC BY 4.0; audio uses per-artist licenses, which must be checked; smallest audio subset is about 7.2 GiB; no ready-made Waveform listening history | Suitable candidate for later content-based experiments; not downloaded, imported, or trained in Phase 2 |
| [HetRec 2011 Last.fm](https://lenskit.grouplens.org/datasets/hetrec-2011/) | Artist-level listening counts and tags from around 1,900 users | Artist-level interactions do not identify these playback tracks; does not supply this audio; its own README/license must be reviewed before use | Candidate for a separate collaborative benchmark in Phase 6, not merged with this collection |

There is **no training catalogue yet**. No reliable mapping has been established between this collection and FMA or Last.fm. Future experiments must retain source identifiers, document feature coverage and missing values, and keep unaligned benchmarks separate from app personalization. Larger experiments are not represented as recommendations in this phase.

`raw/` and `processed/` remain reserved and ignored for later dataset work. No trained artifacts or local database are included.
