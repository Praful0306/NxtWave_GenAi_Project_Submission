"""
VaaniTutor server-ai — Internal routes (server-node → server-ai).
Protected by INTERNAL_SERVICE_KEY, not user JWT (Spec Section 4 & 8.2).
"""

from fastapi import APIRouter, Depends, Body, HTTPException, status
from pydantic import BaseModel, Field
from typing import Dict, Any

from ..auth import verify_internal_key
from ..services.llm_roadmap_service import generate_roadmap_llm, RoadmapRequest

router = APIRouter(prefix="/internal", tags=["internal"])


@router.post("/generate-roadmap")
async def generate_roadmap(
    req: RoadmapRequest = Body(...),
    _auth: bool = Depends(verify_internal_key),
) -> Dict[str, Any]:
    """
    Generate a personalized roadmap for a language learner.
    Called by server-node during onboarding and roadmap regeneration (Spec Section 6.8 & 8.2).
    Generates week-by-week, day-by-day lessons, prompts, scenarios, and daily 2-4 question quizzes.
    """
    try:
        roadmap = await generate_roadmap_llm(
            language_code=req.languageCode,
            level=req.level,
            total_days=req.totalDays,
        )
        return roadmap
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate roadmap: {str(e)}",
        )
