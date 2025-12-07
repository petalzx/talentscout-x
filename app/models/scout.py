from pydantic import BaseModel
from typing import List, Optional

class ScoutRequest(BaseModel):
    role_title: str
    job_desc: Optional[str] = None  # Deep fit eval vs bios/posts
    keywords: List[str]
    location_filter: Optional[str] = None
    limit: int = 20  # Tweets scan (large scale max 500)

class CandidateMatch(BaseModel):
    handle: str
    match_score: int
    reasoning: str