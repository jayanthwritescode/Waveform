import asyncio
import csv
import io
import json
import pytest
import httpx
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
from app.main import app
from app.database.core import Base, build_engine, get_session
from app.models.workspace import SavedPlaylist
from app.services.catalogue import catalogue


@pytest.fixture
def api(tmp_path):
    path = tmp_path / "workspace.sqlite"
    engine = build_engine(f"sqlite:///{path}")
    Base.metadata.create_all(engine)
    def sessions():
        with Session(engine, expire_on_commit=False) as session:
            yield session
    app.dependency_overrides[get_session] = sessions
    def request(method, url, **kwargs):
        async def run():
            transport = httpx.ASGITransport(app=app, raise_app_exceptions=False)
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
                return await client.request(method, url, **kwargs)
        return asyncio.run(run())
    yield request, path
    app.dependency_overrides.clear()
    engine.dispose()


def playlist(title='Evening, “ideas”'):
    return {"title":title, "description":"Line one\nLine two — हिंदी", "tracks":[
        catalogue.get("USUAN1500027").model_dump(mode="json"),
        catalogue.get("USUAN1100844").model_dump(mode="json")]}


def test_profile_preferences_persist_and_validate(api):
    request, _ = api
    profile = request("GET","/api/profile").json()
    profile.update(name="Jay",favorite_genres=["Jazz"],favorite_artists=["Artist, With Commas"],energy_min=0.2,energy_max=0.7)
    response = request("PUT","/api/profile",json=profile)
    assert response.status_code == 200
    assert request("GET","/api/profile").json()["favorite_artists"] == ["Artist, With Commas"]
    assert request("PUT","/api/profile",json=profile).status_code == 409
    current = response.json()
    current.update(disliked_genres=["jazz"])
    assert request("PUT","/api/profile",json=current).status_code == 422
    current.update(disliked_genres=[],energy_min=0.9,energy_max=0.1)
    assert request("PUT","/api/profile",json=current).status_code == 422


def test_feedback_is_exclusive_reversible_and_real(api):
    request, _ = api
    url = "/api/feedback/USUAN1500027"
    assert request("PUT",url,json={"value":"like"}).status_code == 200
    request("PUT",url,json={"value":"dislike"})
    assert request("GET","/api/feedback").json() == {"USUAN1500027":"dislike"}
    library = request("GET","/api/library").json()
    assert library["feedback"][0]["value"] == "dislike"
    assert library["recommendation_sessions"] == []
    request("PUT",url,json={"value":None})
    assert request("GET","/api/feedback").json() == {}
    assert request("PUT","/api/feedback/unknown",json={"value":"like"}).status_code == 404


def test_playlist_lifecycle_order_conflicts_and_database_reopen(api):
    request, path = api
    payload = playlist()
    payload["tracks"].append(payload["tracks"][0])
    created = request("POST","/api/playlists",json=payload)
    assert created.status_code == 201
    saved = created.json()
    assert len(saved["tracks"]) == 2
    saved["tracks"].reverse()
    saved["title"] = "Renamed"
    url = "/api/playlists/" + saved["id"]
    updated = request("PUT",url,json=saved)
    assert updated.status_code == 200
    assert request("PUT",url,json=saved).status_code == 409
    assert request("DELETE",url+"?revision=1").status_code == 409
    engine = build_engine(f"sqlite:///{path}")
    with Session(engine) as session:
        row = session.get(SavedPlaylist, saved["id"])
        assert row.title == "Renamed"
        assert [t["id"] for t in row.tracks] == ["USUAN1100844","USUAN1500027"]
    engine.dispose()
    assert request("DELETE",url+"?revision=2").status_code == 204
    assert request("GET",url).status_code == 404


@pytest.mark.parametrize("format",["csv","txt","json"])
def test_exports_round_trip_unicode_multiline_and_order(api, format):
    request, _ = api
    payload = playlist()
    exported = request("POST",f"/api/playlist-export?format={format}",json=payload)
    assert exported.status_code == 200
    assert "attachment" in exported.headers["content-disposition"]
    response = request("POST","/api/playlist-import",json={"format":format,"content":exported.content.decode('utf-8')})
    assert response.status_code == 200, response.text
    result = response.json()["playlist"]
    assert result["title"] == payload["title"]
    assert result["description"] == payload["description"]
    assert [t["id"] for t in result["tracks"]] == [t["id"] for t in payload["tracks"]]
    if format == 'json':
        assert result['tracks'][0]['source_uploaded']
        assert result['tracks'][0]['license_url']


def test_unknown_import_is_labeled_safely_and_csv_formulas_round_trip(api):
    request, _ = api
    payload = {"title":"=HYPERLINK(\"bad\")", "description":"\n@formula", "tracks":[
        {"title":"+Example, \"title\"", "artist":"'Artist", "artwork":"https://example.invalid/track.jpg"}]}
    exported = request("POST","/api/playlist-export?format=csv",json=payload)
    row = next(csv.DictReader(io.StringIO(exported.text)))
    assert row["Track Title"].startswith("'+")
    assert row["Playlist Title"].startswith("'=")
    result = request("POST","/api/playlist-import",json={"format":"csv","content":exported.text}).json()
    track = result["playlist"]["tracks"][0]
    assert result["unmatched_tracks"] == 1
    assert track["provenance"] == "user_import"
    assert track["title"] == payload["tracks"][0]["title"]
    assert track["artist"] == "'Artist"
    assert track["duration_seconds"] is None
    assert track["artwork"] == "assets/images/mark.svg"


@pytest.mark.parametrize("format,content",[("json","{}"),("json","[]"),("csv","bad,header\na,b"),("txt","arbitrary music list"),("csv","Track Title,Artist,Duration Seconds\nTrack,Artist,-1")])
def test_import_errors_do_not_save_or_overwrite(api, format, content):
    request, _ = api
    assert request("POST","/api/playlist-import",json={"format":format,"content":content}).status_code == 422
    assert request("GET","/api/playlists").json() == []


def test_database_failure_returns_actionable_error(api):
    request, _ = api
    broken = create_engine("sqlite://", poolclass=StaticPool, connect_args={"check_same_thread":False})
    def unavailable():
        with Session(broken) as session:
            yield session
    app.dependency_overrides[get_session] = unavailable
    response = request("GET","/api/playlists")
    assert response.status_code == 503
    assert "draft is kept" in response.json()["detail"]
    broken.dispose()

@pytest.mark.parametrize("format",["csv","txt","json"])
def test_empty_playlist_exports_preserve_title_and_description(api, format):
    request, _ = api
    payload = {"title":"Empty collection", "description":"A future idea", "tracks":[]}
    exported = request("POST",f"/api/playlist-export?format={format}",json=payload)
    result = request("POST","/api/playlist-import",json={"format":format,"content":exported.text}).json()
    assert result["playlist"]["title"] == payload["title"]
    assert result["playlist"]["description"] == payload["description"]
    assert result["playlist"]["tracks"] == []


def test_import_byte_limit_does_not_reflect_file_payload(api):
    request, _ = api
    response = request("POST","/api/playlist-import",json={"format":"json","content":"é"*500001})
    assert response.status_code == 422
    assert "input" not in response.json()["detail"][0]
    assert len(response.content) < 1000
