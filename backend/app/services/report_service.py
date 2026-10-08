import uuid
from datetime import datetime
from typing import Dict, Any, Optional

from sqlalchemy.orm import Session

from app.models.all_models import (
    Case,
    Entity,
    CaseEntity,
    Relationship,
    Alert,
    EvidenceRecord,
    CrossCaseLink,
    AuditLedger,
    Report
)

from app.graph.network_service import build_networkx_graph
import networkx as nx


def generate_investigation_report(
    db: Session,
    case_id: Optional[str] = None,
    report_type: str = "COMPREHENSIVE",
    generated_by: str = "investigator@chaintrace.local",
    scope_notes: Optional[str] = None
) -> Report:
    """
    Generates a concise, evidence-grounded intelligence dossier.
    """

    # ============================================================
    # CASE
    # ============================================================

    case = (
        db.query(Case).filter(Case.id == case_id).first()
        if case_id
        else db.query(Case).first()
    )

    case_code = case.case_code if case else "SYSTEM-WIDE"
    case_title = (
        case.title
        if case
        else "Multi-Jurisdictional Intelligence Synthesis"
    )
    district = case.district if case else "State Jurisdiction"

    # ============================================================
    # NETWORK GRAPH
    # ============================================================

    G = build_networkx_graph(
        db,
        case.id if case else None
    )

    betweenness = (
        nx.betweenness_centrality(G)
        if len(G) > 0
        else {}
    )

    degree = (
        dict(G.degree())
        if len(G) > 0
        else {}
    )

    # ============================================================
    # ENTITIES
    # ============================================================

    case_entities_query = db.query(CaseEntity)

    if case:
        case_entities_query = case_entities_query.filter(
            CaseEntity.case_id == case.id
        )

    c_ents = case_entities_query.all()

    ent_ids = [
        ce.entity_id
        for ce in c_ents
    ]

    entities = (
        db.query(Entity)
        .filter(Entity.id.in_(ent_ids))
        .all()
        if ent_ids
        else db.query(Entity).limit(10).all()
    )

    # ============================================================
    # RELATIONSHIPS
    # ============================================================

    rels_query = db.query(Relationship)

    if case:
        rels_query = rels_query.filter(
            Relationship.case_id == case.id
        )

    relationships = rels_query.all()

    # ============================================================
    # ALERTS
    # ============================================================

    alerts_query = db.query(Alert)

    if case:
        alerts_query = alerts_query.filter(
            Alert.case_id == case.id
        )

    alerts = alerts_query.all()

    # ============================================================
    # EVIDENCE
    # ============================================================

    evd_query = db.query(EvidenceRecord)

    if case:
        evd_query = evd_query.filter(
            EvidenceRecord.case_id == case.id
        )

    evidences = evd_query.all()

    # ============================================================
    # CROSS-CASE CORRELATIONS
    # ============================================================

    ccl_query = db.query(CrossCaseLink)

    if case:
        ccl_query = ccl_query.filter(
            (CrossCaseLink.case_a_id == case.id)
            | (CrossCaseLink.case_b_id == case.id)
        )

    cross_links = ccl_query.all()

    # ============================================================
    # AUDIT TRAIL
    # ============================================================

    audits = (
        db.query(AuditLedger)
        .order_by(AuditLedger.timestamp.desc())
        .limit(10)
        .all()
    )

    # ============================================================
    # DYNAMIC SUPPORTING DATA
    # ============================================================

    # Relationship type counts
    relationship_type_counts: Dict[str, int] = {}

    for r in relationships:
        relationship_type_counts[r.relationship_type] = (
            relationship_type_counts.get(r.relationship_type, 0) + 1
        )

    relationship_summary = ", ".join(
        f"{rtype} ({count})"
        for rtype, count in sorted(
            relationship_type_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )
    )

    if not relationship_summary:
        relationship_summary = "No relationship vectors recorded"

    # Highest centrality entity
    top_centrality_entity = None
    top_centrality_score = 0.0

    if entities:
        ranked_entities = sorted(
            entities,
            key=lambda e: betweenness.get(e.id, 0.0),
            reverse=True
        )

        if ranked_entities:
            top_centrality_entity = ranked_entities[0]
            top_centrality_score = betweenness.get(
                ranked_entities[0].id,
                0.0
            )

    # Alert summary
    high_alerts = [
        a for a in alerts
        if str(a.severity).upper() == "HIGH"
    ]

    medium_alerts = [
        a for a in alerts
        if str(a.severity).upper() == "MEDIUM"
    ]

    alert_summary_parts = []

    if high_alerts:
        alert_summary_parts.append(
            f"{len(high_alerts)} HIGH"
        )

    if medium_alerts:
        alert_summary_parts.append(
            f"{len(medium_alerts)} MEDIUM"
        )

    alert_summary = (
        ", ".join(alert_summary_parts)
        if alert_summary_parts
        else "No active alerts"
    )

    # ============================================================
    # BUILD REPORT
    # ============================================================

    content = f"""# STATE CRIME INVESTIGATION WING
## INTELLIGENCE DOSSIER

**Document ID:** `REP-{uuid.uuid4().hex[:8].upper()}`  
**Classification:** `STRICTLY CONFIDENTIAL // LAW ENFORCEMENT INTELLIGENCE`  
**Date of Generation:** `{datetime.utcnow().strftime('%d-%b-%Y %H:%M:%S UTC')}`  
**Investigating Officer:** `{generated_by}`  
**Report Type:** `{report_type}`  

---

## 1. CASE INFORMATION

| Field | Details |
| :--- | :--- |
| **Case Code** | **{case_code}** |
| **Case Title** | **{case_title}** |
| **Jurisdiction** | {district} |
| **Status** | **{case.status if case else 'ACTIVE'}** |
| **Priority** | **{case.priority if case else 'HIGH'}** |
| **Date of Entry** | {case.created_at.strftime('%d-%b-%Y') if case else 'N/A'} |
| **Description** | {case.description if case else 'Broad intelligence synthesis across active investigations.'} |

---

## 2. EXECUTIVE SUMMARY

**{case_code} — {case_title}** contains **{len(evidences)} verified evidence artifact(s)**, **{len(entities)} identified entities**, and **{len(relationships)} relationship vectors**.

The system identified **{len(alerts)} intelligence alert(s)** and **{len(cross_links)} cross-case correlation record(s)** for investigator review.

---

## 3. KEY ENTITIES

**{len(entities)} entities** were identified in the selected case scope.

| Entity | Type | Degree | Betweenness | Confidence |
| :--- | :--- | ---: | ---: | ---: |
"""

    for e in entities:
        b_score = round(
            betweenness.get(e.id, 0.0),
            3
        )

        deg_score = degree.get(
            e.id,
            0
        )

        content += (
            f"| **{e.display_name}** | {e.entity_type} | "
            f"{deg_score} | {b_score} | "
            f"{e.confidence * 100:.0f}% |\n"
        )

    content += f"""
---

## 4. RELATIONSHIP ANALYSIS

**{len(relationships)} relationship vectors** were identified.

**Relationship distribution:** {relationship_summary}

### Representative Connections

"""

    if relationships:
        for r in relationships[:6]:
            src = (
                db.query(Entity)
                .filter(Entity.id == r.source_entity_id)
                .first()
            )

            tgt = (
                db.query(Entity)
                .filter(Entity.id == r.target_entity_id)
                .first()
            )

            src_name = (
                src.display_name
                if src
                else r.source_entity_id
            )

            tgt_name = (
                tgt.display_name
                if tgt
                else r.target_entity_id
            )

            content += (
                f"- **{src_name}** → **{tgt_name}** "
                f"`{r.relationship_type}` "
                f"({r.confidence * 100:.0f}% confidence)\n"
            )

        if len(relationships) > 6:
            content += (
                f"\n*Showing 6 representative relationships; "
                f"{len(relationships) - 6} additional vectors are retained "
                f"in the investigative database.*\n"
            )
    else:
        content += "No relationship vectors were recorded.\n"

    content += f"""
---

## 5. NETWORK ANALYSIS

| Metric | Result |
| :--- | ---: |
| **Network Nodes** | {len(G.nodes())} |
| **Network Edges** | {len(G.edges())} |
| **Connected Components** | {nx.number_connected_components(G) if len(G) > 0 else 0} |

"""

    if top_centrality_entity:
        content += (
            f"**Highest observed betweenness:** "
            f"{top_centrality_entity.display_name} "
            f"({top_centrality_entity.entity_type}) — "
            f"{top_centrality_score:.3f}.\n\n"
        )
    else:
        content += (
            "**Highest observed betweenness:** No network centrality "
            "finding available.\n\n"
        )

    content += (
        "Betweenness reflects network position and is used as an "
        "investigative prioritization metric; it does not independently "
        "establish criminal activity.\n"
    )

    content += f"""
---

## 6. INTELLIGENCE ALERTS

**{len(alerts)} alert(s)** are associated with this investigative scope.

"""

    if alerts:
        content += (
            "| Severity | Alert | Target | Status | Confidence |\n"
            "| :--- | :--- | :--- | :--- | ---: |\n"
        )

        for a in alerts:
            target_entity = (
                db.query(Entity)
                .filter(Entity.id == a.entity_id)
                .first()
            )

            target_name = (
                target_entity.display_name
                if target_entity
                else a.entity_id
            )

            content += (
                f"| **{a.severity}** | {a.title} | "
                f"**{target_name}** | {a.status} | "
                f"{a.confidence * 100:.0f}% |\n"
            )

        content += "\n### Alert Findings\n\n"

        for a in alerts[:5]:
            content += (
                f"- **{a.title}:** {a.reason}\n"
            )

        if len(alerts) > 5:
            content += (
                f"\n*Showing 5 alert findings; "
                f"{len(alerts) - 5} additional alerts remain available "
                f"in the Intelligence Alerts module.*\n"
            )
    else:
        content += (
            "No intelligence alerts are currently associated with "
            "this investigative scope.\n"
        )

    content += """
---

## 7. CROSS-CASE INTELLIGENCE

"""

    if cross_links:
        content += (
            f"**{len(cross_links)} cross-case correlation record(s)** "
            "were identified.\n\n"
            "| Entity | Case A | Case B | Match | Confidence |\n"
            "| :--- | :--- | :--- | :--- | ---: |\n"
        )

        for cl in cross_links:
            ent = (
                db.query(Entity)
                .filter(Entity.id == cl.entity_id)
                .first()
            )

            ent_name = (
                ent.display_name
                if ent
                else cl.entity_id
            )

            ca = (
                db.query(Case)
                .filter(Case.id == cl.case_a_id)
                .first()
            )

            cb = (
                db.query(Case)
                .filter(Case.id == cl.case_b_id)
                .first()
            )

            ca_code = ca.case_code if ca else "CASE-A"
            cb_code = cb.case_code if cb else "CASE-B"

            content += (
                f"| **{ent_name}** | {ca_code} | {cb_code} | "
                f"`{cl.match_type}` | "
                f"{cl.confidence * 100:.0f}% |\n"
            )
    else:
        content += (
            "No cross-case correlations were identified under the "
            "current analytical scope.\n"
        )

    content += f"""
---

## 8. EVIDENCE INVENTORY

**{len(evidences)} verified evidence artifact(s)** are associated with this case.

| Evidence ID | File | Size | Status |
| :--- | :--- | ---: | :--- |
"""

    for ev in evidences:
        content += (
            f"| **{ev.id}** | `{ev.file_name}` | "
            f"{ev.file_size} bytes | **{ev.verification_status}** |\n"
        )

    if not evidences:
        content += (
            "| — | No evidence artifacts recorded | — | — |\n"
        )

    content += f"""
---

## 9. EVIDENCE INTEGRITY

All evidence artifacts are tracked through the tamper-evident SHA-256 ledger.

| Evidence ID | Status | SHA-256 | Previous Hash |
| :--- | :--- | :--- | :--- |
"""

    for ev in evidences:
        previous_hash = (
            ev.previous_hash[:16] + "..."
            if ev.previous_hash
            else "None"
        )

        sha_hash = (
            ev.sha256_hash[:20] + "..."
            if ev.sha256_hash
            else "Unavailable"
        )

        content += (
            f"| **{ev.id}** | **{ev.verification_status}** | "
            f"`{sha_hash}` | `{previous_hash}` |\n"
        )

    if not evidences:
        content += (
            "| — | No evidence records | — | — |\n"
        )

    content += f"""
---

## 10. AI INVESTIGATION FINDINGS

"""

    # ============================================================
    # DYNAMIC AI INVESTIGATION FINDINGS
    # ============================================================

    if top_centrality_entity:
        centrality_finding = (
            f"The highest network centrality observed in this scope "
            f"is associated with **{top_centrality_entity.display_name}**, "
            f"with a betweenness score of **{top_centrality_score:.3f}**."
        )
    else:
        centrality_finding = (
            "No centrality finding was available for the current scope."
        )

    if relationship_type_counts:
        relationship_finding = (
            f"The relationship graph contains **{len(relationships)} "
            f"vectors**, primarily represented by "
            f"**{relationship_summary}**."
        )
    else:
        relationship_finding = (
            "No relationship vectors were available for analysis."
        )

    if alerts:
        alert_finding = (
            f"The intelligence rules engine identified **{len(alerts)} "
            f"alert(s)** requiring investigator review."
        )

        first_alert = alerts[0]

        alert_detail = (
            f"The current leading alert is **{first_alert.title}**, "
            f"rated **{first_alert.severity}**, involving the "
            f"identified entity `{first_alert.entity_id}`."
        )
    else:
        alert_finding = (
            "No intelligence alerts were generated for the current scope."
        )

        alert_detail = (
            "No alert-specific investigative finding is currently available."
        )

    if cross_links:
        cross_case_finding = (
            f"Cross-case analysis identified **{len(cross_links)} "
            f"correlation record(s)** involving recurring entities or "
            f"identifiers across investigative dossiers."
        )
    else:
        cross_case_finding = (
            "No cross-case correlation records were identified."
        )

    integrity_verified = sum(
        1
        for ev in evidences
        if str(ev.verification_status).upper() == "VERIFIED"
    )

    integrity_finding = (
        f"**{integrity_verified} of {len(evidences)} evidence artifact(s)** "
        f"are currently marked VERIFIED in the evidence ledger."
        if evidences
        else
        "No evidence artifacts are currently associated with this scope."
    )

    content += (
        f"- {relationship_finding}\n"
        f"- {centrality_finding}\n"
        f"- {alert_finding} {alert_detail}\n"
        f"- {cross_case_finding}\n"
        f"- {integrity_finding}\n\n"
        "These findings are generated from the investigative records "
        "available within the selected system scope. They are intended "
        "to assist investigator decision-making and require independent "
        "human validation before operational or legal action.\n"
    )

    content += f"""
---

## 11. INVESTIGATOR NOTES

{scope_notes or 'Investigator review and field corroboration recommended for the identified investigative leads.'}

---

## 12. AUDIT TRAIL

Recent investigative and evidence-integrity activity:

| Time | Action | Actor |
| :--- | :--- | :--- |
"""

    for ad in audits[:5]:
        content += (
            f"| `{ad.timestamp.strftime('%Y-%m-%d %H:%M:%S')}` | "
            f"**{ad.action}** | `{ad.actor_id}` |\n"
        )

    if not audits:
        content += (
            "| — | No audit entries available | — |\n"
        )

    content += f"""
---

## CONFIDENTIALITY NOTICE

**Confidential — Generated by Thupparivalan Criminal Investigation Intelligence System.**

This dossier contains investigative intelligence generated from records available within the system. Algorithmic findings and correlations are intended to assist authorized investigators and require appropriate human validation.

**Evidence Integrity:** SHA-256 Tamper-Evident Ledger  
**System:** Thupparivalan Criminal Investigation Intelligence Platform  
"""

    # ============================================================
    # SAVE REPORT
    # ============================================================

    report = Report(
        id=f"REP-{str(uuid.uuid4())[:8]}",
        case_id=case.id if case else "system",
        case_code=case_code,
        generated_by=generated_by,
        title=f"Intelligence Dossier — {case_code} {case_title}",
        report_type=report_type,
        content=content,
        created_at=datetime.utcnow()
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return report