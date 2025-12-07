from pydantic import BaseModel
from typing import List, Optional

class ScoutRequest(BaseModel):
    role_title: str
    job_desc: Optional[str] = None  # Job description for Grok fit eval (optional deep match)
    keywords: List[str]
    location_filter: Optional[str] = None
    limit: int = 20  # Tweets for users (batch scale; max 500)

class CandidateMatch(BaseModel):
    handle: str
    match_score: int
    reasoning: str