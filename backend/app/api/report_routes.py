from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.all_models import Report, Case, User
from app.schemas.all_schemas import ReportGenerateRequest, ReportResponse
from app.security.auth import get_current_investigator
from app.services.report_service import generate_investigation_report
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/api/reports", tags=["Intelligence Reports"])

@router.get("", response_model=List[ReportResponse])
def list_reports(
    case_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_investigator)
):
    query = db.query(Report)
    if case_id:
        case = db.query(Case).filter((Case.id == case_id) | (Case.case_code == case_id)).first()
        if case:
            query = query.filter(Report.case_id == case.id)
    return query.order_by(Report.created_at.desc()).all()

@router.post("/generate", response_model=ReportResponse)
def generate_report(
    payload: ReportGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_investigator)
):
    actual_case_id = None
    if payload.case_id:
        case = db.query(Case).filter((Case.id == payload.case_id) | (Case.case_code == payload.case_id)).first()
        if case:
            actual_case_id = case.id

    report = generate_investigation_report(
        db=db,
        case_id=actual_case_id,
        report_type=payload.report_type or "COMPREHENSIVE",
        generated_by=current_user.email,
        scope_notes=payload.scope_notes
    )

    log_audit_event(
        db, actor_id=current_user.email, action="REPORT_GENERATED",
        target_type="REPORT", target_id=report.id,
        details=f"Generated {report.report_type} dossier: {report.title}"
    )

    return report

@router.get("/{report_id}", response_model=ReportResponse)
def get_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_investigator)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report
