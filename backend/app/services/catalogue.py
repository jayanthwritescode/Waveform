from pathlib import Path
from app.config import ROOT, settings
from app.schemas.track import CatalogueManifest, Track, TrackRecord, TrackPage


class CatalogueService:
    def __init__(self, manifest_path: Path, audio_dir: Path):
        self.manifest = CatalogueManifest.model_validate_json(manifest_path.read_text())
        self.audio_dir = audio_dir
        self.records = {track.id: track for track in self.manifest.tracks}
        if len(self.records) != len(self.manifest.tracks):
            raise ValueError("Catalogue track IDs must be unique")

    def audio_path(self, track_id: str) -> Path | None:
        # Resolve only a validated ID from the curated manifest, never a user path.
        if track_id not in self.records:
            return None
        path = self.audio_dir / f"{track_id}.mp3"
        return path if path.is_file() and path.stat().st_size > 0 else None

    def present(self, record: TrackRecord) -> Track:
        available = self.audio_path(record.id) is not None
        return Track(**record.model_dump(), audio_available=available,
                     audio_url=f"/api/tracks/{record.id}/audio" if available else None)

    def get(self, track_id: str) -> Track | None:
        record = self.records.get(track_id)
        return self.present(record) if record else None

    def search(self, q: str, genre: str | None, artist: str | None,
               limit: int, offset: int) -> TrackPage:
        terms = q.casefold().split()
        results = []
        for record in self.records.values():
            haystack = " ".join([record.title, record.artist, record.genre,
                                 *record.instruments, *record.tags]).casefold()
            if terms and not all(term in haystack for term in terms):
                continue
            if genre and record.genre.casefold() != genre.casefold():
                continue
            if artist and record.artist.casefold() != artist.casefold():
                continue
            results.append(record)
        return TrackPage(
            items=[self.present(record) for record in results[offset:offset + limit]],
            total=len(results), limit=limit, offset=offset,
            genres=sorted({record.genre for record in self.records.values()}),
            artists=sorted({record.artist for record in self.records.values()}),
            catalogue_name=self.manifest.name,
        )


audio_dir = Path(settings.audio_dir)
if not audio_dir.is_absolute():
    audio_dir = ROOT / audio_dir
catalogue = CatalogueService(ROOT / "data/catalogue/tracks.json", audio_dir)
