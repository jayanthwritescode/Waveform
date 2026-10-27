# Waveform data and audio — Phase 2

## Selected playback collection

Waveform ships a curated metadata manifest for **eight Kevin MacLeod tracks** from the composer's [Incompetech catalogue](https://incompetech.com/music/royalty-free/music.html). The factual fields were retrieved from the public [pieces.json](https://incompetech.com/music/royalty-free/pieces.json) on 27 October 2026. Genre IDs were mapped using the genre lookup on that same catalogue page.

This is a small curated playback collection, not a research benchmark or a trained recommendation dataset. All eight tracks are from one composer. There are no user interactions, recommendation scores, or invented audio features.

| ISRC | Title | Source genre | Source duration |
| --- | --- | --- | --- |
| USUAN1500027 | Dreams Become Real | Contemporary | 6:50 |
| USUAN1100844 | Cipher | Electronica | 3:51 |
| USUAN1400037 | Carefree | Contemporary | 3:25 |
| USUAN1300010 | Local Forecast | Jazz | 2:45 |
| USUAN1400011 | Monkeys Spinning Monkeys | Soundtrack | 2:05 |
| USUAN2100030 | Space Jazz | Jazz | 6:10 |
| USUAN1100192 | Ishikari Lore | World | 2:44 |
| USUAN1100772 | Sneaky Snitch | Soundtrack | 2:17 |

The manifest retains source titles, artist, ISRC, genre, tempo, duration, instruments, feel tags, upload date, direct audio source, and source-page URL. `source_uploaded` is the catalogue's upload date, not an asserted recording/release date. `album`, `energy`, `valence`, `acousticness`, and `instrumentalness` remain null because those values are not supplied. Source tempo is not an independently measured tempo. Player duration uses decoded media metadata and can differ slightly from the catalogue's rounded duration.

## License and attribution

The current catalogue provides each track under **Creative Commons Attribution 4.0 International** and provides a visible attribution template. See the composer's [music FAQ](https://incompetech.com/music/royalty-free/faq.html) and [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/).

Attribution for each track above: **“[Track title]” — Kevin MacLeod (incompetech.com), licensed under Creative Commons Attribution 4.0.** Individual source URLs, license links, and full credit text are retained in `catalogue/tracks.json` and displayed on each track's detail page. Catalogue-level attribution appears on Home and Discover; the persistent player links to individual credits.

Audio files are downloaded unmodified from the composer's published download URLs. No audio is scraped from restricted streaming platforms. Waveform does not claim ownership of the music or imply composer endorsement. The illustrations are original Waveform graphics and are explicitly labeled as illustrations, not original album covers. The original fictional Phase 1 sample metadata is no longer used by the app.

## Installing audio

From the repository root, after installing Python dependencies:

```sh
.venv/bin/python scripts/download_audio.py
```

The installer uses the same `.env` / `AUDIO_DIR` configuration as FastAPI. Override with `--audio-dir /absolute/path` if needed, or select a track with repeated `--track ISRC` arguments. It downloads only curated HTTPS source URLs, writes to temporary files, verifies SHA-256 checksums pinned from the verified Phase 2 downloads, and then replaces the destination atomically. A checksum change stops replacement so the new source can be reviewed. Verified existing files are reused without network access. A failed download leaves a useful error, removes the partial file, and exits nonzero after processing remaining tracks.

The eight MP3 files total approximately 60 MiB. They are deliberately Git-ignored under `data/audio/`; a fresh clone needs this download step. Catalogue metadata and illustrations are tracked. Neither FastAPI nor the browser contacts Incompetech during normal local playback. If audio is missing, the API reports `audio_available: false`, the UI labels the track, and selection shows installation instructions. Reload the catalogue after installing missing files.

## Dataset evaluation and later experiments

| Candidate | Useful data | Playback / licensing / scope limits | Decision |
| --- | --- | --- | --- |
| [Incompetech public catalogue](https://incompetech.com/music/royalty-free/music.html) | Real titles, ISRCs, genres, BPM, duration, instruments, source tags; public MP3 downloads | One composer in this curated subset; no user interaction history or standardized energy/valence features; attribution required | Selected for reproducible local playback and initial metadata foundation |
| [FMA](https://github.com/mdeff/fma) | Track/artist metadata, genre taxonomy, extracted features; metadata spans 106,574 tracks | Metadata CC BY 4.0; audio uses per-artist licenses, which must be checked; smallest audio subset is about 7.2 GiB; no ready-made Waveform listening history | Suitable candidate for later content-based experiments; not downloaded, imported, or trained in Phase 2 |
| [HetRec 2011 Last.fm](https://lenskit.grouplens.org/datasets/hetrec-2011/) | Artist-level listening counts and tags from around 1,900 users | Artist-level interactions do not identify these playback tracks; does not supply this audio; its own README/license must be reviewed before use | Candidate for a separate collaborative benchmark in Phase 6, not merged with this collection |

There is **no training catalogue yet**. No reliable mapping has been established between this collection and FMA or Last.fm. Future experiments must retain source identifiers, document feature coverage and missing values, and keep unaligned benchmarks separate from app personalization. Larger experiments are not represented as recommendations in this phase.

`raw/` and `processed/` remain reserved and ignored for later dataset work. No trained artifacts or local database are included.
