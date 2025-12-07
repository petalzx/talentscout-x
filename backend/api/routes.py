from fastapi import APIRouter, HTTPException
from typing import List
from ..models.schemas import ScoutRequest, CandidateResponse
from ..services.talent_service import TalentService

router = APIRouter()

@router.get("/")
async def root():
    return {"message": "TalentScout X API is running"}

@router.get("/health")
async def health_check():
    return {"status": "healthy"}

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