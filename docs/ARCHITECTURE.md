# Static architecture

The active application is `frontend/`: native ES modules, existing CSS/illustrations and hash navigation. `api/client.js` is now a browser data service facade, not an HTTP application API. `api/metadata.js` defines normalized tracks; `api/catalogue.js` separates catalogue adapters from UI code. A small attributed source subset supports offline fallback. No audio is loaded.

`playlists/storage.js` owns a versioned localStorage workspace with explicit temporary-memory recovery when storage is corrupt/unavailable/full. Unreadable originals are not overwritten. `playlists/manager.js` handles local profile, feedback, named playlist revisions and CRUD. `state/draft.js` retains the existing editor and recovers a separate local draft. There is no cloud sync or automatic database migration. Export old playlists before switching from the historical application.

Historical Python algorithms, work-in-progress authentication, deployment recipes and dependencies are preserved under `legacy/`. Existing source data and private user files remain in root `data/` and are excluded from the site. Historical evaluation metrics do not describe the new JavaScript engine.

## Final runtime

`recommender/context.js`, `scoring.js`, `ranking.js`, `generator.js` implement combined live candidate retrieval and transparent available-signal ranking. `pages/vibe.js` controls generation and stale-route cancellation; the retained Builder supports ordered local editing and exports. `pages/local-insights.js` counts actual local choices. There is no collaborative track/user model or fitted artifact in the deployed app.

`musicbrainz.js` uses an origin-wide Web Lock to coordinate <=1 request/second across tabs, with 24-hour bounded cache and bounded retries/cooldown. Data is normalized rather than inferred. A failed query uses attributed fallback with an explicit notice. No serverless proxy is needed in the verified browser.

`tools/build.mjs` produces an allowlisted `dist/`, fingerprints its offline cache, and uses no dependencies. `sw.js` precaches public app assets/fallback only, not private state or external API responses. Local preferences, small saved playlists (up to 50), feedback and ten generation snapshots use a versioned localStorage workspace. Draft recovery is separate; old tab drafts can be recovered without writing back to old storage. Persistent local catalogue history is bounded. New releases wait for older controlled tabs to close before activation.

Both Vercel and Netlify serve `dist/` with no Python, database, authentication or environment secrets. Actual public deployment was unavailable; see [deployment](DEPLOYMENT.md). The app is intentionally single-browser/local, with JSON files for portability rather than automatic cloud synchronization.

## Product release 1.1

The product layer adds optional fine-tuning in the playlist studio, library backup/restore (`playlists/backup.js`), guarded draft undo (`state/undo.js`), About & privacy, a manifest and a consistent visual system in `css/product.css`. Backups merge additively, copy conflicting playlist versions and leave the current editor untouched; restoring preferences is explicit. Untrusted backup input is bounded and validated before any change. Storage failures retain the existing temporary-memory warning.

The production service worker serves cached HTML with that release’s cached modules, avoiding a new-HTML/old-module mix during updates. Hash navigation is handled only at the app root/index; retired private/API paths retain host responses. It never caches private library state or MusicBrainz responses. New releases wait for old controlled tabs to close.
