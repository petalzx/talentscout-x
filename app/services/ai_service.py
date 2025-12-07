from openai import OpenAI
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
    ai_client = OpenAI(
        api_key=settings.xai_api_key,
        base_url=settings.xai_base_url
    )

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

    try:
        response = ai_client.chat.completions.create(
            model=settings.xai_model,
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=2000
        )

        ai_content = response.choices[0].message.content.strip()
        ai_json = json.loads(ai_content)
        candidates_data = ai_json.get("candidates", [])
        
        # Fallback if empty
        if not candidates_data:
            candidates_data = [
                {"handle": "@fallback", "match_score": 50, "reasoning": "Mock due to AI error."}
            ]
        return candidates_data
    except Exception as e:
        print(f"AI ranking error: {e}")
        return [{"handle": "@error", "match_score": 0, "reasoning": str(e)}]