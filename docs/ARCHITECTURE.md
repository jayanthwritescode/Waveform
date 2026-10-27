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
