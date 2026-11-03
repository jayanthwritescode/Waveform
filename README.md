# Waveform

**Your music. Your moment.**

Waveform is a lightweight, context-aware music discovery and playlist generator. Discover music → create a playlist → export. It runs entirely in the browser: no Python server, database, signup, streaming subscription, OAuth, paid backend or environment credentials are required.

## Run locally

Use Node.js 20+ (22 LTS recommended). There are **zero package dependencies**; no install step is needed.

```sh
npm run dev
```

Open [Waveform locally](http://127.0.0.1:5173). The development server serves only `frontend/` and skips service-worker caching to keep edits fresh. The app uses standard HTML, CSS and native JavaScript modules.

```sh
npm test
npm run build
npm run verify
npm run preview
```

The production preview is [http://127.0.0.1:4173](http://127.0.0.1:4173). In another terminal, run `node tools/verify.mjs http://127.0.0.1:4173` for the HTTP checks. Only `dist/` should be published. Never serve or publish the repository root.

## Features

- Live MusicBrainz song, artist-name and genre/tag searches with a cross-tab request queue, debouncing, cache, timeout/retry handling and honest source states.
- A verified, attributed 208-track fallback for API failures/offline demos; it is always labeled as fallback rather than live data.
- Six moods, seven activities, genre/artist preferences, exclusions, energy proxy, instrumental tags, discovery, variety and optional seed song/artist.
- Explainable 10/20/30-track recommendations, missing-signal weight redistribution, recording/version deduplication, artist limits, seeded variation and replacements.
- The retained midnight/violet interface, responsive navigation, skeletons, keyboard ordering, native drag ordering and reduced-motion support.
- Rename, replace, remove, reorder and save playlists locally. Recover drafts, reopen saved playlists, record explicit likes/dislikes and inspect real local Taste Insights.
- UTF-8 CSV, Artist - Title TXT/clipboard and full JSON backup; preview/import files before replacing a draft. Encoded Spotify, Apple Music and YouTube Music search links.
- Manual Soundiiz transfer instructions based on its documented format. No file download is presented as a completed streaming transfer.
- Offline shell/fallback caching after a successful production visit; the footer confirms when the offline demo is ready.

## Architecture and data

`frontend/js/api/` provides catalogue adapters and normalization; `recommender/` owns editorial mappings, scoring and diversification; `playlists/` owns local persistence and files. The existing editor, shell, cards, CSS and illustrations are retained. Hash navigation needs no server rewrites. `tools/build.mjs` creates an allowlisted static artifact with a content-versioned offline cache. No serverless proxy/functions are needed: direct MusicBrainz CORS was verified in the actual browser.

The previous FastAPI/SQLAlchemy/research app and unfinished Render/authentication work are preserved in `legacy/`, excluded from deployment. Original datasets, private SQLite database, audio and fitted artifacts remain untouched in root `data/`. No audio is served. Historical evaluation reports describe the old models, not this browser ranker. Prior docs are in `docs/history/`.

Local storage belongs to this browser and origin, without cloud sync. Clearing site data/private browsing can remove it. Export JSON backups before changing devices/origins. Corrupt stored workspace/draft text is preserved; blocked/full storage falls back to explicitly temporary memory. Old Waveform JSON v1 playlist exports can be imported; the old database is not migrated automatically.

## Deploy free

Both providers use the repository root, branch **`waveform-static-pivot`**, build command **`node tools/build.mjs`** and publish/output directory **`dist`**. No environment variables or functions are required.

- **Vercel:** Import the GitHub repository, select the pivot branch, choose Other framework, confirm `dist` output and use the Hobby plan where eligible. [Build settings](https://vercel.com/docs/builds/configure-a-build); [Hobby terms and limits](https://vercel.com/docs/plans/hobby).
- **Netlify:** Import the repository, select the pivot branch and use the checked-in `netlify.toml` with publish directory `dist`. Choose Free; do not enable paid add-ons. Alternatively upload the generated `dist/` folder manually. [Build settings](https://docs.netlify.com/build/configure-builds/overview/); [Free plan limits](https://www.netlify.com/pricing/).

See [exact deployment and verification steps](docs/DEPLOYMENT.md). **No public deployment was performed:** no Vercel/Netlify account was connected here. The static artifact and local production demo were verified; deployed-origin CORS still needs verification after hosting.

## Limits and verification

MusicBrainz coverage, tags, durations and API availability vary. Read-only API use for this non-commercial demo needs no key; commercial use requires checking provider terms. Browser-controlled User-Agent is not overridden. Web Locks/HTTPS are needed for coordinated live searches; unsupported browsers use fallback. Shared-IP/global throttling can still occur.

Energy is an editorial genre/tag proxy, not measured audio energy. Unknown metadata stays unknown. Artwork is original Waveform illustration rather than album artwork. No playback, neural training, collaborative user model, direct streaming account integration or quality/confidence claims are included. Soundiiz is optional and has its own accounts/plan limits; matching can fail. Offline first visits require network, and new cached releases may wait until older tabs close.

**38 active JavaScript tests pass**, including 126 mood/activity/length scenarios. Browser QA verified live CORS/generation, the full create/edit/save/download/reopen flow, native drag, real file import, clipboard, mobile focus and seven screens at 320–1440px. The production build passed 68 HTTP checks and cached reload/fallback generation with its static server stopped. All 27 original data files match the preservation baseline. No external deployment or third-party-account transfer is claimed.

[Architecture](docs/ARCHITECTURE.md) · [Algorithm](docs/RECOMMENDATION_MODEL.md) · [Catalogue/terms](docs/CATALOGUE.md) · [File formats](docs/FILE_FORMATS.md) · [QA](docs/QA.md) · [Progress](PROJECT_PROGRESS.md)
