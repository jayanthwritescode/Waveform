import asyncio
import httpx
import pytest
from app.main import app


def request(path, method="GET", headers=None):
    async def run():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            return await client.request(method, path, headers=headers)
    return asyncio.run(run())


def test_catalogue_has_real_credited_records():
    response = request("/api/tracks")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 8
    assert len({track["id"] for track in body["items"]}) == 8
    for track in body["items"]:
        assert track["artist"] == "Kevin MacLeod"
        assert track["license_name"] == "CC BY 4.0"
        assert track["energy"] is None
        assert track["album"] is None
        assert track["attribution"]


def test_search_and_filters_combine():
    response = request("/api/tracks?q=PIANO&genre=Contemporary&artist=Kevin%20MacLeod")
    assert [track["title"] for track in response.json()["items"]] == ["Dreams Become Real"]
    assert request("/api/tracks?q=not-a-real-track").json()["total"] == 0
    assert request("/api/tracks?genre=Jazz").json()["total"] == 2
    assert request("/api/tracks?artist=unknown").json()["total"] == 0


def test_pagination_keeps_total_and_order():
    full = request("/api/tracks").json()
    page = request("/api/tracks?limit=2&offset=2").json()
    assert page["total"] == full["total"]
    assert page["items"] == full["items"][2:4]
    assert request("/api/tracks?offset=999").json()["items"] == []


@pytest.mark.parametrize("query", ["limit=0", "limit=101", "offset=-1", "q=" + "a" * 121])
def test_query_validation(query):
    assert request("/api/tracks?" + query).status_code == 422


def test_track_detail_and_missing_track():
    track = request("/api/tracks/USUAN1500027").json()
    assert track["title"] == "Dreams Become Real"
    assert request("/api/tracks/unknown").status_code == 404
    assert request("/api/tracks/unknown/audio").status_code == 404


def test_catalogue_is_metadata_only():
    page = request("/api/tracks").json()
    for track in page["items"]:
        assert not any(key.startswith("audio_") for key in track)
        assert track["source_identifier"] == track["id"]
        assert track["dataset_source"]
        assert track["release_year"] is None
        assert "Audio unmodified" not in track["attribution"]


def test_streaming_route_is_removed():
    assert request("/api/tracks/USUAN1500027/audio").status_code == 404
    paths = request("/openapi.json").json()["paths"]
    assert {"/api/health", "/api/tracks", "/api/tracks/{track_id}"}.issubset(paths)
    assert not any(path.endswith("/audio") for path in paths)
