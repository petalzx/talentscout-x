from fastapi import APIRouter, Depends
from typing import List

from ..models.scout import ScoutRequest, CandidateMatch
from ..services.ingestion import get_profiles
from ..services.ai_service import rank_candidates
from prisma import Prisma
from ..db.database import prisma as prisma_client  # Global Prisma client
from ..db.database import DB_PATH  # But since settings, wait
from ..config.settings import settings

router = APIRouter()

@router.post("/scout", response_model=List[CandidateMatch])
async def scout(request: ScoutRequest):
    """
    Scout for technical talent on X (Twitter) using keywords and role.
    """
    try:
        # Get profiles
        profiles = await get_profiles(
            role_title=request.role_title,
            keywords=request.keywords,
            location_filter=request.location_filter
        )
        if not profiles:
            return []

        # AI ranking
        candidates_data = await rank_candidates(request, profiles)

        # Persistence
        candidates = []
        async with aiosqlite.connect(settings.database_path) as db:
            # Create search
            cursor = await db.execute(
                "INSERT INTO Search (role_title, keywords) VALUES (?, ?)",
                (request.role_title, ",".join(request.keywords))
            )
            search_id = cursor.lastrowid

            # Create candidates
            for item in candidates_data:
                if isinstance(item, dict):
                    handle = item.get("handle", "").lstrip("@")
                    if handle:
                        match_score = int(item.get("match_score", 0))
                        reasoning = str(item.get("reasoning", ""))
                        await db.execute(
                            "INSERT INTO Candidate (handle, match_score, reasoning, search_id) VALUES (?, ?, ?, ?)",
                            (handle, match_score, reasoning, search_id)
                        )
                        candidates.append(
                            CandidateMatch(
                                handle=f"@{handle}",
                                match_score=match_score,
                                reasoning=reasoning
                            )
                        )
            await db.commit()

        return candidates

    except Exception as e:
        print(f"Scout error: {e}")
        return []