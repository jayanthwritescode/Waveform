#!/usr/bin/env python3
"""Install the curated, credited CC BY 4.0 originals; audio remains Git-ignored."""
import argparse
import hashlib
import json
import sys
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
MAX_BYTES = 40 * 1024 * 1024
sys.path.insert(0, str(ROOT / "backend"))
from app.config import settings  # noqa: E402


def download(track: dict, destination: Path) -> None:
    expected = track.get("audio_sha256")
    if destination.exists() and expected:
        if hashlib.sha256(destination.read_bytes()).hexdigest() == expected:
            print(f"Already verified: {track['title']}")
            return
    url = track["audio_source_url"]
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.hostname != "incompetech.com":
        raise ValueError("Audio source must be the verified HTTPS composer catalogue")
    temporary = destination.with_suffix(".mp3.part")
    digest = hashlib.sha256()
    size = 0
    try:
        request = Request(url, headers={"User-Agent": "Waveform/0.2 (licensed local playback)"})
        with urlopen(request, timeout=45) as response, temporary.open("wb") as output:
            if response.headers.get_content_type() not in {"audio/mpeg", "application/octet-stream"}:
                raise ValueError("Source did not return MP3 audio")
            while chunk := response.read(128 * 1024):
                size += len(chunk)
                if size > MAX_BYTES:
                    raise ValueError("Audio exceeded the 40 MiB per-track download limit")
                digest.update(chunk)
                output.write(chunk)
        if size < 1024:
            raise ValueError("Audio response was unexpectedly small")
        if expected and digest.hexdigest() != expected:
            raise ValueError("Checksum changed; review the source before replacing the pinned original")
        temporary.replace(destination)
        print(f"Installed: {track['title']} ({size:,} bytes, SHA-256 {digest.hexdigest()})")
    finally:
        temporary.unlink(missing_ok=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--track", action="append", help="Install only this ISRC (repeatable)")
    parser.add_argument("--audio-dir", type=Path, help="Override AUDIO_DIR; defaults to project data/audio")
    args = parser.parse_args()
    tracks = json.loads((ROOT / "data/catalogue/tracks.json").read_text())["tracks"]
    if args.track:
        unknown = set(args.track) - {track["id"] for track in tracks}
        if unknown:
            parser.error(f"Unknown track IDs: {', '.join(sorted(unknown))}")
        tracks = [track for track in tracks if track["id"] in args.track]
    directory = args.audio_dir or Path(settings.audio_dir)
    if not directory.is_absolute():
        directory = ROOT / directory
    directory.mkdir(parents=True, exist_ok=True)
    failed = 0
    for track in tracks:
        try:
            download(track, directory / f"{track['id']}.mp3")
        except (OSError, ValueError) as error:
            failed += 1
            print(f"Could not install {track['title']}: {error}")
    print("Credits: Kevin MacLeod (incompetech.com), CC BY 4.0. See data/README.md.")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
