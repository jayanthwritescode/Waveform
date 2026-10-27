from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session
from app.database.core import get_session
from app.models.workspace import Profile, RecommendationSession, SavedPlaylist, TrackFeedback, timestamp
from app.schemas.workspace import (FeedbackInput, ImportInput, PlaylistInput, PlaylistOut,
                                   PlaylistUpdate, ProfileInput, ProfileOut)
from app.services.catalogue import catalogue
from app.services.playlists import normalize_playlist
from app.services.portable import export_playlist, import_playlist

router = APIRouter(tags=["local workspace"])
Database = Depends(get_session)
FileFormat = Literal["csv", "txt", "json"]


def profile_record(db):
    profile = db.get(Profile, 1)
    if profile is None:
        profile = Profile(id=1)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


def playlist_record(db, playlist_id):
    record = db.get(SavedPlaylist, playlist_id)
    if record is None:
        raise HTTPException(404, "Playlist not found")
    return record


def file_response(playlist, format):
    media = {"csv":"text/csv", "txt":"text/plain", "json":"application/json"}[format]
    return Response(export_playlist(playlist, format), media_type=media,
                    headers={"Content-Disposition":f'attachment; filename="waveform-playlist.{format}"'})


@router.get("/profile", response_model=ProfileOut)
def get_profile(db: Session = Database):
    return profile_record(db)


@router.put("/profile", response_model=ProfileOut)
def save_profile(payload: ProfileInput, db: Session = Database):
    profile_record(db)
    values = payload.model_dump(exclude={"revision"})
    result = db.execute(update(Profile).where(Profile.id == 1, Profile.revision == payload.revision)
                        .values(**values, revision=payload.revision + 1))
    if not result.rowcount:
        raise HTTPException(409, "Preferences changed in another tab. Reload Settings before saving again.")
    db.commit()
    return db.get(Profile, 1)


@router.get("/feedback")
def list_feedback(db: Session = Database):
    return {row.track_id:row.value for row in db.scalars(select(TrackFeedback))}


@router.put("/feedback/{track_id}")
def set_feedback(track_id: str, payload: FeedbackInput, db: Session = Database):
    if catalogue.get(track_id) is None:
        raise HTTPException(404, "Feedback is supported for catalogue tracks only")
    record = db.get(TrackFeedback, track_id)
    if payload.value is None:
        if record is not None:
            db.delete(record)
    elif record is not None:
        record.value = payload.value
        record.updated_at = timestamp()
    else:
        db.add(TrackFeedback(track_id=track_id, value=payload.value))
    db.commit()
    return {"track_id":track_id, "value":payload.value}


@router.get("/playlists", response_model=list[PlaylistOut])
def list_playlists(db: Session = Database):
    return db.scalars(select(SavedPlaylist).order_by(SavedPlaylist.updated_at.desc(), SavedPlaylist.id)).all()


@router.post("/playlists", response_model=PlaylistOut, status_code=201)
def create_playlist(payload: PlaylistInput, db: Session = Database):
    normalized = normalize_playlist(payload)
    record = SavedPlaylist(**normalized.model_dump(mode="json"))
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/playlists/{playlist_id}", response_model=PlaylistOut)
def get_playlist(playlist_id: str, db: Session = Database):
    return playlist_record(db, playlist_id)


@router.put("/playlists/{playlist_id}", response_model=PlaylistOut)
def update_playlist(playlist_id: str, payload: PlaylistUpdate, db: Session = Database):
    playlist_record(db, playlist_id)
    values = normalize_playlist(payload).model_dump(mode="json")
    result = db.execute(update(SavedPlaylist).where(SavedPlaylist.id == playlist_id,
                        SavedPlaylist.revision == payload.revision)
                        .values(**values, revision=payload.revision + 1, updated_at=timestamp()))
    if not result.rowcount:
        raise HTTPException(409, "This playlist changed in another tab. Your draft is kept; reload the saved version or save a copy.")
    db.commit()
    return db.get(SavedPlaylist, playlist_id)


@router.delete("/playlists/{playlist_id}", status_code=204)
def delete_playlist(playlist_id: str, revision: int = Query(ge=1), db: Session = Database):
    playlist_record(db, playlist_id)
    result = db.execute(delete(SavedPlaylist).where(SavedPlaylist.id == playlist_id, SavedPlaylist.revision == revision))
    if not result.rowcount:
        raise HTTPException(409, "This playlist changed. Reload Your Library before deleting it.")
    db.commit()
    return Response(status_code=204)


@router.get("/playlists/{playlist_id}/export")
def export_saved(playlist_id: str, format: FileFormat, db: Session = Database):
    return file_response(PlaylistOut.model_validate(playlist_record(db, playlist_id)), format)


@router.post("/playlist-export")
def export_draft(payload: PlaylistInput, format: FileFormat):
    return file_response(normalize_playlist(payload), format)


@router.post("/playlist-import")
def preview_import(payload: ImportInput):
    try:
        return import_playlist(payload.content, payload.format)
    except ValueError as error:
        raise HTTPException(422, str(error)) from error


@router.get("/library")
def get_library(db: Session = Database):
    feedback = [{"track":catalogue.get(row.track_id), "value":row.value}
                for row in db.scalars(select(TrackFeedback).order_by(TrackFeedback.updated_at.desc()))
                if catalogue.get(row.track_id) is not None]
    sessions = db.scalars(select(RecommendationSession).order_by(RecommendationSession.created_at.desc()).limit(100)).all()
    return {"profile":ProfileOut.model_validate(profile_record(db)),
            "playlists":[PlaylistOut.model_validate(row) for row in list_playlists(db)],
            "feedback":feedback,
            "recommendation_sessions":[{"id":row.id, "model_name":row.model_name, "context":row.context,
                                        "track_ids":row.track_ids, "created_at":row.created_at} for row in sessions]}
