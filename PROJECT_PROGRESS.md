# Waveform — Project progress

Last updated: 27 October 2026 (Asia/Kolkata).

## Current checkpoint

**Phase 2: Music Catalogue and Functional Player — complete, awaiting user review and manual GitHub commit.**

Phases 1 and 2 are complete. The user's “continue” authorized Phase 2 only. Phase 3 has not started. No automated Git commits, pushes, pull requests, or deployment were performed.

## Phase 1 — completed foundation

Separated vanilla HTML/CSS/JavaScript frontend and FastAPI backend; responsive midnight/lavender design system, original illustrations, eight-page navigation, placeholder pages, accessible focus/skip navigation, environment settings, health route, documentation and initial backend tests. Phase 1's fictional track fixtures and disabled player shell were replaced by real catalogue data and playback in Phase 2. Future-feature pages remain honest placeholders.

## Phase 2 — implemented features

- Selected a curated **eight-track Kevin MacLeod / Incompetech collection** with real metadata and openly licensed MP3 audio, across five publisher-defined genres.
- Evaluated FMA and Last.fm as future research sources without downloading or merging those datasets. Documented source, licenses, feature coverage, single-composer bias, and lack of interaction data.
- Tracked metadata manifest with ISRC IDs, source URLs, CC BY 4.0 credits/license links, source tags, instruments, tempo, duration, and verified audio SHA-256 hashes.
- Unknown album/standardized energy, valence, acousticness, and instrumentalness remain null. Artwork is original Waveform illustration, explicitly distinguished from artist album covers.
- Typed track schemas, a separated catalogue service, metadata detail/retrieval endpoints, combinable case-insensitive search/genre/artist filters, pagination, and query validation.
- Local GET/HEAD MP3 routes with HTTP byte ranges for seeking and explicit missing-audio responses. Runtime routes resolve known manifest IDs and do not fetch arbitrary URLs or accept filesystem paths.
- Audio installer using root environment configuration, bounded downloads, pinned checksum verification, idempotent reuse, atomic replacement, partial-file cleanup, and nonzero failure exit status.
- All eight originals installed locally (about 60 MiB), deliberately ignored by Git. A fresh clone uses the download script.
- Discover search and filters, clear action, result counts, loading skeletons, empty/error/retry states, and individual track detail/credit pages.
- Home's catalogue cards now load real tracks from the API; fictional samples are no longer presented as music records.
- One persistent HTMLAudioElement with play/pause, previous/next, seeking, volume, shuffle, repeat off/all/one, queue completion and failure recovery.
- In-memory playback queue snapshots the visible results when a track is selected and survives search and internal navigation. Track-detail playback creates a one-track queue. Refresh intentionally resets playback.
- Queue policy separated from audio side effects. Shuffle consumes unvisited tracks, repeat all wraps, repeat one loops natural ending, and manual Next advances normally. Previous restarts after three seconds or follows queue history.
- All transport and volume controls remain available on narrow mobile layouts.
- Updated README, data/license documentation, architecture notes and this progress checkpoint. Root-only model-artifact ignore rule preserves future `backend/app/models` source files.

## Validation actually performed

