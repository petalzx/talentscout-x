from fastapi import APIRouter, HTTPException
from typing import List
from ..models.schemas import ScoutRequest, CandidateResponse, DetailedCandidateResponse, UpdatePipelineRequest, NotificationRequest, NotificationResponse
from ..services.talent_service import TalentService

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