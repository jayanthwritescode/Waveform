from pathlib import Path
from app.config import ROOT
from app.schemas.track import CatalogueManifest, Track, TrackRecord, TrackPage


class CatalogueService:
    def __init__(self, manifest_path: Path):
        self.manifest = CatalogueManifest.model_validate_json(manifest_path.read_text())
        self.records = {track.id: track for track in self.manifest.tracks}
        if len(self.records) != len(self.manifest.tracks):
            raise ValueError("Catalogue track IDs must be unique")

    def present(self, record: TrackRecord) -> Track:
        metadata = record.model_dump()
        # Keep the historical manifest intact; omit its obsolete audio-use notice in the UI.
        metadata["attribution"] = record.attribution.replace(" Audio unmodified.", "")
        return Track(**metadata, dataset_source=self.manifest.name,
                     source_identifier=record.id)

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


catalogue = CatalogueService(ROOT / "data/catalogue/tracks.json")
