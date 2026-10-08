import uuid
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.all_models import Investigation, Case, User
from app.schemas.all_schemas import AIQueryRequest, AIQueryResponse
from app.security.auth import get_current_investigator
from app.ai.rag_engine import answer_investigative_query
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/api/investigation", tags=["AI Investigation"])

@router.post("/query", response_model=AIQueryResponse)
def execute_query(
    payload: AIQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_investigator)
):
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    actual_case_id = None
    if payload.case_id:
        case = db.query(Case).filter((Case.id == payload.case_id) | (Case.case_code == payload.case_id)).first()
        if case:
            actual_case_id = case.id

    # Execute grounded RAG query
    response_data = answer_investigative_query(db, payload.question, actual_case_id)

    # Persist in investigation log
    inv_entry = Investigation(
        id=f"INV-{str(uuid.uuid4())[:8]}",
        case_id=actual_case_id or "system",
        investigator_id=current_user.id,
        question=payload.question,
        answer=response_data["answer"],
        sources=json.dumps(response_data["references"]),
        created_at=datetime.utcnow()
    )
    db.add(inv_entry)
    db.commit()

    # Log audit event
    log_audit_event(
        db, actor_id=current_user.email, action="AI_QUERY",
        target_type="INVESTIGATION", target_id=inv_entry.id,
        details=f"Asked: '{payload.question[:60]}...'"
    )

    return response_data

@router.get("/history")
def get_query_history(
    case_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_investigator)
):
    query = db.query(Investigation)
    if case_id:
        query = query.filter((Investigation.case_id == case_id))
    history = query.order_by(Investigation.created_at.desc()).limit(20).all()
    return [
        {
            "id": h.id,
            "question": h.question,
            "answer": h.answer,
            "sources": json.loads(h.sources) if h.sources else [],
            "created_at": h.created_at
        }
        for h in history
    ]
