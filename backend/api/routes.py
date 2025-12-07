from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse, Response
from typing import List
import json
from ..models.schemas import (
    ScoutRequest, CandidateResponse, DetailedCandidateResponse,
    UpdatePipelineRequest, NotificationRequest, NotificationResponse,
    SendMessageRequest, MessageResponse, CreateEventRequest, EventResponse
)
from ..services.talent_service import TalentService
from ..services.twitter_oauth_service import TwitterOAuthService
from ..config.settings import settings

router = APIRouter()

@router.get("/")
async def root():
    return {"message": "TalentScout X API is running"}

@router.get("/health")
async def health_check():
    return {"status": "healthy"}

@router.get("/candidates", response_model=List[CandidateResponse])
async def get_all_candidates():
    """Get all candidates from the database"""
    try:
        talent_service = TalentService()
        await talent_service.prisma.connect()

        candidates = await talent_service.get_all_candidates()

        await talent_service.prisma.disconnect()

        return candidates

    except Exception as e:
        print(f"Get candidates endpoint error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/candidates/{candidate_id}", response_model=DetailedCandidateResponse)
async def get_candidate_profile(candidate_id: int):
    """Get detailed candidate profile with AI insights and recent posts"""
    try:
        talent_service = TalentService()
        await talent_service.prisma.connect()

        profile = await talent_service.get_candidate_profile(candidate_id)

        await talent_service.prisma.disconnect()

        if not profile:
            raise HTTPException(status_code=404, detail="Candidate not found")

        return profile

    except HTTPException:
        raise
    except Exception as e:
        print(f"Get candidate profile error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/scout", response_model=List[CandidateResponse])
