from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.all_models import Case, User
from app.security.auth import get_current_investigator
from app.graph.network_service import get_graph_data_for_cytoscape

router = APIRouter(prefix="/api", tags=["Network Graph"])

@router.get("/graph")
def get_global_graph(
    case_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_investigator)
):
    actual_case_id = None
    if case_id:
        case = db.query(Case).filter((Case.id == case_id) | (Case.case_code == case_id)).first()
        if case:
            actual_case_id = case.id
    return get_graph_data_for_cytoscape(db, actual_case_id)

@router.get("/cases/{case_id}/graph")
def get_case_graph(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_investigator)
):
    case = db.query(Case).filter((Case.id == case_id) | (Case.case_code == case_id)).first()
    cid = case.id if case else case_id
    return get_graph_data_for_cytoscape(db, cid)
