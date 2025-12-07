import httpx
import json
import asyncio
from typing import List
from ..config.settings import settings
from ..models.schemas import GrokScoringResult, TwitterUser

class GrokService:
    def __init__(self):
        if not settings.XAI_API_KEY:
            raise ValueError("XAI_API_KEY not found in environment")

    async def score_candidate(self, job_title: str, user: TwitterUser) -> GrokScoringResult:
        try:
            prompt = f"""You are an expert technical recruiter evaluating a candidate for: "{job_title}"

CANDIDATE PROFILE:
Name: {user.name}
Bio: {user.description}
Followers: {user.followers_count}
Recent Tweet: {user.recent_tweet}

EVALUATION CRITERIA (be generous and look for potential):
1. Technical Skills Match (0-40 points):
   - Does bio mention ANY relevant technologies or programming languages?
   - Look for keywords like: developer, engineer, programmer, coder, tech
   - Award points for general technical background even if not exact match

2. Professional Experience (0-30 points):
   - Does bio indicate they work in tech/software?
   - Any job titles related to software development?
   - Active in tech community (follows tech topics, tweets about code)?

3. Profile Quality (0-15 points):
   - Has a complete bio (even if brief)?
   - Reasonable follower count (50+)?
   - Recent activity shows engagement

4. Role Relevance (0-15 points):
   - Could this person be interested in a {job_title} role?
   - Do they have transferable skills?
   - Is their background adjacent to this role?

SCORING GUIDELINES (be more generous):
- 85-100: Excellent match - strong qualifications and experience
- 70-84: Very good match - clearly qualified with relevant skills
- 55-69: Good match - solid technical background
- 40-54: Moderate match - some relevant experience
- 25-39: Possible match - junior or learning
- 0-24: Poor match - no clear technical background

AIM FOR BALANCE: Score candidates fairly. Most qualified candidates should score 60-85.
Give higher scores to anyone with clear technical skills and relevant experience.

Return ONLY valid JSON:
{{"score": <0-100>, "reasoning": "<concise 1-2 sentence explanation>"}}"""

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{settings.XAI_BASE_URL}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.XAI_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "grok-3",
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.3,
                        "max_tokens": 200
                    }
                )

                if response.status_code == 200:
                    result = response.json()
                    content = result["choices"][0]["message"]["content"]

                    try:
                        parsed = json.loads(content)
                        return GrokScoringResult(
                            score=min(100, max(1, int(parsed.get("score", 50)))),
                            reasoning=parsed.get("reasoning", "No reasoning provided")
                        )
                    except:
                        return GrokScoringResult(
                            score=50,
                            reasoning="Could not parse Grok response"
                        )
                else:
                    print(f"Grok API error: {response.status_code} - {response.text}")
                    return GrokScoringResult(
                        score=50,
                        reasoning="API error"
                    )

        except Exception as e:
            print(f"Grok scoring error: {e}")
            return GrokScoringResult(
                score=50,
                reasoning=f"Error: {str(e)}"
            )

    async def score_candidates_batch(self, job_title: str, users: List[TwitterUser], batch_size: int = 5) -> List[GrokScoringResult]:
        """Score multiple candidates in parallel batches for better performance"""
        results = []

        # Process in batches to avoid overwhelming the API
        for i in range(0, len(users), batch_size):
            batch = users[i:i + batch_size]
            print(f"Scoring batch {i//batch_size + 1} ({len(batch)} candidates)...")

            # Score all candidates in this batch concurrently
            batch_tasks = [self.score_candidate(job_title, user) for user in batch]
            batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)

            # Handle any exceptions
            for result in batch_results:
                if isinstance(result, Exception):
                    print(f"Batch scoring error: {result}")
                    results.append(GrokScoringResult(score=50, reasoning="Batch error"))
                else:
                    results.append(result)

            # Small delay between batches to be nice to the API
            if i + batch_size < len(users):
                await asyncio.sleep(0.5)

        return results