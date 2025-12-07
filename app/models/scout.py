from pydantic import BaseModel
from typing import List, Optional

class ScoutRequest(BaseModel):
    role_title: str
    keywords: List[str]
    location_filter: Optional[str] = None

class CandidateMatch(BaseModel):
    handle: str
    match_score: int
    reasoning: str