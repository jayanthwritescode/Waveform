from pathlib import Path
from sqlalchemy import create_engine, event
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from app.config import ROOT, settings


class Base(DeclarativeBase):
    pass


def build_engine(database_url: str):
    url = make_url(database_url)
    if url.get_backend_name() == "sqlite" and url.database not in {None, "", ":memory:"}:
        path = Path(url.database)
        if not path.is_absolute():
            path = ROOT / path
        path.parent.mkdir(parents=True, exist_ok=True)
        url = url.set(database=str(path))
    options = {"connect_args": {"check_same_thread": False, "timeout": 5}} if url.get_backend_name() == "sqlite" else {}
    engine = create_engine(url, pool_pre_ping=True, **options)
    if url.get_backend_name() == "sqlite":
        @event.listens_for(engine, "connect")
        def configure_sqlite(connection, _):
            connection.execute("PRAGMA foreign_keys=ON")
    return engine


engine = build_engine(settings.database_url)
SessionLocal = sessionmaker(engine, expire_on_commit=False)


def initialize_database():
    from app.models import workspace  # Register the initial schema; no existing tables are dropped.
    Base.metadata.create_all(engine)
    with SessionLocal() as session:
        if session.get(workspace.Profile, 1) is None:
            session.add(workspace.Profile(id=1))
            session.commit()


def get_session():
    with SessionLocal() as session:
        try:
            yield session
        except Exception:
            session.rollback()
            raise
