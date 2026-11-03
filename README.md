# Waveform

**Your music. Your moment.** A frontend-first music discovery and playlist generator. The static pivot supersedes the former Render/backend roadmap.

## Run

Requires Node.js 20+ for development tooling; the app itself is plain HTML/CSS/ES modules. No install, Python, account, database or environment variables are required.

```sh
node tools/serve.mjs
```

Open http://127.0.0.1:5173. Serve only `frontend/`, never the repository root. Test with `node --test frontend/tests/*.test.mjs`.

The retained interface, live MusicBrainz song/artist/genre searches, explicit demo fallback, local playlist editor, saved library and preferences work without a backend. Vibe Control generates 10/20/30 context-ranked tracks with real signal explanations, variation and replacements. See [algorithm](docs/RECOMMENDATION_MODEL.md).

Storage belongs to this browser/origin. Clearing site data or using a different device loses access to local copies. Storage failures use explicitly temporary memory. Historical code/data are preserved in `legacy/` and root `data/`, excluded from the served frontend.

See [architecture](docs/ARCHITECTURE.md) and [progress](PROJECT_PROGRESS.md).

## Create and export

Choose mood/activity/genres in Vibe Control, generate, then Edit this playlist. In Builder, rename, replace, remove and reorder tracks; save in Your Library. CSV/TXT exports support manual transfer and JSON is a full backup. Expand the Soundiiz instructions for its documented import steps, or search individual tracks on Spotify, Apple Music and YouTube Music. No direct platform playlist creation or playback is included. See [file formats](docs/FILE_FORMATS.md).

The home shows recent local saves and activity shortcuts. Taste Insights counts only actual local saves/likes and the last ten generation snapshots. Static assets and the fallback are cached for offline reload after a successful production visit; development port 5173 skips service-worker registration. Offline support requires an initial online visit and a browser with service workers. [QA evidence](docs/QA.md).
