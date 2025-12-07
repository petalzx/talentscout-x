import asyncio
from httpx import AsyncClient
import random

BASE_URL = "http://localhost:8000/api/v1"

async def populate(n=100):
    async with AsyncClient() as client:
        tasks = []
        roles = ["Backend Engineer", "Frontend Developer", "AI Engineer", "DevOps"]
        keywords_lists = [
            ["FastAPI", "Python"],
            ["React", "TypeScript"],
            ["Grok", "xAI"],
            ["Kubernetes", "Docker"]
        ]
        for i in range(n):
            role = random.choice(roles)
            keywords = random.choice(keywords_lists)
            data = {"role_title": role, "keywords": keywords}
            tasks.append(client.post(f"{BASE_URL}/scout", json=data))
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        successful = [r for r in responses if not isinstance(r, Exception) and r.status_code == 200]
        print(f"Populated {len(successful)}/{n} searches (Grok ranked {sum(len(r.json()) for r in successful)} candidates)")

if __name__ == "__main__":
    asyncio.run(populate(100))  # Scale to 100 users concurrent