async def scout_talent(request: ScoutRequest):
    try:
        talent_service = TalentService()
        await talent_service.prisma.connect()

        results = await talent_service.scout_talent(request)

        await talent_service.prisma.disconnect()

        if not results:
            raise HTTPException(status_code=404, detail="No candidates found")

        return results

    except Exception as e:
        print(f"Scout endpoint error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.put("/candidates/{candidate_id}/pipeline")
async def update_pipeline_stage(candidate_id: int, request: UpdatePipelineRequest):
    """Update pipeline stage for a candidate"""
    try:
        talent_service = TalentService()
        await talent_service.prisma.connect()

        success = await talent_service.update_pipeline_stage(candidate_id, request.pipeline_stage)

        await talent_service.prisma.disconnect()

        if not success:
            raise HTTPException(status_code=404, detail="Failed to update pipeline stage")

        return {"success": True, "pipeline_stage": request.pipeline_stage}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Update pipeline stage error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/notifications", response_model=NotificationResponse)
async def create_notification(request: NotificationRequest):
    """Create a notification for a candidate (e.g., when advancing stages)"""
    try:
        talent_service = TalentService()
        await talent_service.prisma.connect()

        notification = await talent_service.create_notification(request)

        await talent_service.prisma.disconnect()

        if not notification:
            raise HTTPException(status_code=404, detail="Failed to create notification")

        return notification

    except HTTPException:
        raise
    except Exception as e:
        print(f"Create notification error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/candidates/{candidate_id}/notifications", response_model=List[NotificationResponse])
async def get_candidate_notifications(candidate_id: int):
    """Get all notifications for a specific candidate"""
    try:
        talent_service = TalentService()
        await talent_service.prisma.connect()

        notifications = await talent_service.get_candidate_notifications(candidate_id)

        await talent_service.prisma.disconnect()

        return notifications

    except Exception as e:
        print(f"Get notifications error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/lookup/{username}", response_model=CandidateResponse)
async def lookup_user_by_username(username: str):
    """Lookup a Twitter user by username and add to database if found"""
    try:
        talent_service = TalentService()
        await talent_service.prisma.connect()

        candidate = await talent_service.lookup_and_add_user(username)

        await talent_service.prisma.disconnect()

        if not candidate:
            raise HTTPException(status_code=404, detail=f"User @{username} not found on Twitter")

        return candidate

    except HTTPException:
        raise
    except Exception as e:
        print(f"Lookup user error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Twitter OAuth endpoints
oauth_service = TwitterOAuthService()

@router.get("/auth/twitter/authorize")
async def twitter_auth():
    """Initiate Twitter OAuth flow"""
    try:
        auth_data = oauth_service.get_authorization_url()
        return auth_data
    except Exception as e:
        print(f"Twitter auth error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to initiate OAuth: {str(e)}")

@router.get("/auth/twitter/callback")
async def twitter_callback(code: str, state: str):
    """Handle Twitter OAuth callback"""
    try:
        token_data = await oauth_service.exchange_code_for_token(code, state)

        if not token_data:
            raise HTTPException(status_code=400, detail="Failed to exchange OAuth code")

        # Get authenticated user info
        user_info = await oauth_service.get_authenticated_user(token_data['access_token'])

        # Redirect back to frontend with token info
        # In production, you'd store this in session/database
        frontend_redirect = f"{settings.FRONTEND_URL}/auth/success?access_token={token_data['access_token']}&username={user_info['username'] if user_info else 'unknown'}"

        return RedirectResponse(url=frontend_redirect)

    except Exception as e:
        print(f"OAuth callback error: {e}")
        error_redirect = f"{settings.FRONTEND_URL}/auth/error?error={str(e)}"
        return RedirectResponse(url=error_redirect)

@router.post("/messages/send-dm")
async def send_twitter_dm(request: Request):
    """Send a DM to a Twitter user"""
    try:
        data = await request.json()
        access_token = data.get('access_token')
        recipient_id = data.get('recipient_id')
        message = data.get('message')

        if not all([access_token, recipient_id, message]):
            raise HTTPException(status_code=400, detail="Missing required fields")

        success = await oauth_service.send_dm(access_token, recipient_id, message)

        if not success:
            raise HTTPException(status_code=500, detail="Failed to send DM")

        return {"success": True, "message": "DM sent successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Send DM error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Message endpoints
@router.post("/messages", response_model=MessageResponse)
async def send_message(request: SendMessageRequest):
    """Send a message in a conversation with a candidate"""
    try:
        talent_service = TalentService()
        await talent_service.prisma.connect()

        message = await talent_service.send_message(request)

        await talent_service.prisma.disconnect()

        if not message:
            raise HTTPException(status_code=404, detail="Failed to send message")

        return message

    except HTTPException:
        raise
    except Exception as e:
        print(f"Send message error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/candidates/{candidate_id}/messages", response_model=List[MessageResponse])
async def get_candidate_messages(candidate_id: int):
    """Get all messages for a specific candidate"""
    try:
        talent_service = TalentService()
        await talent_service.prisma.connect()

        messages = await talent_service.get_candidate_messages(candidate_id)

        await talent_service.prisma.disconnect()

        return messages

    except Exception as e:
        print(f"Get messages error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Event endpoints
@router.post("/events", response_model=EventResponse)
async def create_event(request: CreateEventRequest):
    """Create a calendar event/meeting with a candidate"""
    try:
        talent_service = TalentService()
        await talent_service.prisma.connect()

        event = await talent_service.create_event(request)

        await talent_service.prisma.disconnect()

        if not event:
            raise HTTPException(status_code=404, detail="Failed to create event")

        return event

    except HTTPException:
        raise
    except Exception as e:
        print(f"Create event error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/candidates/{candidate_id}/events", response_model=List[EventResponse])
async def get_candidate_events(candidate_id: int):
    """Get all events/meetings for a specific candidate"""
    try:
        talent_service = TalentService()
        await talent_service.prisma.connect()

        events = await talent_service.get_candidate_events(candidate_id)

        await talent_service.prisma.disconnect()

        return events

    except Exception as e:
        print(f"Get events error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/events", response_model=List[EventResponse])
async def get_all_events():
    """Get all upcoming events across all candidates"""
    try:
        talent_service = TalentService()
        await talent_service.prisma.connect()

        events = await talent_service.get_all_events()

        await talent_service.prisma.disconnect()

        return events

    except Exception as e:
        print(f"Get all events error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/events/{event_id}/calendar-invite")
async def download_calendar_invite(event_id: int):
    """Download the .ics calendar invite file for a specific event"""
    try:
        talent_service = TalentService()
        await talent_service.prisma.connect()

        # Get the event
        event = await talent_service.prisma.event.find_unique(
            where={"id": event_id},
            include={"candidate": True}
        )

        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        # Get the message with calendar invite
        messages = await talent_service.prisma.message.find_many(
            where={
                "candidateId": event.candidateId,
                "messageType": "meeting"
            },
            order={"createdAt": "desc"}
        )

        calendar_invite = None
        for msg in messages:
            if msg.metadata:
                try:
                    metadata = json.loads(msg.metadata)
                    if metadata.get("event_id") == event_id:
                        calendar_invite = metadata.get("calendar_invite")
                        break
                except:
                    continue

        await talent_service.prisma.disconnect()

        if not calendar_invite:
            # Generate a new one if not found
            calendar_invite = talent_service.calendar_service.generate_ics(
                title=event.title,
                description=event.description or f"Interview with {event.candidate.name}",
                start_time=event.scheduledAt,
                duration_minutes=event.duration,
                organizer_email="recruiting@company.com",
                organizer_name="Recruiting Team",
                attendee_email=f"{event.candidate.handle.replace('@', '')}@example.com",
                attendee_name=event.candidate.name,
                meeting_link=event.meetingLink
            )

        # Return as downloadable .ics file
        filename = f"interview_{event.candidate.name.replace(' ', '_')}_{event.id}.ics"

        return Response(
            content=calendar_invite,
            media_type="text/calendar",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Download calendar invite error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")