from datetime import date
from typing import Literal
from pydantic import BaseModel, Field, HttpUrl


class TrackRecord(BaseModel):
    """Only source metadata and documented nulls; no estimated audio features."""
    id: str = Field(pattern=r"^USUAN[0-9]{7}$")
    title: str
    artist: str
    album: str | None
    release_year: int | None = Field(default=None, ge=1000, le=9999)
    genre: str
    duration_seconds: int = Field(gt=0)
    bpm: float | None = Field(default=None, gt=0)
    instruments: list[str]
    tags: list[str]
    energy: float | None = Field(default=None, ge=0, le=1)
    valence: float | None = Field(default=None, ge=0, le=1)
    acousticness: float | None = Field(default=None, ge=0, le=1)
    instrumentalness: float | None = Field(default=None, ge=0, le=1)
    artwork: str = Field(pattern=r"^assets/images/catalogue-[0-9]+\.svg$")
    source_url: HttpUrl
    license_name: Literal["CC BY 4.0"]
    license_url: HttpUrl
    attribution: str
    source_uploaded: date


class CatalogueManifest(BaseModel):
    name: str
    version: int
    retrieved_on: date
    metadata_url: HttpUrl
    license_source: HttpUrl
    tracks: list[TrackRecord]


class Track(TrackRecord):
    dataset_source: str
    source_identifier: str


class TrackPage(BaseModel):
    items: list[Track]
    total: int
    limit: int
    offset: int
    genres: list[str]
    artists: list[str]
    catalogue_name: str
