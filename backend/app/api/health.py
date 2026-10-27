from fastapi import APIRouter
from pydantic import BaseModel
from app.config import settings

router = APIRouter()

class HealthResponse(BaseModel):
    status: str
    app: str
    phase: float

@router.get("/health", response_model=HealthResponse, tags=["health"])
def health() -> HealthResponse:
    return HealthResponse(status="ok", app=settings.app_name, phase=3)
