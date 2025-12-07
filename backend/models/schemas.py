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
    sender_type: str = "recruiter"  # "recruiter", "candidate", or "internal"
    message_type: str = "text"  # "text", "meeting", "assessment", "feedback"
    metadata: Optional[str] = None  # JSON string for meeting/assessment/feedback details
    is_internal: bool = False  # True for internal team discussions

class MessageResponse(BaseModel):
    id: int
    candidate_id: int
    content: str
    sender_id: str
    sender_type: str
    message_type: str
    metadata: Optional[str]
    is_read: bool
    is_internal: bool
    created_at: str

class SubmitFeedbackMessageRequest(BaseModel):
    candidate_id: int
    interviewer_id: str  # "hiring-manager-1", etc.
    stage: str  # "Round 1", "Round 2", "Final"
    rating: int  # 1-5
    recommendation: str  # "strong-yes", "yes", "maybe", "no", "strong-no"
    technical_skills: int  # 1-5
    communication: int  # 1-5
    culture_fit: int  # 1-5
    comments: str
    strengths: List[str]
    concerns: List[str]

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
    assigned_interviewer_id: Optional[str] = None  # ID of assigned interviewer

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
    assigned_interviewer_id: Optional[str]
    assigned_interviewer_name: Optional[str]
    assigned_interviewer_role: Optional[str]
    created_at: str

class CreateFeedbackRequest(BaseModel):
    candidate_id: int
    interviewer_id: str  # "recruiter-1", "hiring-manager-1", etc.
    interviewer_name: str
    interviewer_role: str
    interviewer_avatar: str
    stage: str  # "Round 1", "Round 2", "Final", etc.
    rating: int  # 1-5
    recommendation: str  # "strong-yes", "yes", "maybe", "no", "strong-no"
    technical_skills: int  # 1-5
    communication: int  # 1-5
    culture_fit: int  # 1-5
    comments: str
    strengths: List[str]
    concerns: List[str]

class FeedbackResponse(BaseModel):
    id: int
    candidate_id: int
    interviewer_id: str
    interviewer_name: str
    interviewer_role: str
    interviewer_avatar: str
    stage: str
    rating: int
    recommendation: str
    technical_skills: int
    communication: int
    culture_fit: int
    comments: str
    strengths: List[str]
    concerns: List[str]
    created_at: str

class CreateAssessmentRequest(BaseModel):
    candidate_id: int
    title: str
    description: Optional[str] = None
    assessment_type: str  # "coding", "system-design", "take-home", etc.
    time_limit: int  # minutes
    completed_at: str  # ISO datetime string

class AssessmentResponse(BaseModel):
    id: int
    candidate_id: int
    candidate_name: str
    candidate_avatar: str
    candidate_handle: str
    candidate_role: str
    title: str
    description: Optional[str]
    assessment_type: str
    time_limit: int
    status: str
    assigned_engineer_id: Optional[str]
    assigned_engineer_name: Optional[str]
    assigned_engineer_role: Optional[str]
    assigned_engineer_avatar: Optional[str]
    completed_at: str
    created_at: str

class ForwardAssessmentRequest(BaseModel):
    assessment_id: int
    engineer_id: str  # "hiring-manager-1", etc.
    engineer_name: str
    engineer_role: str
    engineer_avatar: str

class CandidateWithFeedback(BaseModel):
    id: str
    name: str
    handle: str
    avatar: str
    role: str
    match: int
    stage: str
    feedback_count: int
    avg_rating: float
    top_recommendation: str