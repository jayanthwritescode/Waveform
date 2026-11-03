from pathlib import Path
import os,re
from urllib.parse import urlsplit
from pydantic import SecretStr,model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[2]

class Settings(BaseSettings):
    app_name: str = "Waveform"
    app_env: str = "development"
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    database_url: str = "sqlite:///./data/waveform.db"
    auth_required:bool=False
    auth_password_hash:SecretStr|None=None
    auth_secret:SecretStr|None=None
    auth_secure_cookie:bool=True
    public_origin:str|None=None

    @model_validator(mode='after')
    def hosting_auth(self):
        production=self.app_env.casefold()=='production'
        if production:self.auth_required=True
        password=self.auth_password_hash.get_secret_value() if self.auth_password_hash else ''
        secret=self.auth_secret.get_secret_value() if self.auth_secret else ''
        if bool(password)!=bool(secret) or self.auth_required and not (password and secret):raise ValueError('Authentication requires both AUTH_PASSWORD_HASH and AUTH_SECRET')
        if password and not re.fullmatch(r'sc1:[0-9a-f]{32}:[0-9a-f]{64}',password):raise ValueError('Generate AUTH_PASSWORD_HASH with scripts/auth_config.py')
        if secret and len(secret)<32:raise ValueError('AUTH_SECRET must be at least 32 characters')
        if not self.public_origin:self.public_origin=os.environ.get('RENDER_EXTERNAL_URL')
        if self.public_origin:
            self.public_origin=self.public_origin.rstrip('/');url=urlsplit(self.public_origin)
            if url.scheme not in {'http','https'} or not url.netloc or url.path or url.username or url.password or url.query or url.fragment:raise ValueError('PUBLIC_ORIGIN must be an HTTP(S) origin without a path')
        if production and (not self.auth_secure_cookie or not self.public_origin or not self.public_origin.startswith('https://')):raise ValueError('Production requires HTTPS PUBLIC_ORIGIN and secure cookies')
        return self

    model_config = SettingsConfigDict(env_file=ROOT / ".env", extra="ignore",hide_input_in_errors=True)

settings = Settings()
