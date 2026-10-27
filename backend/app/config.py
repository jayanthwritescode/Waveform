from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[2]

class Settings(BaseSettings):
    app_name: str = "Waveform"
    app_env: str = "development"
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    audio_dir: str = "data/audio"
    database_url: str = "sqlite:///./data/waveform.db"
    model_config = SettingsConfigDict(env_file=ROOT / ".env", extra="ignore")

settings = Settings()
