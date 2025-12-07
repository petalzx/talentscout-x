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
    pipeline_stage: Optional[str] = None

class TwitterUser(BaseModel):
    id: str
    username: str
    name: str
    description: str = ""
    followers_count: int = 0
    following_count: int = 0
    profile_image_url: str = ""
    profile_banner_url: str = ""
    recent_tweet: str = ""

class GrokScoringResult(BaseModel):
    score: int
    reasoning: str

class TweetResponse(BaseModel):
    id: str
    content: str
    likes: int
    retweets: int
    replies: int
    created_at: str

class DetailedCandidateResponse(BaseModel):
    id: str
    name: str
    handle: str
    avatar: str
    bio: str
    followers: str
    following: str = "0"
    match: int
    tags: List[str]
    roles: List[str]
    location: Optional[str] = None
    website: Optional[str] = None
    header_image: Optional[str] = None
    pipeline_stage: Optional[str] = None
    insights: List[str]  # AI-generated reasoning points
    recent_posts: List[TweetResponse]

class UpdatePipelineRequest(BaseModel):
    candidate_id: int
    pipeline_stage: Optional[str]  # null, "Qualified", "Screening", "Round 1", etc.

class NotificationRequest(BaseModel):
    candidate_id: int
    message: str
    event_type: str  # "stage_advance", "stage_reject", etc.
    from_stage: Optional[str] = None
    to_stage: Optional[str] = None
    is_ai_generated: bool = False

class NotificationResponse(BaseModel):
    id: int
    candidate_id: int
    candidate_name: str
    message: str
    event_type: str
    from_stage: Optional[str]
    to_stage: Optional[str]
    is_ai_generated: bool
    sent_at: str