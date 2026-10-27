from fastapi import APIRouter, HTTPException, Query
from app.schemas.track import Track, TrackPage
from app.services.catalogue import catalogue

router = APIRouter(prefix="/tracks", tags=["catalogue"])


@router.get("", response_model=TrackPage)
def list_tracks(
    q: str = Query(default="", max_length=120),
    genre: str | None = Query(default=None, max_length=80),
    artist: str | None = Query(default=None, max_length=120),
    limit: int = Query(default=24, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> TrackPage:
    return catalogue.search(q, genre, artist, limit, offset)


@router.get("/{track_id}", response_model=Track)
def track_detail(track_id: str) -> Track:
    track = catalogue.get(track_id)
    if track is None:
        raise HTTPException(status_code=404, detail="Track not found")
    return track
