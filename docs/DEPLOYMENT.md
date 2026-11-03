# Static deployment

Verified locally 3 November 2026. No hosting resources were provisioned. Vercel was discoverable but not installed/connected; no connected Netlify integration or authenticated deployment CLI was available. Do not confuse a successful Git push with a deployment.

## Local production verification

From the repository root with Node.js 20+ (22 recommended):

```sh
npm test
npm run build
npm run verify
npm run preview
```

Open http://127.0.0.1:4173. While the preview is running, use another terminal:

```sh
node tools/verify.mjs http://127.0.0.1:4173
```

The build publishes only static HTML/CSS/JS/SVG and one small fallback metadata file. It excludes tests, documentation, legacy Python/auth/container files, original datasets, private database, audio, environment files and fitted models. No package install, environment variables, backend/database or serverless functions are needed. Generated `dist/` is ignored in Git and reproduced on the host.

`vercel.json` and `netlify.toml` define equivalent security headers, including a CSP allowing only same-origin code/assets and direct MusicBrainz API connections. Local production preview applies the configured common headers; it does not emulate every provider routing detail. Hash routes (`/#/vibe`, etc.) need no SPA rewrite. On another static host, serve `dist/` over HTTPS and reproduce the headers where supported.

## Vercel

1. Use a Vercel account eligible for the free [Hobby plan](https://vercel.com/docs/plans/hobby), which is for personal/non-commercial use and has usage limits.
2. Add New → Project → import `jayanthwritescode/Waveform` from GitHub.
3. Select `waveform-static-pivot`. Keep Root Directory at the repository root, not `frontend` or `legacy`.
4. Framework Preset: Other. Build Command: `node tools/build.mjs`. Output Directory: `dist`. The checked-in `vercel.json` supplies these settings and skips dependency installation.
5. Add no environment variables. Do not add a database, paid integrations or server functions. Deploy the current pivot branch, not the old `main` implementation.
6. Verify the resulting HTTPS URL using the checks below. If promoting a preview to production, ensure the production branch is the pivot branch or merge it through your normal review process first.

[Official build settings](https://vercel.com/docs/builds/configure-a-build). Host UI wording may change; the build command/output contract is the important part.

## Netlify

1. Use the [Free plan](https://www.netlify.com/pricing/) within its monthly credit limits. Do not enable paid add-ons or auto-recharge.
2. Add new project/site → import an existing Git repository → choose `jayanthwritescode/Waveform` and `waveform-static-pivot`.
3. Base directory: repository root. Build command: `node tools/build.mjs`. Publish directory: `dist`. `netlify.toml` already sets these and Node 22.
4. No API keys, environment secrets, functions or database are needed. Deploy/publish using Netlify’s normal controls.
5. For a manual upload instead, run `npm run build` and upload only `dist/`. Git-connected deployment is preferable because it applies the checked-in configuration. Reproduce headers for manual uploads if the host does not read root `netlify.toml`.
6. Verify the HTTPS URL below. New Netlify projects may be private until explicitly published; inspect the account UI before calling the site public.

[Official build configuration](https://docs.netlify.com/build/configure-builds/overview/). Free plans have limits rather than unlimited guaranteed availability.

## Verify the deployed URL

1. Open the public HTTPS URL in a clean browser profile; verify Home and navigation with no Python server running.
2. In Discover search a known song and an artist; confirm actual MusicBrainz results and a Live/Cached source notice. Inspect browser console/network for CORS/CSP failures. Local direct CORS succeeded; this deployed-origin check is still outstanding.
3. In Vibe Control select mood/activity/genres and generate 10 tracks. Review source explanations; missing data must stay unknown.
4. Replace one track, load Builder, reorder, rename, save, download CSV/TXT/JSON and expand transfer instructions. Reopen the saved playlist after reload. Inspect the downloaded CSV headers/track count and duration seconds.
5. Test the mobile menu at 390px, keyboard ordering and Escape focus restoration.
6. Wait for OFFLINE DEMO READY. Disable network using your browser’s developer tools, reload and generate with Use verified demo fallback only. Re-enable network afterward. Offline caching requires an initial successful visit and service-worker support.
7. Confirm `/.env`, `/data/waveform.db`, `/legacy/backend/app/main.py` and `/api/health` return 404, not source data. Use `node tools/verify.mjs https://YOUR-HOST` for asset/private-path checks.
8. Close old tabs after a new release if the previous offline cache remains active. Export JSON before clearing site data, because doing so also removes local playlists.

## Optional proxy

None is implemented or required by the verified local browser. If MusicBrainz later blocks direct CORS, use the explicit fallback and review a minimal optional proxy separately. It would need a shared upstream limiter across concurrent serverless instances; an in-memory limiter in one instance cannot guarantee global compliance. Do not introduce a paid database or pretend a proxy is already tested.
