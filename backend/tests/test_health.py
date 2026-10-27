import asyncio
import httpx
from app.main import app


def request_health(origin=None):
    async def request():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.get("/api/health", headers={"Origin": origin} if origin else {})
    return asyncio.run(request())


def test_health():
    response = request_health()
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "app": "Waveform", "phase": 7.0}


def test_allowed_frontend_origin():
    response = request_health("http://localhost:5173")
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_unknown_origin_is_not_allowed():
    response = request_health("https://example.invalid")
    assert "access-control-allow-origin" not in response.headers
