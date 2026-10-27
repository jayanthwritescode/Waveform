from pathlib import Path
from app.config import ROOT
from app.schemas.track import CatalogueManifest, Track, TrackRecord, TrackPage


class CatalogueService:
    def __init__(self, manifest_path: Path, supplements=()):
        self.manifest = CatalogueManifest.model_validate_json(manifest_path.read_text())
        self.manifests = [self.manifest, *[CatalogueManifest.model_validate_json(path.read_text()) for path in supplements]]
        self.records = {}
        self.origins = {}
        for manifest in self.manifests:
            for track in manifest.tracks:
                if track.id in self.records:
                    raise ValueError("Catalogue track IDs must be unique")
                self.records[track.id] = track
                self.origins[track.id] = manifest.name

    def present(self, record: TrackRecord) -> Track:
        metadata = record.model_dump()
        metadata["attribution"] = record.attribution.replace(" Audio unmodified.", "")
        metadata["genres"] = record.genres or [record.genre]
        metadata["isrc"] = record.id if record.id.startswith('USUAN') else record.isrc
        metadata["feature_source"] = record.feature_source or 'Incompetech catalogue metadata'
        identifier = str(int(record.id[4:])) if record.id.startswith('fma-') else record.id
        return Track(**metadata, dataset_source=self.origins[record.id], source_identifier=identifier)

    def resolve_source(self, dataset_source, source_identifier):
        if not dataset_source or not source_identifier: return None
        for record in self.records.values():
            if self.origins[record.id] == dataset_source:
                identifier = str(int(record.id[4:])) if record.id.startswith('fma-') else record.id
                if identifier == source_identifier: return self.present(record)
        return None

    def get(self, track_id: str) -> Track | None:
        record = self.records.get(track_id)
        return self.present(record) if record else None

    def search(self, q: str, genre: str | None, artist: str | None,
               limit: int, offset: int) -> TrackPage:
        terms = q.casefold().split()
        results = []
        for record in self.records.values():
            haystack = " ".join([record.title, record.artist, record.genre,
                                 *record.genres, *record.instruments, *record.tags]).casefold()
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
            catalogue_name="Waveform metadata catalogue",
        )


catalogue = CatalogueService(ROOT / "data/catalogue/tracks.json", [ROOT / "data/catalogue/fma.json"])
