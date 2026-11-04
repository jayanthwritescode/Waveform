# Contributing to Waveform

Waveform uses HTML, CSS and native JavaScript modules, with zero package dependencies. Keep changes focused on music discovery, context-aware playlists and useful local workflows.

## Develop

Use Node.js 22 or 24:

```sh
npm run dev
```

Open http://127.0.0.1:5173. This server serves only `frontend/`; never serve the repository root. Python and database tooling under `legacy/` are historical, outside the active runtime.

## Before a pull request

```sh
npm test
npm run build
npm run verify
npm run preview
```

Check affected screens on desktop and mobile. Use real metadata and honest source states; API failures must keep the offline collection usable. Preserve unknown metadata, local drafts and existing saved playlists. Include accessible names/focus behavior for interactive controls and honor reduced motion.

Do not add playback, undisclosed analytics, account requirements or paid services as incidental changes. Propose architectural/dependency changes before expanding the project. Keep private data, local databases, credentials, downloads and generated `dist/` out of Git. Source metadata retains its own licenses and attributions.

Open a pull request with the user-visible change, relevant validation and screenshots. GitHub Actions runs the active tests/build on Node 22 and 24; a badge is only evidence after those checks complete.
