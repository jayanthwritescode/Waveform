from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.health import router
from app.config import settings
from app.api.tracks import router as tracks_router

app = FastAPI(title=settings.app_name, version="0.2.0", description="Waveform — music that understands your moment. Phase 2 catalogue and audio playback.")
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_methods=["GET", "HEAD"], expose_headers=["Accept-Ranges", "Content-Range", "Content-Length"], allow_headers=["*"])
app.include_router(router, prefix="/api")
app.include_router(tracks_router, prefix="/api")
