import pytest
from httpx import AsyncClient
from app.main import app

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_scout_endpoint(client: AsyncClient):
    response = await client.post(
        "/api/v1/scout",
        json={
            "role_title": "Test Engineer",
            "keywords": ["pytest"],
            "location_filter": "US"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if data:
        assert "handle" in data[0]
        assert "match_score" in data[0]
        assert "reasoning" in data[0]