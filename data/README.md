# Waveform metadata catalogue — Phase 2.5

## Preserved source records

The original `catalogue/tracks.json` is preserved byte-for-byte from Phase 2. It contains eight genuine Kevin MacLeod tracks, retrieved from the public [Incompetech pieces.json](https://incompetech.com/music/royalty-free/pieces.json) on 27 October 2026. Genre IDs were mapped using the [catalogue page](https://incompetech.com/music/royalty-free/music.html). Phase 2.5 repurposes those factual records for discovery and playlist drafts.

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


## Available and missing metadata

Titles, artist, ISRC, genre, duration, source-provided tempo, instrument labels, feel tags, source upload date, credits and source URLs are available. The API also supplies the catalogue name as `dataset_source` and the ISRC as `source_identifier`.

Album, release year, energy, valence, acousticness and instrumentalness are unavailable and remain null. `source_uploaded` is an upload date, not a release date. Playlist duration is an estimate from source durations; unknown durations will be labeled rather than invented. The illustrations are original Waveform assets, not source album art.

One composer, eight tracks and five genres are adequate for exercising search/draft editing but insufficient for representative recommendation evaluation or collaborative training. No preference/feedback, user-item interactions, trained model, generated session or reliable platform track matching exists. Do not assume these records are on every streaming service.

## Provenance and credits

Keep attribution to Kevin MacLeod / incompetech.com and the supplied [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) license/source links with the catalogue. Individual track pages retain those credits. No additional music or cover art is downloaded during this phase.

The original JSON includes historical `audio_source_url`, `audio_sha256` and audio-use attribution wording. These remain in the original file for provenance and preservation, but public API models ignore audio fields and presented credits omit the obsolete “Audio unmodified” notice. The raw file is not exposed through an API/static route.

## Legacy audio preservation

Existing MP3 files remain untouched in ignored `data/audio/`. They are not deleted, read, indexed, served or needed by Waveform. The download script, streaming route, AUDIO_DIR setting and player were removed. The frontend static server must continue serving only `frontend/`, as documented; do not point it at the repository root.

No database or user-generated playlist file existed at the audit. No migration or data deletion was needed. Phase 2 documentation is archived in `docs/history/PHASE_2.md`.

## Future dataset strategy

The earlier source evaluation is retained in the historical checkpoint: [FMA](https://github.com/mdeff/fma) provides metadata and feature data suitable for later content-based experiments; [HetRec Last.fm](https://lenskit.grouplens.org/datasets/hetrec-2011/) is an artist-interaction candidate for a separate collaborative experiment. Neither was imported or trained. Review their licenses and feature coverage before using them. Do not merge unaligned artist-level interactions with these track records or fabricate matches.

A broader legitimate metadata dataset and documented preprocessing are Phase 4 work. Direct platform identifiers need reliable matching; until then Phase 3 will use properly encoded external search queries and portable file workflows. Neither exports nor direct integrations are implemented in Phase 2.5.

`raw/` and `processed/` remain reserved/ignored. There is no training catalogue or trained artifact yet.
