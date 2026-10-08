import os
import csv
import json
import uuid
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.connection import engine, Base, SessionLocal
from app.models.all_models import (
    User, Case, Entity, Relationship, Transaction, Location,
    Alert, CrossCaseLink, EvidenceRecord, AuditLedger
)
from app.security.auth import hash_password
from app.api.auth_routes import router as auth_router
from app.api.case_routes import router as case_router
from app.api.evidence_routes import router as evidence_router
from app.api.entity_routes import router as entity_router
from app.api.graph_routes import router as graph_router
from app.api.alert_routes import router as alert_router
from app.api.cross_case_routes import router as cross_case_router
from app.api.investigation_routes import router as investigation_router
from app.api.report_routes import router as report_router
from app.api.audit_routes import router as audit_router
from app.api.dashboard_routes import router as dashboard_router

# Auto-seed synthetic test data if database is fresh
def auto_seed_if_empty():
    db = SessionLocal()
    try:
        # 1. Ensure default demo investigator exists
        demo_email = "investigator@chaintrace.local"
        demo_pass = os.getenv("DEMO_PASSWORD", "Thupparivalan@2026")
        existing_user = db.query(User).filter(User.email == demo_email).first()
        if not existing_user:
            demo_user = User(
                id="usr-inv-001",
                email=demo_email,
                full_name="K. Vijayakanth IPS (Superintendent)",
                role="INVESTIGATOR",
                password_hash=hash_password(demo_pass),
                created_at=datetime.utcnow()
            )
            db.add(demo_user)
            db.commit()
            print(f"Created demo investigator: {demo_email}")

        # 2. Check if cases exist
        if db.query(Case).count() == 0:
            print("Database empty. Auto-seeding from synthetic dataset...")
            synthetic_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "synthetic")
            
            # Seed Cases
            cases_csv = os.path.join(synthetic_dir, "cases.csv")
            if os.path.exists(cases_csv):
                with open(cases_csv, "r", encoding="utf-8") as f:
                    for row in csv.DictReader(f):
                        c = Case(
                            id=row["id"],
                            case_code=row["case_code"],
                            title=row["title"],
                            description=row["description"],
                            district=row["district"],
                            status=row["status"],
                            priority=row["priority"],
                            created_by=row["created_by"],
                            created_at=datetime.fromisoformat(row["created_at"]),
                            updated_at=datetime.fromisoformat(row["updated_at"])
                        )
                        db.add(c)
                db.commit()

            # Seed Entities (Persons, Phones, Vehicles, Locations)
            persons_csv = os.path.join(synthetic_dir, "persons.csv")
            if os.path.exists(persons_csv):
                with open(persons_csv, "r", encoding="utf-8") as f:
                    for row in csv.DictReader(f):
                        e = Entity(
                            id=row["code"],
                            entity_type="Person",
                            display_name=row["name"],
                            normalized_name=row["name"].lower().strip(),
                            confidence=float(row["confidence"]),
                            details=row["role_desc"]
                        )
                        db.add(e)
                db.commit()

            phones_csv = os.path.join(synthetic_dir, "phones.csv")
            if os.path.exists(phones_csv):
                with open(phones_csv, "r", encoding="utf-8") as f:
                    for row in csv.DictReader(f):
                        e = Entity(
                            id=row["code"],
                            entity_type="Phone",
                            display_name=row["name"],
                            normalized_name=row["number"].strip(),
                            confidence=0.98,
                            details=f"Carrier: {row['provider']}"
                        )
                        db.add(e)
                db.commit()

            vehicles_csv = os.path.join(synthetic_dir, "vehicles.csv")
            if os.path.exists(vehicles_csv):
                with open(vehicles_csv, "r", encoding="utf-8") as f:
                    for row in csv.DictReader(f):
                        e = Entity(
                            id=row["code"],
                            entity_type="Vehicle",
                            display_name=row["name"],
                            normalized_name=row["reg_no"].strip(),
                            confidence=0.95,
                            details=row["make"]
                        )
                        db.add(e)
                db.commit()

            locations_csv = os.path.join(synthetic_dir, "locations.csv")
            if os.path.exists(locations_csv):
                with open(locations_csv, "r", encoding="utf-8") as f:
                    for row in csv.DictReader(f):
                        loc = Location(
                            id=row["id"],
                            name=row["name"],
                            district=row["district"],
                            state=row["state"],
                            latitude=float(row["lat"]),
                            longitude=float(row["lng"])
                        )
                        db.add(loc)
                        # Also as entity
                        e = Entity(
                            id=f"LOC-{row['id'][:4]}",
                            entity_type="Location",
                            display_name=row["name"],
                            normalized_name=row["name"].lower().strip(),
                            confidence=0.92,
                            details=f"{row['district']}, {row['state']}"
                        )
                        db.add(e)
                db.commit()

            # Seed Case-Entity links & Relationships
            rels_csv = os.path.join(synthetic_dir, "relationships.csv")
            if os.path.exists(rels_csv):
                with open(rels_csv, "r", encoding="utf-8") as f:
                    case_code_to_id = {c.case_code: c.id for c in db.query(Case).all()}
                    from app.models.all_models import CaseEntity
                    for row in csv.DictReader(f):
                        cid = case_code_to_id.get(row["case_code"])
                        if cid:
                            rel = Relationship(
                                id=f"REL-{str(uuid.uuid4())[:8]}",
                                source_entity_id=row["source"],
                                target_entity_id=row["target"],
                                relationship_type=row["rel"],
                                case_id=cid,
                                confidence=float(row["conf"]),
                                created_at=datetime.utcnow()
                            )
                            db.add(rel)
                            # Link both entities to case
                            for ent_id in [row["source"], row["target"]]:
                                existing_ce = db.query(CaseEntity).filter(
                                    CaseEntity.case_id == cid, CaseEntity.entity_id == ent_id
                                ).first()
                                if not existing_ce and db.query(Entity).filter(Entity.id == ent_id).first():
                                    ce = CaseEntity(
                                        id=f"CE-{str(uuid.uuid4())[:8]}",
                                        case_id=cid,
                                        entity_id=ent_id,
                                        confidence=0.95
                                    )
                                    db.add(ce)
                db.commit()

            # Seed Transactions
            tx_csv = os.path.join(synthetic_dir, "transactions.csv")
            if os.path.exists(tx_csv):
                with open(tx_csv, "r", encoding="utf-8") as f:
                    case_code_to_id = {c.case_code: c.id for c in db.query(Case).all()}
                    for row in csv.DictReader(f):
                        cid = case_code_to_id.get(row["case_code"], "system")
                        tx = Transaction(
                            id=row["id"],
                            case_id=cid,
                            from_entity_id=row["from_entity"],
                            to_entity_id=row["to_entity"],
                            amount=float(row["amount"]),
                            currency="INR",
                            method=row["method"],
                            status=row["status"],
                            timestamp=datetime.fromisoformat(row["timestamp"])
                        )
                        db.add(tx)
                db.commit()

            # Seed Evidence Records
            evd_csv = os.path.join(synthetic_dir, "evidence.csv")
            if os.path.exists(evd_csv):
                with open(evd_csv, "r", encoding="utf-8") as f:
                    case_code_to_id = {c.case_code: c.id for c in db.query(Case).all()}
                    for row in csv.DictReader(f):
                        cid = case_code_to_id.get(row["case_code"], "system")
                        ev = EvidenceRecord(
                            id=row["evidence_id"],
                            case_id=cid,
                            case_code=row["case_code"],
                            file_name=row["file_name"],
                            storage_path=row["storage_path"],
                            mime_type=row["mime_type"],
                            file_size=int(row["file_size"]),
                            sha256_hash=row["sha256_hash"],
                            previous_hash=row["previous_hash"],
                            uploaded_by=row["uploaded_by"],
                            uploaded_at=datetime.fromisoformat(row["uploaded_at"]),
                            verification_status=row["verification_status"],
                            last_verified_at=datetime.fromisoformat(row["last_verified_at"])
                        )
                        db.add(ev)
                db.commit()

            # Seed Alerts
            alerts_csv = os.path.join(synthetic_dir, "alerts.csv")
            if os.path.exists(alerts_csv):
                with open(alerts_csv, "r", encoding="utf-8") as f:
                    case_code_to_id = {c.case_code: c.id for c in db.query(Case).all()}
                    for row in csv.DictReader(f):
                        cid = case_code_to_id.get(row["case_code"], "system")
                        alt = Alert(
                            id=row["id"],
                            case_id=cid,
                            entity_id=row["entity_code"],
                            severity=row["severity"],
                            title=row["title"],
                            reason=row["reason"],
                            supporting_evidence=row["supporting_evidence"],
                            confidence=float(row["confidence"]),
                            status=row["status"],
                            created_at=datetime.fromisoformat(row["created_at"])
                        )
                        db.add(alt)
                db.commit()

            # Seed Cross-Case Links
            ccl_csv = os.path.join(synthetic_dir, "cross_case_links.csv")
            if os.path.exists(ccl_csv):
                with open(ccl_csv, "r", encoding="utf-8") as f:
                    case_code_to_id = {c.case_code: c.id for c in db.query(Case).all()}
                    for row in csv.DictReader(f):
                        ca = case_code_to_id.get(row["case_a"])
                        cb = case_code_to_id.get(row["case_b"])
                        if ca and cb:
                            link = CrossCaseLink(
                                id=row["id"],
                                entity_id=row["entity_code"],
                                case_a_id=ca,
                                case_b_id=cb,
                                match_type=row["match_type"],
                                match_reason=row["match_reason"],
                                confidence=float(row["confidence"]),
                                created_at=datetime.fromisoformat(row["created_at"])
                            )
                            db.add(link)
                db.commit()

            # Seed Audit Entries
            audit_csv = os.path.join(synthetic_dir, "audit_ledger.csv")
            if os.path.exists(audit_csv):
                with open(audit_csv, "r", encoding="utf-8") as f:
                    for row in csv.DictReader(f):
                        ad = AuditLedger(
                            id=row["id"],
                            timestamp=datetime.fromisoformat(row["timestamp"]),
                            actor_id=row["actor"],
                            action=row["action"],
                            target_type=row["target_type"],
                            target_id=row["target_id"],
                            details=row["details"],
                            result=row["result"],
                            previous_hash=row["previous_hash"],
                            record_hash=row["record_hash"]
                        )
                        db.add(ad)
                db.commit()

            print("Auto-seeding complete! Real records populated.")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist and seed demo data
    Base.metadata.create_all(bind=engine)
    auto_seed_if_empty()
    yield
    # Shutdown

app = FastAPI(
    title="Thupparivalan — Criminal Investigation Intelligence API",
    description="Production-style, full-stack, AI-assisted criminal investigation intelligence platform.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth_router)
app.include_router(case_router)
app.include_router(evidence_router)
app.include_router(entity_router)
app.include_router(graph_router)
app.include_router(alert_router)
app.include_router(cross_case_router)
app.include_router(investigation_router)
app.include_router(report_router)
app.include_router(audit_router)
app.include_router(dashboard_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "platform": "Thupparivalan Criminal Intelligence Engine",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }
