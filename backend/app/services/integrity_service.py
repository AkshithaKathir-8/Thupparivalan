import os
import hashlib
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.all_models import EvidenceRecord
from app.services.audit_service import log_audit_event

STORAGE_BASE = r"C:\Users\HP\thupparivalan\storage\evidence"

def compute_file_sha256(file_path: str) -> str:
    """Computes SHA-256 hash of a file on disk."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()

def get_latest_evidence_hash(db: Session) -> str:
    """Returns the sha256_hash of the most recently uploaded evidence record for hash chaining."""
    latest = db.query(EvidenceRecord).order_by(EvidenceRecord.uploaded_at.desc()).first()
    if latest and latest.sha256_hash:
        return latest.sha256_hash
    return "GENESIS-000000000000000000000000000000000000000000000000000000000000"

def verify_evidence_integrity(db: Session, evidence_id: str, actor_id: str) -> dict:
    """
    Verifies the integrity of an evidence file against the tamper-evident ledger.
    """
    evd = db.query(EvidenceRecord).filter(EvidenceRecord.id == evidence_id).first()
    if not evd:
        raise ValueError(f"Evidence record not found: {evidence_id}")

    # Resolve local physical path
    local_path = os.path.join(STORAGE_BASE, evd.file_name)
    if not os.path.exists(local_path):
        evd.verification_status = "MISSING"
        evd.last_verified_at = datetime.utcnow()
        db.commit()
        log_audit_event(
            db, actor_id=actor_id, action="INTEGRITY_FAILURE",
            target_type="EVIDENCE", target_id=evd.id,
            details=f"Evidence file missing from storage: {evd.file_name}", result="FAILURE"
        )
        return {
            "evidence_id": evd.id,
            "file_name": evd.file_name,
            "stored_hash": evd.sha256_hash,
            "computed_hash": "N/A",
            "verification_status": "MISSING",
            "tamper_detected": True,
            "verified_at": datetime.utcnow(),
            "message": "CRITICAL: Physical evidence file missing from storage path!"
        }

    computed_hash = compute_file_sha256(local_path)
    now = datetime.utcnow()
    evd.last_verified_at = now

    if computed_hash == evd.sha256_hash:
        evd.verification_status = "VERIFIED"
        db.commit()
        log_audit_event(
            db, actor_id=actor_id, action="EVIDENCE_VERIFIED",
            target_type="EVIDENCE", target_id=evd.id,
            details=f"Integrity verified. Hash {computed_hash[:16]}... matches tamper-evident ledger.",
            result="VERIFIED"
        )
        return {
            "evidence_id": evd.id,
            "file_name": evd.file_name,
            "stored_hash": evd.sha256_hash,
            "computed_hash": computed_hash,
            "verification_status": "VERIFIED",
            "tamper_detected": False,
            "verified_at": now,
            "message": "✓ INTEGRITY VERIFIED: Cryptographic hash matches immutable ledger record."
        }
    else:
        evd.verification_status = "MODIFIED"
        db.commit()
        log_audit_event(
            db, actor_id=actor_id, action="INTEGRITY_FAILURE",
            target_type="EVIDENCE", target_id=evd.id,
            details=f"ALERT: Tampering detected! Stored: {evd.sha256_hash[:12]}..., Computed: {computed_hash[:12]}...",
            result="TAMPER_DETECTED"
        )
        return {
            "evidence_id": evd.id,
            "file_name": evd.file_name,
            "stored_hash": evd.sha256_hash,
            "computed_hash": computed_hash,
            "verification_status": "MODIFIED",
            "tamper_detected": True,
            "verified_at": now,
            "message": "🚨 INTEGRITY VIOLATION: Unauthorized modification detected! File hash does not match ledger."
        }

def simulate_file_tampering(db: Session, evidence_id: str, actor_id: str) -> dict:
    """
    Demonstration helper: alters 1 byte of the evidence file to prove tamper detection in live demos.
    """
    evd = db.query(EvidenceRecord).filter(EvidenceRecord.id == evidence_id).first()
    if not evd:
        raise ValueError("Evidence not found")

    local_path = os.path.join(STORAGE_BASE, evd.file_name)
    if os.path.exists(local_path):
        with open(local_path, "a", encoding="utf-8") as f:
            f.write("\n[UNAUTHORIZED_MODIFICATION_TIMESTAMP_2026]")

    log_audit_event(
        db, actor_id=actor_id, action="TAMPER_SIMULATION",
        target_type="EVIDENCE", target_id=evd.id,
        details=f"Tampering simulation initiated on {evd.file_name}",
        result="SIMULATED"
    )
    # Immediately run verification to show the violation
    return verify_evidence_integrity(db, evidence_id, actor_id)

def restore_simulated_tampering(db: Session, evidence_id: str, original_content: str, actor_id: str) -> dict:
    """Restores the simulated file to original state."""
    evd = db.query(EvidenceRecord).filter(EvidenceRecord.id == evidence_id).first()
    if not evd:
        raise ValueError("Evidence not found")
    local_path = os.path.join(STORAGE_BASE, evd.file_name)
    with open(local_path, "w", encoding="utf-8") as f:
        f.write(original_content)
    return verify_evidence_integrity(db, evidence_id, actor_id)
