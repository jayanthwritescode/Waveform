from datetime import date
from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, HttpUrl, StringConstraints, field_validator, model_validator

Label = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]


class ProfileInput(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    favorite_genres: list[Label] = Field(default_factory=list, max_length=50)
    disliked_genres: list[Label] = Field(default_factory=list, max_length=50)
    favorite_artists: list[Label] = Field(default_factory=list, max_length=100)
    energy_min: float = Field(default=0, ge=0, le=1)
    energy_max: float = Field(default=1, ge=0, le=1)
    instrumental_preference: Literal["any", "prefer", "avoid"] = "any"
    discovery_preference: float = Field(default=0.5, ge=0, le=1)
    revision: int = Field(ge=1)

    @field_validator("name")
    @classmethod
    def nonblank_name(cls, value):
        if not value.strip():
            raise ValueError("Profile name cannot be blank")
        return value.strip()

    @field_validator("favorite_genres", "disliked_genres", "favorite_artists")
    @classmethod
    def unique_labels(cls, values):
        return list({value.casefold(): value for value in values}.values())

    @model_validator(mode="after")
    def validate_preferences(self):
        if self.energy_min > self.energy_max:
            raise ValueError("Minimum energy cannot exceed maximum energy")
        if {g.casefold() for g in self.favorite_genres} & {g.casefold() for g in self.disliked_genres}:
            raise ValueError("A genre cannot be both favorite and disliked")
        return self


class ProfileOut(ProfileInput):
    model_config = ConfigDict(from_attributes=True)


class PlaylistTrack(BaseModel):
    id: str = Field(default="", max_length=160)
    catalogue_id: str | None = Field(default=None, max_length=160)
    isrc: str | None = Field(default=None, pattern=r"^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$")
    title: Label
    artist: Label
    album: str | None = Field(default=None, max_length=200)
    genre: str | None = Field(default=None, max_length=120)
    duration_seconds: int | None = Field(default=None, gt=0, le=86400)
    release_year: int | None = Field(default=None, ge=1000, le=9999)
    bpm: float | None = Field(default=None, gt=0, le=1000)
    energy: float | None = Field(default=None, ge=0, le=1)
    valence: float | None = Field(default=None, ge=0, le=1)
    acousticness: float | None = Field(default=None, ge=0, le=1)
    instrumentalness: float | None = Field(default=None, ge=0, le=1)
    instruments: list[Label] = Field(default_factory=list, max_length=100)
    tags: list[Label] = Field(default_factory=list, max_length=100)
    artwork: str = "assets/images/mark.svg"
    source_identifier: str | None = Field(default=None, max_length=160)
    dataset_source: str | None = Field(default=None, max_length=200)
    source_uploaded: date | None = None
    source_url: HttpUrl | None = None
    license_name: str | None = Field(default=None, max_length=100)
    license_url: HttpUrl | None = None
    attribution: str | None = Field(default=None, max_length=2000)
    provenance: Literal["catalogue", "user_import"] = "user_import"

    @field_validator("artwork")
    @classmethod
    def local_art_only(cls, value):
        # Imported files cannot inject remote image requests or arbitrary paths.
        import re
        return value if re.fullmatch(r"assets/images/(?:mark|catalogue-[1-8])\.svg", value) else "assets/images/mark.svg"


class PlaylistInput(BaseModel):
    title: str = Field(min_length=1, max_length=80)
    description: str = Field(default="", max_length=500)
    tracks: list[PlaylistTrack] = Field(default_factory=list, max_length=500)

    @field_validator("title")
    @classmethod
    def nonblank_title(cls, value):
        if not value.strip():
            raise ValueError("Playlist title cannot be blank")
        return value.strip()


class PlaylistUpdate(PlaylistInput):
    revision: int = Field(ge=1)


class PlaylistOut(PlaylistInput):
    model_config = ConfigDict(from_attributes=True)
    id: str
    revision: int
    created_at: str
    updated_at: str


class FeedbackInput(BaseModel):
    value: Literal["like", "dislike"] | None


class ImportInput(BaseModel):
    format: Literal["csv", "txt", "json"]
    content: str = Field(max_length=1_000_000)

    @field_validator("content")
    @classmethod
    def byte_limit(cls, value):
        if len(value.encode("utf-8")) > 1_000_000:
            raise ValueError("The file exceeds the 1 MB UTF-8 import limit")
        return value
