"""Portable playlist files, independent of platform matching or authorization."""
import csv
import io
import json
import re
from pydantic import ValidationError
from app.schemas.workspace import PlaylistInput
from app.services.playlists import normalize_playlist

FIELDS = {"Track Title":"title", "Artist":"artist", "Album":"album", "Duration Seconds":"duration_seconds",
          "ISRC":"isrc", "Source Identifier":"source_identifier", "Dataset Source":"dataset_source",
          "Genre":"genre", "Source URL":"source_url"}


def safe_cell(value):
    text = "" if value is None else str(value)
    if text.startswith(("'", "\t", "\r", "\n")) or text.lstrip().startswith(("=", "+", "-", "@")):
        return "'" + text
    return text


def export_playlist(playlist, format):
    data = playlist.model_dump(mode="json")
    if format == "json":
        return json.dumps({"format":"waveform-playlist", "version":1, "playlist":data}, ensure_ascii=False, indent=2) + "\n"
    if format == "csv":
        output = io.StringIO(newline="")
        headers = ["Playlist Title", "Playlist Description", *FIELDS, "CSV Escaping"]
        writer = csv.DictWriter(output, fieldnames=headers, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        for track in data["tracks"] or [{}]:
            row = {"Playlist Title":data["title"], "Playlist Description":data["description"],
                   **{label:track.get(key) for label,key in FIELDS.items()}}
            writer.writerow({**{key:safe_cell(value) for key,value in row.items()}, "CSV Escaping":"waveform-v1"})
        return output.getvalue()
    lines = ["Waveform playlist v1", f'Title: {json.dumps(data["title"], ensure_ascii=False)}',
             f'Description: {json.dumps(data["description"], ensure_ascii=False)}', ""]
    for index,track in enumerate(data["tracks"],1):
        lines.append(f"Track {index}:")
        for label,key in FIELDS.items():
            lines.append(f"  {label}: {json.dumps(track.get(key), ensure_ascii=False)}")
        lines.append("")
    return "\n".join(lines) + "\n"


def import_playlist(content: str, format: str):
    content = content.lstrip("\ufeff")
    warnings = []
    if not content.strip():
        raise ValueError("The playlist file is empty")
    try:
        if format == "json":
            value = json.loads(content)
            if not isinstance(value, dict) or value.get("format") != "waveform-playlist" or value.get("version") != 1:
                raise ValueError("Use a Waveform playlist JSON export (version 1)")
            data = value["playlist"]
        elif format == "csv":
            reader = csv.DictReader(io.StringIO(content, newline=""), strict=True)
            if not reader.fieldnames or not {"Track Title","Artist"}.issubset(reader.fieldnames):
                raise ValueError("CSV must include Track Title and Artist columns")
            rows = list(reader)
            if len(rows) > 500:
                raise ValueError("A playlist can contain at most 500 tracks")
            data = {"title":"Imported playlist", "description":"", "tracks":[]}
            for index,row in enumerate(rows):
                if None in row:
                    raise ValueError("CSV row has more values than the header")
                if row.get("CSV Escaping") == "waveform-v1":
                    row = {key:(value[1:] if value and value.startswith("'") else value) for key,value in row.items()}
                if index == 0:
                    data.update(title=row.get("Playlist Title") or "Imported playlist", description=row.get("Playlist Description") or "")
                if not row.get("Track Title") and not row.get("Artist"):
                    continue
                track = {key:row.get(label) or None for label,key in FIELDS.items()}
                if track["duration_seconds"] is not None:
                    try:
                        track["duration_seconds"] = int(track["duration_seconds"])
                    except ValueError as error:
                        raise ValueError("Duration Seconds must be a positive integer or blank") from error
                data["tracks"].append(track)
        else:
            lines = content.splitlines()
            if not lines or lines[0] != "Waveform playlist v1":
                raise ValueError("TXT import supports Waveform playlist v1 exports")
            data = {"title":"Imported playlist", "description":"", "tracks":[]}
            track = None
            for line in lines[1:]:
                if not line.strip():
                    continue
                if re.fullmatch(r"Track [1-9][0-9]*:",line):
                    track = {}
                    data["tracks"].append(track)
                    continue
                key, separator, value = line.partition(": ")
                if not separator:
                    raise ValueError("Unrecognized TXT field")
                if key in {"Title","Description"} and track is None:
                    data[key.lower()] = json.loads(value)
                elif track is not None and key.strip() in FIELDS:
                    track[FIELDS[key.strip()]] = json.loads(value)
                else:
                    raise ValueError("Unrecognized TXT field")
        original = PlaylistInput.model_validate(data)
        normalized = normalize_playlist(original)
    except (KeyError, TypeError, json.JSONDecodeError, csv.Error, ValidationError, OverflowError) as error:
        raise ValueError("Invalid playlist file: check required fields, durations, limits and format version") from error
    removed = len(original.tracks) - len(normalized.tracks)
    imported = sum(track.provenance == "user_import" for track in normalized.tracks)
    if removed:
        warnings.append(f"Removed {removed} duplicate track(s).")
    if imported:
        warnings.append(f"{imported} track(s) are user-imported metadata, not matched to the catalogue or any music platform.")
    if format != "json":
        warnings.append("CSV/TXT preserve portable fields. Use JSON to retain full track metadata.")
    return {"playlist":normalized.model_dump(mode="json"), "warnings":warnings,
            "catalogue_matches":len(normalized.tracks)-imported, "unmatched_tracks":imported}
