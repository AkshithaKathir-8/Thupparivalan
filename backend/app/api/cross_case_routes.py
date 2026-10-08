from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.all_models import User
from app.schemas.all_schemas import CrossCaseLinkResponse
from app.security.auth import get_current_investigator
from app.intelligence.cross_case_service import get_cross_case_matrix, analyze_cross_case_intelligence

router = APIRouter(prefix="/api/cross-case", tags=["Cross-Case Intelligence"])

@router.get("", response_model=List[CrossCaseLinkResponse])
def get_cross_case_links(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_investigator)
):
    return get_cross_case_matrix(db)

@router.post("/analyze")
def trigger_cross_case_scan(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_investigator)
):
    new_links = analyze_cross_case_intelligence(db)
    return {
        "message": f"Cross-case intelligence scan completed. Discovered {len(new_links)} new potential linkage(s).",
        "new_links_count": len(new_links)
    }
