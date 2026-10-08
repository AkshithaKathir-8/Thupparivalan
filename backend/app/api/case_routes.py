import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.all_models import Case, CaseEntity, Relationship, EvidenceRecord, Alert, User
from app.schemas.all_schemas import CaseCreate, CaseUpdate, CaseResponse
from app.security.auth import get_current_investigator
from app.services.audit_service import log_audit_event
from app.intelligence.rules_engine import run_intelligence_rules

router = APIRouter(prefix="/api/cases", tags=["Cases"])

@router.get("", response_model=List[CaseResponse])
def list_cases(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_investigator)
):
    cases = db.query(Case).order_by(Case.created_at.desc()).all()
    results = []
    for c in cases:
        ent_count = db.query(CaseEntity).filter(CaseEntity.case_id == c.id).count()
        rel_count = db.query(Relationship).filter(Relationship.case_id == c.id).count()
        evd_count = db.query(EvidenceRecord).filter(EvidenceRecord.case_id == c.id).count()
        alt_count = db.query(Alert).filter(Alert.case_id == c.id).count()

        results.append({
            "id": c.id,
            "case_code": c.case_code,
            "title": c.title,
            "description": c.description,
            "district": c.district,
            "status": c.status,
            "priority": c.priority,
            "created_by": c.created_by,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
            "entity_count": ent_count,
            "relationship_count": rel_count,
            "evidence_count": evd_count,
            "alert_count": alt_count
        })
    return results

@router.post("", response_model=CaseResponse)
def create_case(
    payload: CaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_investigator)
):
    # Auto-generate case code if not provided
    case_code = payload.case_code
    if not case_code:
        count = db.query(Case).count() + 1
        case_code = f"CASE-{count:03d}"

    # Check uniqueness
    existing = db.query(Case).filter(Case.case_code == case_code).first()
    if existing:
        case_code = f"{case_code}-{str(uuid.uuid4())[:4]}"

    case_id = f"case-{str(uuid.uuid4())[:12]}"
    new_case = Case(
        id=case_id,
        case_code=case_code,
        title=payload.title,
        description=payload.description or "",
        district=payload.district or "State Cyber & Crime Division",
        priority=payload.priority or "HIGH",
        status=payload.status or "ACTIVE",
        created_by=current_user.email,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    # Log audit
    log_audit_event(
        db, actor_id=current_user.email, action="CASE_CREATED",
        target_type="CASE", target_id=new_case.case_code,
        details=f"Created investigation case: {new_case.title} in {new_case.district}"
    )

    # Run intelligence rule evaluation
    run_intelligence_rules(db, case_id=new_case.id)

    return {
        "id": new_case.id,
        "case_code": new_case.case_code,
        "title": new_case.title,
        "description": new_case.description,
        "district": new_case.district,
        "status": new_case.status,
        "priority": new_case.priority,
        "created_by": new_case.created_by,
        "created_at": new_case.created_at,
        "updated_at": new_case.updated_at,
        "entity_count": 0,
        "relationship_count": 0,
        "evidence_count": 0,
        "alert_count": 0
    }

@router.get("/{case_id}", response_model=CaseResponse)
def get_case(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_investigator)
):
    c = db.query(Case).filter(
        (Case.id == case_id) | (Case.case_code == case_id)
    ).first()

    if not c:
        raise HTTPException(status_code=404, detail="Case not found")

    ent_count = db.query(CaseEntity).filter(
        CaseEntity.case_id == c.id
    ).count()

    rel_count = db.query(Relationship).filter(
        Relationship.case_id == c.id
    ).count()

    evd_count = db.query(EvidenceRecord).filter(
        EvidenceRecord.case_id == c.id
    ).count()

    alt_count = db.query(Alert).filter(
        Alert.case_id == c.id
    ).count()

    log_audit_event(
        db,
        actor_id=current_user.email,
        action="CASE_VIEWED",
        target_type="CASE",
        target_id=c.case_code,
        details=f"Viewed case file {c.case_code}"
    )

    return {
        "id": c.id,
        "case_code": c.case_code,
        "title": c.title,
        "description": c.description,
        "district": c.district,
        "status": c.status,
        "priority": c.priority,
        "created_by": c.created_by,
        "created_at": c.created_at,
        "updated_at": c.updated_at,
        "entity_count": ent_count,
        "relationship_count": rel_count,
        "evidence_count": evd_count,
        "alert_count": alt_count
    }


@router.patch("/{case_id}", response_model=CaseResponse)
def update_case(
    case_id: str,
    payload: CaseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_investigator)
):
    c = db.query(Case).filter(
        (Case.id == case_id) | (Case.case_code == case_id)
    ).first()

    if not c:
        raise HTTPException(status_code=404, detail="Case not found")

    changes = []

    if payload.title is not None and payload.title != c.title:
        changes.append(
            f"title: '{c.title}' -> '{payload.title}'"
        )
        c.title = payload.title

    if payload.description is not None and payload.description != c.description:
        changes.append("description updated")
        c.description = payload.description

    if payload.district is not None and payload.district != c.district:
        changes.append(
            f"district: '{c.district}' -> '{payload.district}'"
        )
        c.district = payload.district

    if payload.priority is not None and payload.priority != c.priority:
        changes.append(
            f"priority: '{c.priority}' -> '{payload.priority}'"
        )
        c.priority = payload.priority

    if payload.status is not None and payload.status != c.status:
        changes.append(
            f"status: '{c.status}' -> '{payload.status}'"
        )
        c.status = payload.status

    c.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(c)

    log_audit_event(
        db,
        actor_id=current_user.email,
        action="CASE_UPDATED",
        target_type="CASE",
        target_id=c.case_code,
        details=(
            "; ".join(changes)
            if changes
            else "Case details saved without changes"
        )
    )

    return {
        "id": c.id,
        "case_code": c.case_code,
        "title": c.title,
        "description": c.description,
        "district": c.district,
        "status": c.status,
        "priority": c.priority,
        "created_by": c.created_by,
        "created_at": c.created_at,
        "updated_at": c.updated_at,
        "entity_count": db.query(CaseEntity).filter(
            CaseEntity.case_id == c.id
        ).count(),
        "relationship_count": db.query(Relationship).filter(
            Relationship.case_id == c.id
        ).count(),
        "evidence_count": db.query(EvidenceRecord).filter(
            EvidenceRecord.case_id == c.id
        ).count(),
        "alert_count": db.query(Alert).filter(
            Alert.case_id == c.id
        ).count()
    }