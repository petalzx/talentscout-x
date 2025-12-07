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
            prompt = f"""You are an expert technical recruiter evaluating a candidate for: "{job_title}"

CANDIDATE PROFILE:
Name: {user.name}
Bio: {user.description}
Followers: {user.followers_count}
Recent Tweet: {user.recent_tweet}

EVALUATION CRITERIA:
1. Technical Skills Match (0-40 points):
   - Does bio explicitly mention relevant technologies for {job_title}?
   - Are there specific technical skills listed (languages, frameworks, tools)?
   - Quality over quantity - relevant skills score higher

2. Professional Experience (0-30 points):
   - Does bio indicate professional developer/engineer role?
   - Any seniority indicators (senior, lead, staff, principal)?
   - Years of experience mentioned?
   - Company names or notable projects?

3. Profile Quality (0-15 points):
   - Complete, professional bio (not generic/casual)?
   - Links to GitHub, portfolio, website?
   - Active account with recent technical content?

4. Relevance to Role (0-15 points):
   - Is this person actually doing the type of work needed?
   - Do recent tweets show technical discussions/work?
   - Would they realistically be interested in this role?

SCORING GUIDELINES:
- 80-100: Perfect match - explicitly qualified senior professional
- 60-79: Strong match - clearly qualified with relevant experience
- 40-59: Moderate match - some qualifications but gaps
- 20-39: Weak match - minimal qualifications or unclear fit
- 0-19: Poor match - no clear qualifications or wrong field

BE STRICT: Most candidates should score 20-50. Only exceptional matches score above 70.
Penalize heavily for: non-English bios, no tech keywords, generic bios, irrelevant content.

Return ONLY valid JSON:
{{"score": <0-100>, "reasoning": "<concise explanation of score>"}}"""

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