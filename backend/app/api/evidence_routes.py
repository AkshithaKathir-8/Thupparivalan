import os
import uuid
import hashlib
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.all_models import EvidenceRecord, Case, CaseDocument, User
from app.schemas.all_schemas import EvidenceRecordResponse, EvidenceVerifyResponse
from app.security.auth import get_current_investigator
from app.services.audit_service import log_audit_event
from app.services.integrity_service import (
    compute_file_sha256, get_latest_evidence_hash, verify_evidence_integrity,
    simulate_file_tampering, STORAGE_BASE
)
from app.evidence.processor import process_evidence_file
from app.intelligence.rules_engine import run_intelligence_rules
from app.intelligence.cross_case_service import analyze_cross_case_intelligence

router = APIRouter(prefix="/api", tags=["Evidence & Integrity"])

@router.get("/evidence", response_model=List[EvidenceRecordResponse])
def list_all_evidence(
    case_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_investigator)
):
    query = db.query(EvidenceRecord)
    if case_id:
        query = query.filter((EvidenceRecord.case_id == case_id) | (EvidenceRecord.case_code == case_id))
    return query.order_by(EvidenceRecord.uploaded_at.desc()).all()

@router.get("/cases/{case_id}/evidence", response_model=List[EvidenceRecordResponse])
def list_case_evidence(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_investigator)
):
    case = db.query(Case).filter((Case.id == case_id) | (Case.case_code == case_id)).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return db.query(EvidenceRecord).filter(EvidenceRecord.case_id == case.id).order_by(EvidenceRecord.uploaded_at.desc()).all()

@router.post("/cases/{case_id}/evidence", response_model=EvidenceRecordResponse)
async def upload_evidence(
    case_id: str,
    file: UploadFile = File(...),
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_investigator)
):
    case = db.query(Case).filter((Case.id == case_id) | (Case.case_code == case_id)).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # 1. Read file bytes and calculate SHA-256
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Cannot upload an empty file.")

    sha256_hash = hashlib.sha256(file_bytes).hexdigest()

    # 2. Get latest hash for tamper-evident chain linking
    previous_hash = get_latest_evidence_hash(db)

    # 3. Save physical file to storage directory
    os.makedirs(STORAGE_BASE, exist_ok=True)
    clean_filename = f"{uuid.uuid4().hex[:6]}_{file.filename}"
    file_path = os.path.join(STORAGE_BASE, clean_filename)
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # 4. Generate Evidence ID (e.g., EVD-XXX)
    count = db.query(EvidenceRecord).count() + 1
    evidence_id = f"EVD-{count:03d}"
    storage_path = f"case/{case.case_code}/{evidence_id}/{file.filename}"

    # 5. Create database records
    evd_rec = EvidenceRecord(
        id=evidence_id,
        case_id=case.id,
        case_code=case.case_code,
        file_name=clean_filename,
        storage_path=storage_path,
        mime_type=file.content_type or "application/octet-stream",
        file_size=len(file_bytes),
        sha256_hash=sha256_hash,
        previous_hash=previous_hash,
        uploaded_by=current_user.email,
        uploaded_at=datetime.utcnow(),
        verification_status="VERIFIED",
        last_verified_at=datetime.utcnow()
    )
    db.add(evd_rec)

    case_doc = CaseDocument(
        id=f"doc-{str(uuid.uuid4())[:8]}",
        case_id=case.id,
        file_name=file.filename,
        storage_path=storage_path,
        mime_type=file.content_type or "application/octet-stream",
        file_size=len(file_bytes),
        processing_status="PROCESSING",
        uploaded_by=current_user.email,
        uploaded_at=datetime.utcnow()
    )
    db.add(case_doc)
    db.commit()
    db.refresh(evd_rec)

    # 6. Log audit event
    log_audit_event(
        db, actor_id=current_user.email, action="EVIDENCE_UPLOADED",
        target_type="EVIDENCE", target_id=evd_rec.id,
        details=f"Uploaded {file.filename} to {case.case_code}; SHA-256 recorded: {sha256_hash[:16]}..."
    )

    # 7. Execute Dynamic Processing Pipeline
    process_evidence_file(
        db=db,
        file_path=file_path,
        case_id=case.id,
        evidence_id=evd_rec.id,
        file_name=file.filename
    )

    case_doc.processing_status = "COMPLETED"
    db.commit()

    # 8. Re-evaluate intelligence rules and cross-case links
    run_intelligence_rules(db, case_id=case.id)
    analyze_cross_case_intelligence(db)

    return evd_rec

@router.post("/evidence/{evidence_id}/verify", response_model=EvidenceVerifyResponse)
def verify_evidence(
    evidence_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_investigator)
):
    try:
        return verify_evidence_integrity(db, evidence_id, current_user.email)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/evidence/{evidence_id}/simulate-tamper", response_model=EvidenceVerifyResponse)
def simulate_tampering(
    evidence_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_investigator)
):
    try:
        return simulate_file_tampering(db, evidence_id, current_user.email)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/evidence/{evidence_id}/restore", response_model=EvidenceVerifyResponse)
def restore_tampering(
    evidence_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_investigator)
):
    evd = db.query(EvidenceRecord).filter(EvidenceRecord.id == evidence_id).first()
    if not evd:
        raise HTTPException(status_code=404, detail="Evidence not found")
    local_path = os.path.join(STORAGE_BASE, evd.file_name)
    if os.path.exists(local_path):
        with open(local_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        cleaned = content.replace("\n[UNAUTHORIZED_MODIFICATION_TIMESTAMP_2026]", "")
        with open(local_path, "wb") as f:
            f.write(cleaned.encode("utf-8"))
    return verify_evidence_integrity(db, evidence_id, current_user.email)

