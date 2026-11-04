# Waveform 1.1 product verification

Verified locally on 4 November 2026. This report describes the product refresh; earlier static-pivot checks remain in [QA history](QA.md).

## Functional checks

- 45 active JavaScript tests pass. New coverage checks full-library backup integrity, additive restoration, playlist-ID conflicts, explicit preference restoration, malformed/oversized files, capacity checks and undo protection against discarding newer edits.
- A full library backup was actually downloaded, read through the browser file chooser and restored. Identical playlists were skipped, the current draft stayed untouched, preference restoration succeeded, and Save preferences worked afterward without a stale revision error.
- The refreshed studio generated real offline tracks. Track replacement, the dirty-editor guard, clear/undo, local saving and the saved indicator were verified.
- Production browser flow generated ten LIVE MusicBrainz tracks for Quiet hours, replaced one, loaded the editor, reordered, saved, downloaded the CSV and reopened the saved playlist after reload. The actual downloaded file contained ten tracks and the documented title/artist/album/isrc/duration headers.
- Eight routes were checked at 320, 390, 768, 1024 and 1440 pixels: 40 layout checks without document overflow or captured JavaScript errors. Mobile menu/backdrop dismissal restored focus and correctly toggled hidden-link inert state.

## Production artifact

- `npm run build` and `npm run verify` pass with zero package dependencies and zero functions.
- The current static artifact contains 70 public files / 69 precache entries, totaling 383,526 bytes. It includes the app manifest, public source modules, CSS, illustrated assets and attributed fallback metadata.
- `node tools/verify.mjs http://127.0.0.1:4181` passed 75 HTTP checks, covering public assets, security headers and exclusion of private/legacy/API paths.
- On a clean production origin, waited for Available offline, stopped the static server, reloaded the cached home, opened the About page and generated ten offline-collection tracks. No JavaScript/CSP errors were captured.
- The service worker keeps each release’s HTML/modules together, lets new releases wait for old tabs to close, and preserves real host responses for retired/private navigation paths. A first visit still needs network access.

## Repository and limits

The repository includes product screenshots, a brand banner, product-focused setup/deployment docs, a changelog, contribution/support guides, issue forms and a read-only-permission GitHub Actions workflow testing Node 22 and 24. Actual remote CI results and the final commit/push confirmation are recorded in the Codex completion report; local success alone is not called remote CI success.

Original source/private files were not used for browser QA. Historical backend/data remain outside the static build. No public application hosting, account provisioning, paid resource, direct streaming integration, or third-party transfer was performed. The PWA manifest/offline shell is provided for supporting browsers; OS installation and a cross-browser certification matrix are not claimed. Deployed-origin API/CSP verification remains part of publishing, documented in [deployment](DEPLOYMENT.md).
