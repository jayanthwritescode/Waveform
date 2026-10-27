import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from app.api.health import router
from app.api.tracks import router as tracks_router
from app.api.workspace import router as workspace_router
from app.config import settings
from app.api.recommendations import router as recommendations_router
from app.services.recommendations import get_engine, get_context_engine
from app.database.core import initialize_database


@asynccontextmanager
async def lifespan(app):
    initialize_database()
    get_engine()
    get_context_engine()
    yield


app = FastAPI(title=settings.app_name, version="0.5.0", lifespan=lifespan,
              description="Waveform — Your music. Your moment. Context-aware discovery, preferences, playlists and portable exports.")
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins,
                   allow_methods=["GET", "POST", "PUT", "DELETE"], allow_headers=["*"],
                   expose_headers=["Content-Disposition"])


@app.exception_handler(RequestValidationError)
async def invalid_input(request: Request, error: RequestValidationError):
    # Do not reflect entire imported files or preference payloads in validation responses.
    return JSONResponse(status_code=422, content={"detail":[
        {"loc":list(item["loc"]), "msg":item["msg"], "type":item["type"]}
        for item in error.errors()]})


@app.exception_handler(SQLAlchemyError)
async def database_error(request: Request, error: SQLAlchemyError):
    logging.getLogger("waveform").error("Database request failed: %s", type(error).__name__)
    return JSONResponse(status_code=503, content={"detail":"The local database is unavailable. Your editor draft is kept. Check the backend database path and permissions, then retry."})


app.include_router(router, prefix="/api")
app.include_router(tracks_router, prefix="/api")
app.include_router(workspace_router, prefix="/api")

app.include_router(recommendations_router, prefix="/api")
