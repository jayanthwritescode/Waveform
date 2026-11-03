# Waveform

**Your music. Your moment.** A frontend-first music discovery and playlist generator. The static pivot supersedes the former Render/backend roadmap.

## Run

Requires Node.js 20+ for development tooling; the app itself is plain HTML/CSS/ES modules. No install, Python, account, database or environment variables are required.

```sh
node tools/serve.mjs
```

Open http://127.0.0.1:5173. Serve only `frontend/`, never the repository root. Test with `node --test frontend/tests/*.test.mjs`.

Phase 2.5: the retained interface, local catalogue browsing, playlist editor, saved library and preferences work without a backend. Live discovery and contextual generation follow in subsequent checkpoints.

Storage belongs to this browser/origin. Clearing site data or using a different device loses access to local copies. Storage failures use explicitly temporary memory. Historical code/data are preserved in `legacy/` and root `data/`, excluded from the served frontend.

See [architecture](docs/ARCHITECTURE.md) and [progress](PROJECT_PROGRESS.md).
