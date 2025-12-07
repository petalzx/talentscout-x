from pydantic import BaseModel
from typing import List, Optional

class ScoutRequest(BaseModel):
    job_title: str
    keywords: List[str]
    location_filter: Optional[str] = None

class CandidateResponse(BaseModel):
    id: str
    name: str
    handle: str
    avatar: str
    bio: str
    followers: str
    following: str = "0"
    match: int
    tags: List[str]
    recent_post: str
    engagement: str = "0 replies · 0 likes"
    roles: List[str]

class TwitterUser(BaseModel):
    id: str
    username: str
    name: str
    description: str = ""
    followers_count: int = 0
    profile_image_url: str = ""
    recent_tweet: str = ""

class GrokScoringResult(BaseModel):
    score: int
    reasoning: str