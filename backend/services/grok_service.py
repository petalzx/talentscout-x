import httpx
import json
from ..config.settings import settings
from ..models.schemas import GrokScoringResult, TwitterUser

class GrokService:
    def __init__(self):
        if not settings.XAI_API_KEY:
            raise ValueError("XAI_API_KEY not found in environment")

    async def score_candidate(self, job_title: str, user: TwitterUser) -> GrokScoringResult:
        try:
            prompt = f"""Rate this person from 1-100 for the job "{job_title}".

Profile:
- Name: {user.name}
- Bio: {user.description}
- Followers: {user.followers_count}
- Recent tweet: {user.recent_tweet}

Consider:
- How well their bio matches the job requirements
- Their professional experience indicators
- Their social media presence and engagement
- Their technical skills mentioned

Return ONLY a JSON object with:
{{"score": number_1_to_100, "reasoning": "brief_explanation"}}"""

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