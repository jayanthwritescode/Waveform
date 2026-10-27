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