| Check | Result |
| --- | --- |
| `.venv/bin/python -m pytest -c backend/pytest.ini -q` | **15 passed**: health/CORS, real records/credits, search/filter combinations, pagination, input bounds, details/404, missing audio, GET range/HEAD/416 responses, checksum failure preserving an existing file, reuse without networking |
| `node --test frontend/tests/queue.test.mjs` | **5 passed**: sequential progression/end, repeat modes, shuffle exclusion/exhaustion, escaping and duration formatting |
| Node syntax checks | All frontend ES modules passed |
| Audio download | Eight originals downloaded from composer URLs; SHA-256 hashes recorded and then independently reverified by rerunning the installer |
| MP3 structure | All eight inspected with local `ffprobe`; recognized MP3 streams and expected durations |
| Browser decoding | All eight selected and decoded with finite durations, correct local source URLs, and unpaused playback state; test audio volume muted |
| Playback progression | Cipher's actual media time advanced; pause/resume and keyboard seeking worked |
| Persistent playback | Cipher continued playing while navigating to Settings; exactly one audio element remained mounted |
| Previous/next | Next advanced Cipher → Carefree; seeking to start then Previous returned to Cipher |
| Repeat/shuffle | Repeat one restarted Cipher after seeking to its end; repeat all wrapped Sneaky Snitch → Dreams Become Real; shuffle changed tracks; pure policy tests covered exhaustion and edge cases |
| Search | `piano` returned three source matches; Contemporary combined with that search returned Dreams Become Real; impossible query showed empty state; Clear restored eight tracks |
| Details/credits | Individual source metadata and full license/attribution links rendered correctly |
| Home integration | Real catalogue cards loaded after navigating Home and back to Discover |
| Audio failure/recovery | Temporarily moved a locally installed original; HTTP 404 produced a persistent error. Restored file and pressed Play; decoding resumed and error cleared. Test file restored |
| Backend outage/retry | Stopped backend; catalogue showed connection error and retry button. Restarted backend; retry restored all eight results |
| Responsive layouts | Discover at 320, 390, 768, 1024 and 1440px: document width matched viewport; fixed player remained within viewport; seeking visible. Mobile transport, repeat, shuffle and volume visible |
| Assets | Final catalogue inspection: all rendered illustrations loaded |
| Expected errors | Deliberate offline/missing-file tests generated expected failed network requests; no unhandled application failure observed |

During implementation, a failed media load could incorrectly show “Paused” after its error. The pause-event handler now preserves the unavailable status; the failure/recovery path was retested successfully. An initial search check incorrectly expected two piano matches; the publisher metadata correctly contains three, including electric piano. No catalogue data was changed to fit that expectation.

Test servers are stopped after final verification. Exact startup and verification commands are in README.md.

## Known issues and limitations

- No known blocking Phase 2 defects from the checks above.
- Eight tracks from one composer are sufficient for playback demonstration, not a representative training/evaluation corpus.
- No model, recommendation scores, analytics, stored listening events, user profile, likes/dislikes, or playlist persistence exists yet.
- The source provides no standardized energy/valence/acousticness/instrumentalness or album values for this manifest; these fields remain unknown.
- Source duration is rounded; the player uses decoded media duration, which can differ slightly.
- A clean clone needs network access for the initial audio download. Changed source checksums require explicit source review before updating the manifest.
- Audio installed while the app is open requires a catalogue reload to refresh availability. Playback, queue, volume and filter state are in-memory and reset on full reload.
- Browser QA used the in-app browser; a full cross-browser and accessibility audit remains for Phase 8.
- Publisher source/download URLs may change in future; runtime local playback is independent of them after installation.

## Next phase objectives — not started

**Phase 3: User Preferences and Listening History**

1. Add SQLAlchemy persistence and a reliable local single-user profile.
2. Store favorite genres/artists and preference settings.
3. Implement track likes/dislikes, recorded plays/skips, and listening history.
4. Build Your Library from actual stored data.
5. Add playlist creation, renaming and deletion with persistent user state.
6. Validate reload persistence and database error handling, without adding complex authentication.

## Phase status

| Phase | Status |
| --- | --- |
| 1 — Foundation and design system | Complete |
| 2 — Catalogue and player | Complete; awaiting review |
| 3 — Preferences and history | Not started |
| 4 — Content-based recommendations | Not started |
| 5 — Context-aware recommendations | Not started |
| 6 — Collaborative and hybrid recommendations | Not started |
| 7 — Explorer and analytics | Not started |
| 8 — Polish, documentation, deployment | Not started |

Suggested manual commit: `feat: implement music catalogue and audio playback`
