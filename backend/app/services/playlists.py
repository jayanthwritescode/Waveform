import hashlib
from app.schemas.workspace import PlaylistInput, PlaylistTrack
from app.services.catalogue import catalogue


def normalize_playlist(payload: PlaylistInput) -> PlaylistInput:
    tracks = []
    seen = set()
    for track in payload.tracks:
        # Match only a stable catalogue ID or exact ISRC, never artist/title guesses.
        known_id = track.catalogue_id or track.isrc or track.id
        known = catalogue.get(known_id)
        if known:
            values = known.model_dump(mode="json")
            values.update(catalogue_id=known.id, isrc=known.id, provenance="catalogue")
            track = PlaylistTrack.model_validate(values)
        else:
            values = track.model_dump(mode="json")
            identity = "|".join([track.isrc or "", track.title.casefold(), track.artist.casefold()])
            values.update(id="import:" + hashlib.sha256(identity.encode()).hexdigest()[:24],
                          catalogue_id=None, provenance="user_import")
            track = PlaylistTrack.model_validate(values)
        if track.id not in seen:
            seen.add(track.id)
            tracks.append(track)
    return PlaylistInput(title=payload.title, description=payload.description, tracks=tracks)
