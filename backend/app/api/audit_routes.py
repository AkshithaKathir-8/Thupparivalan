from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.all_models import AuditLedger, User
from app.schemas.all_schemas import AuditLedgerResponse
from app.security.auth import get_current_investigator

router = APIRouter(prefix="/api/audit", tags=["Audit Ledger"])

@router.get("", response_model=List[AuditLedgerResponse])
def get_audit_trail(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_investigator)
):
    return db.query(AuditLedger).order_by(AuditLedger.timestamp.desc()).all()
