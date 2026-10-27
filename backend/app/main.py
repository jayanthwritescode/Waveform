from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.health import router
from app.config import settings

app = FastAPI(title=settings.app_name, version="0.1.0", description="Waveform — music that understands your moment. Phase 1 foundation.")
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_methods=["GET"], allow_headers=["*"])
app.include_router(router, prefix="/api")
