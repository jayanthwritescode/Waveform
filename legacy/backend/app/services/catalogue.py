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

        self._public={key:self.present(record) for key,record in self.records.items()}
        self._source={ (track.dataset_source,track.source_identifier):key for key,track in self._public.items() }
        self._identity={}
        self._search={}
        for key,record in self.records.items():
            identity=(' '.join(record.title.casefold().split()),' '.join(record.artist.casefold().split()))
            self._identity.setdefault(identity,[]).append(key)
            self._search[key]=' '.join([record.title,record.artist,record.genre,*record.genres,*record.instruments,*record.tags]).casefold()
        self._genres=sorted({record.genre for record in self.records.values()})
        self._artists=sorted({record.artist for record in self.records.values()})

    def present(self, record: TrackRecord) -> Track:
        metadata = record.model_dump()
        metadata["attribution"] = record.attribution.replace(" Audio unmodified.", "")
        metadata["genres"] = record.genres or [record.genre]
        metadata["isrc"] = record.id if record.id.startswith('USUAN') else record.isrc
        metadata["feature_source"] = record.feature_source or 'Incompetech catalogue metadata'
        identifier = str(int(record.id[4:])) if record.id.startswith('fma-') else record.id
        return Track(**metadata, dataset_source=self.origins[record.id], source_identifier=identifier)

    def resolve_source(self,dataset_source,source_identifier):
        if not dataset_source or not source_identifier:return None
        dataset_source=dataset_source.strip();source_identifier=source_identifier.strip()
        if dataset_source=='FMA metadata subset (2017)' and source_identifier.isascii() and source_identifier.isdigit():source_identifier=str(int(source_identifier))
        return self.get(self._source.get((dataset_source,source_identifier)))

    def identity_candidates(self,title,artist):
        key=(' '.join(title.casefold().split()),' '.join(artist.casefold().split()))
        return [self.get(identifier) for identifier in self._identity.get(key,[])]

    def get(self,track_id):
        track=self._public.get(track_id)
        return track.model_copy(deep=True) if track else None

    def search(self, q: str, genre: str | None, artist: str | None,
               limit: int, offset: int) -> TrackPage:
        terms = q.casefold().split()
        results = []
        for record in self.records.values():
            haystack = self._search[record.id]
            if terms and not all(term in haystack for term in terms):
                continue
            if genre and record.genre.casefold() != genre.casefold():
                continue
            if artist and record.artist.casefold() != artist.casefold():
                continue
            results.append(record)
        return TrackPage(
            items=[self.get(record.id) for record in results[offset:offset + limit]],
            total=len(results), limit=limit, offset=offset,
            genres=self._genres,
            artists=self._artists,
            catalogue_name="Waveform metadata catalogue",
        )


catalogue = CatalogueService(ROOT / "data/catalogue/tracks.json", [ROOT / "data/catalogue/fma.json"])
