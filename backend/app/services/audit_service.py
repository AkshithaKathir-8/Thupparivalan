import uuid
import hashlib
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.all_models import AuditLedger

def log_audit_event(
    db: Session,
    actor_id: str,
    action: str,
    target_type: str,
    target_id: str,
    details: str,
    result: str = "SUCCESS"
) -> AuditLedger:
    """
    Append-only audit trail logger with cryptographic hash chaining.
    """
    # Fetch last audit record to chain previous_hash
    last_record = db.query(AuditLedger).order_by(AuditLedger.timestamp.desc()).first()
    if last_record and last_record.record_hash:
        previous_hash = last_record.record_hash
    else:
        previous_hash = "GENESIS-AUDIT-0000000000000000000000000000000000000000000000000000"

    now = datetime.utcnow()
    # Compute record hash
    data_to_hash = f"{now.isoformat()}|{actor_id}|{action}|{target_type}|{target_id}|{result}|{previous_hash}"
    record_hash = hashlib.sha256(data_to_hash.encode("utf-8")).hexdigest()

    audit_entry = AuditLedger(
        id=f"AUD-{str(uuid.uuid4())[:8]}",
        timestamp=now,
        actor_id=actor_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details,
        result=result,
        previous_hash=previous_hash,
        record_hash=record_hash
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    return audit_entry
