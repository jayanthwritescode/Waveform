# Waveform metadata catalogue — Phase 4

The catalogue contains 520 genuine records across 368 artist names and 18 primary genres: the original eight Incompetech records plus a reproducible 512-record FMA metadata subset. No audio or album images were downloaded for Phase 4.

## FMA source and licensing

Source: [FMA: A Dataset for Music Analysis](https://github.com/mdeff/fma), Michaël Defferrard, Kirell Benzi, Pierre Vandergheynst and Xavier Bresson, ISMIR 2017. The official repository distributes metadata under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); recording licenses vary and remain separate. The subset transforms source rows into Waveform's schema, selects records and normalizes dates/labels; it contains no recordings. Each API record retains metadata attribution, license scope, feature provenance and source recording-license text. Reused local illustrations are Waveform assets, not original album art.

The official [2017 metadata ZIP](https://os.unil.cloud.switch.ch/fma/fma_metadata.zip) contains `tracks.csv`, `genres.csv` and `echonest.csv`. `scripts/prepare_fma.py --download` reads only these members through HTTP byte ranges, validates ZIP CRCs and uses atomic writes. It does not download the recording archives. Raw CSVs (~290 MiB) remain ignored in `data/raw/fma/`; they are optional for running the app. Source ZIP member sizes/CRCs and extracted SHA-256 hashes are recorded in `catalogue/fma_provenance.json` and checked on rebuild.

## Reproducible subset

Run `.venv/bin/python scripts/prepare_fma.py --download --build`, or `--build` if the verified raw files are already available. Streaming CSV preprocessing joins exact FMA track IDs to Echonest audio-feature rows. It excludes invalid/bounded title, artist, album, duration and incomplete required feature records. Only factual metadata and source features are copied; biographies and descriptions are excluded.

From 106,574 source track rows, 13,126 eligible records supply a deterministic 512-track subset. Source top genres are used, or derived from the source genre taxonomy when absent. Round-robin genre selection uses SHA-256 track-ID ordering and an initial four-record artist cap. The subset has 367 artist names and 14 primary genres, with 36–37 records per genre. Selection logic, counts, source hashes and output SHA-256 are recorded in provenance. `catalogue/fma.json` is intentionally tracked as a small attributed metadata snapshot so startup is offline and deterministic.

IDs use `fma-` plus six digits; numeric source identifiers remain separate. No ISRC is invented. Album release date supplies release year; source upload date is separate. BPM, energy, valence, acousticness and instrumentalness come from the archived Echonest `audio_features` table, not inferred from titles. The feature source is labeled explicitly; historical feature values need not equal current platform values.

## Original records and preservation

`catalogue/tracks.json` remains byte-for-byte unchanged. The eight Kevin MacLeod / Incompetech records were retrieved from [pieces.json](https://incompetech.com/music/royalty-free/pieces.json) on 27 October 2026. Genre mapping came from the [catalogue](https://incompetech.com/music/royalty-free/music.html). Keep supplied source/CC BY 4.0 links and Kevin MacLeod attribution. Their album, release year and standardized energy/valence/acousticness/instrumentalness remain unknown. Source upload date is not release year.

Historical audio URLs/hashes remain only in the preserved manifest. Public models omit audio fields, and static serving is limited to `frontend/`. All eight ignored legacy MP3s remain untouched and unused. The production SQLite database is separate from source metadata and was preserved during Phase 4 QA, which used a temporary database. Saved playlists/imports/preferences never mutate source manifests.

## User state, portability and limits

Exact catalogue ID, ISRC or dataset/source-ID pairs resolve canonical metadata. Unmatched imports retain explicit user-import provenance and unknown optional values. CSV/TXT carry portable fields; JSON preserves validated full metadata, license scope and feature provenance. No platform availability or destination identity is claimed.

The broader catalogue supports real content-based experiments, but this genre-balanced, historical subset is not a representative relevance benchmark. The 12-seed diagnostic checks correctness, not user relevance accuracy. No collaborative interactions were merged or trained. See [model documentation](../docs/RECOMMENDATION_MODEL.md), [file formats](../docs/FILE_FORMATS.md) and [Phase 3 archive](../docs/history/PHASE_3.md).
