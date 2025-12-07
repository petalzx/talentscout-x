import httpx
import json
from typing import List, Dict, Any

from ..config.settings import settings
from ..models.scout import ScoutRequest

SYSTEM_PROMPT = """You are a senior technical talent scout with deep expertise in software engineering roles.

Task: Analyze the provided list of X (Twitter) user profiles. Rank each one for suitability to the given job role based on their bio, location, followers, verification, links, and pinned tweet (if any).

Scoring Rules:
- 90-100: Exceptional match - Senior experience signals (e.g., "Senior", "Lead", GitHub links with production code, discussions of advanced topics like system design, optimization, architecture).
- 70-89: Good match - Mentions relevant technologies/keywords, some experience indicators.
- 50-69: Moderate match - Beginner or tangential relevance, learning signals (#100DaysOfCode, bootcamp).
- 0-49: Poor match - Off-topic, bots, spam, no tech relevance.

For each profile, provide a match_score (integer 0-100) and a 1-sentence reasoning explaining the score.

Include ALL provided profiles in the output, even low scores.

Output EXACTLY this JSON format, nothing else:
{
  "candidates": [
    {
      "handle": "@username",
      "match_score": 92,
      "reasoning": "Short explanation here."
    }
  ]
}"""

async def rank_candidates(request: ScoutRequest, profiles: List[str]) -> List[Dict[str, Any]]:
    if not settings.xai_api_key:
        raise ValueError("XAI_API_KEY required for Grok calls")

    user_prompt = f"""Job Role: {request.role_title}
Keywords to match: {', '.join(request.keywords)}
Location preference: {request.location_filter or 'Any'}

Profiles to evaluate (rank all):
"""
    for i, profile in enumerate(profiles, 1):
        user_prompt += f"\n{i}. {profile}"

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt}
    ]

    payload = {
        "model": settings.xai_model,
        "messages": messages,
        "temperature": 0.2,
        "max_tokens": 2000,
        "response_format": {"type": "json_object"}
    }

    headers = {
        "Authorization": f"Bearer {settings.xai_api_key}",
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{settings.xai_base_url}/chat/completions",
                headers=headers,
                json=payload
            )
            if resp.status_code != 200:
                print(f"Grok API error {resp.status_code}: {resp.text}")
                raise Exception(f"API error: {resp.status_code} - {resp.text}")
            data = resp.json()
            ai_content = data["choices"][0]["message"]["content"].strip()
            ai_json = json.loads(ai_content)
            candidates_data = ai_json.get("candidates", [])
            
            if not candidates_data:
                candidates_data = [
                    {"handle": "@fallback", "match_score": 50, "reasoning": "Mock due to AI error."}
                ]
            return candidates_data
    except Exception as e:
        print(f"Grok API error: {e}")
        return [{"handle": "@error", "match_score": 0, "reasoning": str(e)}]