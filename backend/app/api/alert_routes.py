from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.all_models import Alert, Case, Entity, User
from app.schemas.all_schemas import AlertResponse, AlertUpdate
from app.security.auth import get_current_investigator
from app.intelligence.rules_engine import run_intelligence_rules

router = APIRouter(prefix="/api/alerts", tags=["Intelligence Alerts"])

@router.get("", response_model=List[AlertResponse])
def list_alerts(
    case_id: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_investigator)
):
    query = db.query(Alert)
    if case_id:
        case = db.query(Case).filter((Case.id == case_id) | (Case.case_code == case_id)).first()
        if case:
            query = query.filter(Alert.case_id == case.id)
    if severity:
        query = query.filter(Alert.severity == severity.upper())
    if status:
        query = query.filter(Alert.status == status.upper())

    alerts = query.order_by(Alert.created_at.desc()).all()
    results = []
    case_map = {c.id: c.case_code for c in db.query(Case).all()}
    entity_map = {e.id: e.display_name for e in db.query(Entity).all()}

    for a in alerts:
        results.append({
            "id": a.id,
            "case_id": a.case_id,
            "case_code": case_map.get(a.case_id, "CASE-GEN"),
            "entity_id": a.entity_id,
            "entity_name": entity_map.get(a.entity_id, "Target Entity"),
            "severity": a.severity,
            "title": a.title,
            "reason": a.reason,
            "supporting_evidence": a.supporting_evidence,
            "confidence": a.confidence,
            "status": a.status,
            "created_at": a.created_at
        })
    return results

@router.patch("/{alert_id}", response_model=AlertResponse)
def update_alert(
    alert_id: str,
    payload: AlertUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_investigator)
):
    alt = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alt:
        raise HTTPException(status_code=404, detail="Alert not found")
    if payload.status:
        alt.status = payload.status.upper()
    if payload.severity:
        alt.severity = payload.severity.upper()
    db.commit()
    db.refresh(alt)

    case = db.query(Case).filter(Case.id == alt.case_id).first()
    ent = db.query(Entity).filter(Entity.id == alt.entity_id).first()

    return {
        "id": alt.id,
        "case_id": alt.case_id,
        "case_code": case.case_code if case else "CASE-GEN",
        "entity_id": alt.entity_id,
        "entity_name": ent.display_name if ent else "Target Entity",
        "severity": alt.severity,
        "title": alt.title,
        "reason": alt.reason,
        "supporting_evidence": alt.supporting_evidence,
        "confidence": alt.confidence,
        "status": alt.status,
        "created_at": alt.created_at
    }

@router.post("/refresh")
def refresh_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_investigator)
):
    new_alts = run_intelligence_rules(db)
    return {"message": f"Successfully evaluated intelligence rules. {len(new_alts)} new alert(s) generated."}
