from fastapi import APIRouter, HTTPException
from typing import List
from ..models.schemas import ScoutRequest, CandidateResponse, DetailedCandidateResponse
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