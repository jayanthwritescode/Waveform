from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

TrackId = Annotated[str,StringConstraints(min_length=1,max_length=160)]


class RecommendationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    seed_ids: list[TrackId] = Field(default_factory=list,max_length=5)
    exclude_ids: list[TrackId] = Field(default_factory=list,max_length=500)
    use_profile: bool = True
    include_liked: bool = False
    limit: int = Field(default=10,ge=1,le=30)


PreferenceLabel = Annotated[str, StringConstraints(strip_whitespace=True,min_length=1,max_length=120)]


class MomentContext(BaseModel):
    model_config = ConfigDict(extra='forbid')
    mood: Literal['any','calm','happy','energetic','melancholic','relaxed','focused'] = 'any'
    activity: Literal['any','focus','workout','relax','commute','social'] = 'any'
    time_of_day: Literal['any','morning','afternoon','evening','night'] = 'any'
    weather: Literal['any','clear','rainy','overcast','snowy'] = 'any'
    energy_target: float | None = Field(default=None,ge=0,le=1,allow_inf_nan=False)
    instrumental_preference: Literal['any','prefer','avoid'] = 'any'
    favorite_genres: list[PreferenceLabel] = Field(default_factory=list,max_length=20)
    favorite_artists: list[PreferenceLabel] = Field(default_factory=list,max_length=20)
    discovery: float | None = Field(default=None,ge=0,le=1,allow_inf_nan=False)


class ContextRecommendationRequest(RecommendationRequest):
    exclude_ids: list[TrackId] = Field(default_factory=list,max_length=1000)
    context: MomentContext = Field(default_factory=MomentContext)
    length_mode: Literal['count','duration'] = 'count'
    duration_minutes: float | None = Field(default=None,ge=1,le=180,allow_inf_nan=False)

    @model_validator(mode='after')
    def valid_length(self):
        if (self.length_mode == 'duration') != (self.duration_minutes is not None):
            raise ValueError('Provide duration_minutes only with duration length mode')
        return self
