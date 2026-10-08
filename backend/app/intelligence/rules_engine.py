import uuid
from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.all_models import (
    Entity, CaseEntity, Relationship, Transaction, Alert, EvidenceRecord
)
from app.graph.network_service import build_networkx_graph
import networkx as nx

def run_intelligence_rules(db: Session, case_id: str = None) -> List[Alert]:
    """
    Evaluates deterministic intelligence detection rules against current database state.
    Generates structured alerts with supporting evidence and confidence scores.
    """
    new_alerts = []
    G = build_networkx_graph(db)
    betweenness = nx.betweenness_centrality(G) if len(G) > 0 else {}

    # Query all entities
    entities = db.query(Entity).all()

    for ent in entities:
        # Check existing alerts to avoid duplicate alerts
        existing_alert_titles = {
            a.title for a in db.query(Alert).filter(Alert.entity_id == ent.id).all()
        }

        # 1. Multi-case Presence (RULE 1)
        case_links = db.query(CaseEntity).filter(CaseEntity.entity_id == ent.id).all()
        case_count = len(case_links)
        if case_count >= 2 and "Cross-Jurisdictional Presence" not in existing_alert_titles:
            c_ids = [cl.case_id for cl in case_links]
            first_case_id = c_ids[0]
            alt = Alert(
                id=f"ALT-{str(uuid.uuid4())[:8]}",
                case_id=first_case_id,
                entity_id=ent.id,
                severity="HIGH" if case_count >= 3 else "MEDIUM",
                title="Cross-Jurisdictional Presence",
                reason=f"Entity '{ent.display_name}' appears across {case_count} separate cases, indicating cross-syndicate involvement.",
                supporting_evidence="Case Dossiers & Corroborating Records",
                confidence=min(0.98, 0.75 + case_count * 0.08),
                status="ACTIVE",
                created_at=datetime.utcnow()
            )
            db.add(alt)
            new_alerts.append(alt)

        # 2. High Betweenness Centrality / Network Influencer (RULE 3)
        b_score = betweenness.get(ent.id, 0.0)
        deg_score = G.degree(ent.id) if G.has_node(ent.id) else 0
        if b_score > 0.15 and "High Centrality Network Influencer" not in existing_alert_titles:
            # Pick primary case
            primary_case = case_links[0].case_id if case_links else (case_id or "system")
            alt = Alert(
                id=f"ALT-{str(uuid.uuid4())[:8]}",
                case_id=primary_case,
                entity_id=ent.id,
                severity="HIGH",
                title="High Centrality Network Influencer",
                reason=f"Betweenness centrality of {round(b_score, 3)} with {deg_score} direct connections identifies '{ent.display_name}' as a key coordination bridge in the criminal network.",
                supporting_evidence="Network Graph Analysis & Graph Topology",
                confidence=0.92,
                status="ACTIVE",
                created_at=datetime.utcnow()
            )
            db.add(alt)
            new_alerts.append(alt)

        # 3. High Risk / Flagged Financial Flows (RULE 4)
        tx_query = db.query(Transaction).filter(
            (Transaction.from_entity_id == ent.id) | (Transaction.to_entity_id == ent.id)
        ).all()
        flagged_txs = [t for t in tx_query if t.status in ["FLAGGED", "HIGH_RISK", "SUSPICIOUS"]]
        if len(flagged_txs) >= 1 and "Suspicious Transaction Patterns" not in existing_alert_titles:
            primary_case = flagged_txs[0].case_id
            total_amt = sum(t.amount for t in flagged_txs)
            alt = Alert(
                id=f"ALT-{str(uuid.uuid4())[:8]}",
                case_id=primary_case,
                entity_id=ent.id,
                severity="HIGH" if total_amt > 500000 else "MEDIUM",
                title="Suspicious Transaction Patterns",
                reason=f"Detected {len(flagged_txs)} flagged transactions totaling Rs. {total_amt:,.2f} involving '{ent.display_name}'. Channels include rapid routing and mirror deposits.",
                supporting_evidence=f"Financial Ledger [{flagged_txs[0].method}]",
                confidence=0.94,
                status="ACTIVE",
                created_at=datetime.utcnow()
            )
            db.add(alt)
            new_alerts.append(alt)

        # 4. Shared Identifier Alert (RULE 5 & 6)
        # If Phone or Vehicle is connected to multiple people
        if ent.entity_type in ["Phone", "Vehicle"]:
            direct_users = db.query(Relationship).filter(
                Relationship.target_entity_id == ent.id,
                Relationship.relationship_type.in_(["USED", "OWNED", "OPERATED"])
            ).all()
            if len(direct_users) > 1 and "Shared Identifier Across Multiple Entities" not in existing_alert_titles:
                primary_case = direct_users[0].case_id
                alt = Alert(
                    id=f"ALT-{str(uuid.uuid4())[:8]}",
                    case_id=primary_case,
                    entity_id=ent.id,
                    severity="HIGH",
                    title="Shared Identifier Across Multiple Entities",
                    reason=f"{ent.entity_type} '{ent.display_name}' is utilized by {len(direct_users)} different entities, indicating shared infrastructure or burner usage.",
                    supporting_evidence="Telecommunication & Logistics Registry",
                    confidence=0.91,
                    status="ACTIVE",
                    created_at=datetime.utcnow()
                )
                db.add(alt)
                new_alerts.append(alt)

    db.commit()
    return new_alerts
