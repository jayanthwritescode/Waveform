# Playlist files and transfer

Waveform downloads metadata, never audio. File creation does not create a streaming playlist.

## CSV

UTF-8 with BOM, CRLF rows, headers `title,artist,album,isrc,duration`. Duration is seconds (fractional seconds supported), unknown fields are empty. Quotes, commas and embedded newlines are escaped using RFC-style quoted cells and doubled quotes. Potential spreadsheet formula cells get an apostrophe prefix; this can affect rare titles beginning with formula characters. JSON retains the exact original values. CSV reimport deliberately preserves apostrophes rather than guessing which are user metadata. The app accepts its CSV and older Track Title/Artist headers, up to 500 records and 1 MB. Duplicate headers, malformed quotes, missing required text and invalid duration values fail without replacing the editor.

Headers and units match the [official Soundiiz CSV format](https://support.soundiiz.com/hc/en-us/articles/360010006793-What-is-the-CSV-format-to-import-playlists-and-favorites), checked 3 November 2026. Files were actually downloaded and parsed in release QA. The documented format was tested locally; a third-party account transfer was not performed.

## TXT / clipboard

One `Artist - Track Title` line per track, UTF-8. Internal newlines flatten to spaces. No numbering, application header or JSON quoting is added. Import splits the first spaced hyphen; artist names containing that delimiter are ambiguous. Use CSV or JSON for precise recovery. TXT intentionally omits IDs/album/duration/context; it is a portable tracklist, not a full backup.

## JSON

`{"format":"waveform-playlist","version":2,"playlist":{...}}` retains title, description, context, source IDs, normalized metadata and actual recommendation details. The older Waveform JSON v1 format is accepted for migration; no old SQLite database is read or modified. Old structured TXT v1 is historical and is not accepted by the simplified importer; export JSON from the old app instead.

Imported portable rows receive local imported identities; title matching does not claim MusicBrainz or streaming identity. Stable JSON IDs remain stable. Import previews are explicit and replacing a dirty editor uses its existing guard. Download JSON backups before clearing browser storage or switching origins/devices.

## Soundiiz workflow

1. Download CSV, or copy the TXT-format tracklist.
2. Open [Soundiiz](https://soundiiz.com/) and sign in there if desired.
3. Under Playlists choose Import Playlist → From File, or From Plain Text for a copied list.
4. Review detected tracks and choose a destination following Soundiiz’s own prompts.
5. Review unresolved songs and alternate versions at the destination.

These are [documented import methods](https://support.soundiiz.com/hc/en-us/articles/37958924057234-How-to-Import-a-Playlist-from-a-URL-CSV-File-or-Plain-Text). No local file is uploaded automatically, arbitrary Waveform URLs are not represented as supported imports, and success is never inferred. Soundiiz has its own account/streaming connection requirements and [plan limits](https://soundiiz.com/pricing); optional third-party features may cost money. Waveform itself requires no account, subscription or paid hosting. Spotify/Apple Music/YouTube Music search links remain available independently.

## Full-library backup (1.1)

Settings exports a separate `waveform-library` JSON v1 envelope containing the versioned workspace and a draft snapshot, up to 5 MB. This is distinct from a single-playlist JSON file. Restore previews the file before changes, adds missing playlists, skips identical versions, and copies conflicting IDs with a restored suffix. It merges favorites/history without overwriting current feedback. Preferences are restored only when selected, with a fresh local revision. The current editor remains untouched; a backed-up draft can be downloaded separately. Exceeding capacity or validation failure changes nothing. A blocked/full browser store retains the visible temporary-memory warning rather than promising durable restoration.
