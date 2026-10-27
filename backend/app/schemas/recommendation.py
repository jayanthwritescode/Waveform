from typing import Annotated
from pydantic import BaseModel, ConfigDict, Field, StringConstraints

TrackId = Annotated[str,StringConstraints(min_length=1,max_length=160)]


class RecommendationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    seed_ids: list[TrackId] = Field(default_factory=list,max_length=5)
    exclude_ids: list[TrackId] = Field(default_factory=list,max_length=500)
    use_profile: bool = True
    include_liked: bool = False
    limit: int = Field(default=10,ge=1,le=30)
