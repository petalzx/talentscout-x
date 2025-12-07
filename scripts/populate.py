import asyncio
from httpx import AsyncClient
import random

BASE_URL = "http://localhost:8000/api/v1"

async def populate(n=1, batch_limit=100):
    async with AsyncClient() as client:
        roles = ["Backend Engineer", "Frontend Developer", "AI Engineer", "DevOps"]
        keywords_lists = [
            ["FastAPI", "Python"],
            ["React", "TypeScript"],
            ["Grok", "xAI"],
            ["Kubernetes", "Docker"]
        ]
        tasks = []
        for i in range(n):
            role = random.choice(roles)
            keywords = random.choice(keywords_lists)
            data = {
                "role_title": role,
                "keywords": keywords,
                "limit": batch_limit  # Batch more tweets/profiles per call for scale
            }
            tasks.append(client.post(f"{BASE_URL}/scout", json=data))
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        successful = [r for r in responses if not isinstance(r, Exception) and r.status_code == 200]
        total_candidates = sum(len(r.json()) for r in successful)
        print(f"Populated {len(successful)}/{n} batch searches (limit {batch_limit}; Grok ranked {total_candidates} candidates total)")
        print("Scale note: Local SQLite OK for 100 batches; 1000+ use Postgres (env DATABASE_URL)")

if __name__ == "__main__":
    asyncio.run(populate(100))  # Scale to 100 users concurrent