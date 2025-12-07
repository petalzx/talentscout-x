from pydantic import BaseModel
from typing import List, Optional

class ScoutRequest(BaseModel):
    role_title: str
    keywords: List[str]
    location_filter: Optional[str] = None
    limit: int = 20  # Tweets to fetch (batch scale; max ~500 Twitter rate)

class CandidateMatch(BaseModel):
    handle: str
    match_score: int
    reasoning: str