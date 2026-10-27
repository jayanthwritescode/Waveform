# Portable playlist files — Phase 3

These are portable files and platform search links, **not direct transfers**. Waveform does not claim that Spotify, Apple Music or YouTube Music directly imports these formats or has confirmed playlist creation. Availability/exact platform matches are unverified.

## Export/import workflow

The builder can export its current editor state without saving it first. Saved playlists also have file exports in Your Library. Every file uses UTF-8. JSON preserves complete validated playlist/track metadata; CSV/TXT preserve a documented portable subset.

Select a file in the builder to get an import preview. Validation happens before editor replacement or database writes. The preview reports exact catalogue matches, unmatched imported records, duplicate removal and format limitations. **Replace editor with imported playlist** explicitly loads a new unsaved draft. Saving creates a new local playlist; file IDs/revisions never overwrite an existing saved playlist implicitly.

Limits: 1,000,000 UTF-8 bytes, up to 500 tracks, playlist title 80 characters, description 500, track title/artist 120. Missing optional metadata remains unknown. Invalid imports keep the current editor and saved library unchanged.

## JSON v1

The outer object has `format: "waveform-playlist"`, `version: 1`, and `playlist` containing title, description and ordered tracks. Exporting a saved playlist also includes its local ID, revision and timestamps; import treats those as provenance, not update instructions.

Each validated track retains title, artist, album, duration_seconds, genre, available numerical features, source tags/instruments/upload date, ISRC, dataset/source identifiers, source/license URLs and attribution. Unknown fields, audio URLs or account credentials are not stored. No file can inject platform API credentials or media playback.

Catalogue IDs and exact known ISRCs resolve to canonical metadata from the catalogue, including its actual credit information. Unknown tracks receive stable `import:` IDs, `provenance: "user_import"`, no catalogue ID, and an explicit unmatched warning. There is no artist/title fuzzy match or cross-platform matching claim. Artwork is restricted to Waveform's local illustrations; imported image URLs do not cause remote requests.

## CSV

Required import headers: **Track Title**, **Artist**. Optional recognized headers:

- Playlist Title, Playlist Description
- Album, Duration Seconds, ISRC
- Source Identifier, Dataset Source, Genre, Source URL
- CSV Escaping (reserved for Waveform exports)

Duration Seconds must be a positive integer or blank, not `mm:ss`. Album/ISRC/source values may be blank. The first row supplies playlist title/description; a generic CSV without them uses “Imported playlist”. Rows with both track title and artist blank are skipped, which allows an empty playlist export to preserve metadata. Other incomplete rows are rejected.

Exports repeat playlist metadata on each row and quote all fields using Python's CSV writer. Commas, quotes, Unicode and multiline descriptions/titles are escaped correctly. Potential spreadsheet formulas/leading control characters are prefixed with an apostrophe. Existing leading apostrophes are also escaped, and the `CSV Escaping=waveform-v1` marker permits exact reversal on import. Third-party transfer tools may expose these prefixes; JSON remains the lossless option.

## TXT

TXT import accepts **Waveform playlist v1 exports**, not arbitrary free-form music lists. Exports are a readable numbered list with escaped field values:

```text
Waveform playlist v1
Title: "A playlist title"
Description: "A description"

Track 1:
  Track Title: "A track title"
  Artist: "An artist"
  Album: null
  Duration Seconds: null
  ISRC: null
  Source Identifier: null
  Dataset Source: null
  Genre: null
  Source URL: null
```

This is a schema illustration, not an actual catalogue record. String values use JSON quoting to preserve Unicode, quotes and embedded line breaks. Optional unknown values are `null`. Every block retains track order. Unrecognized fields/malformed values are rejected rather than guessed.

## Platform search links

Links encode the artist and track title as a search query on these public interfaces:

- [Spotify search](https://open.spotify.com/search)
- [Apple Music search](https://music.apple.com/us/search)
- [YouTube Music search](https://music.youtube.com/search?q=music)

Links are generated from fixed HTTPS origins, use encoded query/path values and `noopener noreferrer`, and require no linked account in Waveform. They open searches, not guessed song IDs or export APIs. Music services may redirect to a regional site or require their own login. No third-party account tokens, scopes, private endpoints or scraping are used.

## Phase 4 FMA identities

FMA catalogue IDs use `fma-` plus six digits. They are not ISRCs; ISRC remains null when the source does not supply it. CSV/TXT imports also resolve the exact pair `dataset_source = FMA metadata subset (2017)` and numeric `source_identifier`. These portable fields preserve canonical FMA identity without fuzzy title matching. JSON retains source genres, feature provenance, metadata license scope and separate recording-license text. Canonical matches restore full current catalogue metadata; no streaming-platform match is claimed.
