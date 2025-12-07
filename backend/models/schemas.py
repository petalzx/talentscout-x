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

class SendMessageRequest(BaseModel):
    candidate_id: int
    content: str
    sender_id: str  # "recruiter-1", "recruiter-2", "hiring-manager-1", etc.
    sender_type: str = "recruiter"  # "recruiter" or "candidate"
    message_type: str = "text"  # "text", "meeting", "assessment"
    metadata: Optional[str] = None  # JSON string for meeting/assessment details

class MessageResponse(BaseModel):
    id: int
    candidate_id: int
    content: str
    sender_id: str
    sender_type: str
    message_type: str
    metadata: Optional[str]
    is_read: bool
    created_at: str

class CreateEventRequest(BaseModel):
    candidate_id: int
    title: str
    description: Optional[str] = None
    event_type: str  # "phone_screen", "technical", "final", etc.
    scheduled_at: str  # ISO datetime string
    duration: int  # Duration in minutes
    meeting_type: str = "video"  # "video", "phone", "in_person"
    meeting_link: Optional[str] = None
    notes: Optional[str] = None

class EventResponse(BaseModel):
    id: int
    candidate_id: int
    title: str
    description: Optional[str]
    event_type: str
    scheduled_at: str
    duration: int
    meeting_type: str
    status: str
    meeting_link: Optional[str]
    notes: Optional[str]
    created_at: str