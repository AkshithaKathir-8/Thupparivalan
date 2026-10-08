from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.all_models import (
    Case, Entity, Relationship, Transaction, EvidenceRecord, Alert, CrossCaseLink, AuditLedger, User
)
from app.security.auth import get_current_investigator
from app.graph.network_service import build_networkx_graph
import networkx as nx

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats(
    case_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_investigator)
):
    # Base tallies
    total_cases = db.query(Case).count()
    total_persons = db.query(Entity).filter(Entity.entity_type == "Person").count()
    total_phones = db.query(Entity).filter(Entity.entity_type == "Phone").count()
    total_vehicles = db.query(Entity).filter(Entity.entity_type == "Vehicle").count()
    total_locations = db.query(Entity).filter(Entity.entity_type == "Location").count()
    total_txs = db.query(Transaction).count()
    total_relationships = db.query(Relationship).count()
    total_evidence = db.query(EvidenceRecord).count()
    total_alerts = db.query(Alert).count()
    high_alerts = db.query(Alert).filter(Alert.severity.in_(["HIGH", "CRITICAL"])).count()
    total_cross_links = db.query(CrossCaseLink).count()

    # Integrity tallies
    verified_evd = db.query(EvidenceRecord).filter(EvidenceRecord.verification_status == "VERIFIED").count()
    tampered_evd = db.query(EvidenceRecord).filter(EvidenceRecord.verification_status.in_(["MODIFIED", "MISSING", "ERROR"])).count()

    # Key network influencers via NetworkX
    G = build_networkx_graph(db)
    top_influencers = []
    if len(G) > 0:
        betweenness = nx.betweenness_centrality(G)
        sorted_b = sorted(betweenness.items(), key=lambda x: x[1], reverse=True)[:5]
        for node_id, score in sorted_b:
            ent = db.query(Entity).filter(Entity.id == node_id).first()
            if ent:
                top_influencers.append({
                    "id": ent.id,
                    "name": ent.display_name,
                    "type": ent.entity_type,
                    "betweenness": round(score, 3),
                    "connections": G.degree(node_id)
                })

    # Recent Alerts
    recent_alerts = db.query(Alert).order_by(Alert.created_at.desc()).limit(5).all()
    alert_list = [
        {
            "id": a.id,
            "title": a.title,
            "severity": a.severity,
            "reason": a.reason,
            "entity_id": a.entity_id,
            "case_id": a.case_id,
            "supporting_evidence": a.supporting_evidence,
            "confidence": a.confidence
        }
        for a in recent_alerts
    ]

    # Recent Audit activity
    recent_audits = db.query(AuditLedger).order_by(AuditLedger.timestamp.desc()).limit(6).all()
    audit_list = [
        {
            "id": a.id,
            "timestamp": a.timestamp,
            "action": a.action,
            "target": a.target_id,
            "details": a.details,
            "result": a.result
        }
        for a in recent_audits
    ]

    # Dynamic AI Case Summary
    first_case = db.query(Case).first()
    summary_text = (
        f"Investigation intelligence matrix contains {total_cases} registered active cases and {total_evidence} verified evidence files. "
        f"Algorithmic graph correlation identified {high_alerts} high-priority investigative alerts and {total_cross_links} cross-case bridge points requiring investigator focus."
    )

    return {
        "counts": {
            "cases": total_cases,
            "persons": total_persons,
            "phones": total_phones,
            "vehicles": total_vehicles,
            "locations": total_locations,
            "transactions": total_txs,
            "relationships": total_relationships,
            "evidence": total_evidence,
            "alerts": total_alerts,
            "high_alerts": high_alerts,
            "cross_case_links": total_cross_links,
            "integrity_verified": verified_evd,
            "integrity_violations": tampered_evd
        },
        "summary": summary_text,
        "top_influencers": top_influencers,
        "recent_alerts": alert_list,
        "recent_audits": audit_list
    }
