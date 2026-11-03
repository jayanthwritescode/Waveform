# Static architecture

The active application is `frontend/`: native ES modules, existing CSS/illustrations and hash navigation. `api/client.js` is now a browser data service facade, not an HTTP application API. `api/metadata.js` defines normalized tracks; `api/catalogue.js` separates catalogue adapters from UI code. A small attributed source subset supports offline fallback. No audio is loaded.

`playlists/storage.js` owns a versioned localStorage workspace with explicit temporary-memory recovery when storage is corrupt/unavailable/full. Unreadable originals are not overwritten. `playlists/manager.js` handles local profile, feedback, named playlist revisions and CRUD. `state/draft.js` retains the existing editor and recovers a separate local draft. There is no cloud sync or automatic database migration. Export old playlists before switching from the historical application.

Historical Python algorithms, work-in-progress authentication, deployment recipes and dependencies are preserved under `legacy/`. Existing source data and private user files remain in root `data/` and are excluded from the site. Historical evaluation metrics do not describe the new JavaScript engine.
