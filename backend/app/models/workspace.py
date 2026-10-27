from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import JSON, CheckConstraint, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database.core import Base


def timestamp():
    return datetime.now(timezone.utc).isoformat()


class Profile(Base):
    __tablename__ = "profiles"
    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    name: Mapped[str] = mapped_column(String(80), default="Your space")
    favorite_genres: Mapped[list] = mapped_column(JSON, default=list)
    disliked_genres: Mapped[list] = mapped_column(JSON, default=list)
    favorite_artists: Mapped[list] = mapped_column(JSON, default=list)
    energy_min: Mapped[float] = mapped_column(default=0.0)
    energy_max: Mapped[float] = mapped_column(default=1.0)
    instrumental_preference: Mapped[str] = mapped_column(String(12), default="any")
    discovery_preference: Mapped[float] = mapped_column(default=0.5)
    revision: Mapped[int] = mapped_column(default=1)
    __table_args__ = (CheckConstraint("id = 1", name="single_local_profile"),)


class SavedPlaylist(Base):
    __tablename__ = "playlists"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    title: Mapped[str] = mapped_column(String(80))
    description: Mapped[str] = mapped_column(Text, default="")
    tracks: Mapped[list] = mapped_column(JSON, default=list)
    revision: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[str] = mapped_column(String(40), default=timestamp)
    updated_at: Mapped[str] = mapped_column(String(40), default=timestamp)


class TrackFeedback(Base):
    __tablename__ = "track_feedback"
    track_id: Mapped[str] = mapped_column(String(160), primary_key=True)
    value: Mapped[str] = mapped_column(String(8))
    updated_at: Mapped[str] = mapped_column(String(40), default=timestamp)
    __table_args__ = (CheckConstraint("value IN ('like', 'dislike')", name="valid_feedback"),)


class RecommendationSession(Base):
    """Reserved for real engine output in Phase 4; no simulated sessions are inserted."""
    __tablename__ = "recommendation_sessions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    model_name: Mapped[str] = mapped_column(String(80))
    context: Mapped[dict] = mapped_column(JSON, default=dict)
    track_ids: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[str] = mapped_column(String(40), default=timestamp)
