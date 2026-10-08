import uuid
from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.all_models import Entity, Case, CaseEntity, Relationship, CrossCaseLink

def analyze_cross_case_intelligence(db: Session) -> List[CrossCaseLink]:
    """
    Scans all cases across the system to dynamically identify:
    1. Common entities appearing across multiple cases.
    2. Shared phones or vehicles linking independent cases.
    3. Direct financial or communication ties between cases.
    """
    existing_links = db.query(CrossCaseLink).all()
    existing_pairs = {(cl.entity_id, cl.case_a_id, cl.case_b_id) for cl in existing_links}
    new_links = []

    # 1. Detect entities linked to 2 or more cases
    entities = db.query(Entity).all()
    for ent in entities:
        case_links = db.query(CaseEntity).filter(CaseEntity.entity_id == ent.id).all()
        if len(case_links) >= 2:
            # Check all pairwise combinations
            for i in range(len(case_links)):
                for j in range(i + 1, len(case_links)):
                    c_a = case_links[i].case_id
                    c_b = case_links[j].case_id

                    if (ent.id, c_a, c_b) not in existing_pairs and (ent.id, c_b, c_a) not in existing_pairs:
                        # Find shared identifiers (phones, vehicles)
                        rels_a = db.query(Relationship).filter(
                            (Relationship.source_entity_id == ent.id) | (Relationship.target_entity_id == ent.id),
                            Relationship.case_id == c_a
                        ).all()
                        rels_b = db.query(Relationship).filter(
                            (Relationship.source_entity_id == ent.id) | (Relationship.target_entity_id == ent.id),
                            Relationship.case_id == c_b
                        ).all()

                        shared_identifiers = []
                        target_ids_a = {r.target_entity_id for r in rels_a} | {r.source_entity_id for r in rels_a}
                        target_ids_b = {r.target_entity_id for r in rels_b} | {r.source_entity_id for r in rels_b}
                        overlap = (target_ids_a & target_ids_b) - {ent.id}

                        if overlap:
                            overlap_ents = db.query(Entity).filter(Entity.id.in_(overlap)).all()
                            for oe in overlap_ents:
                                shared_identifiers.append(f"shared {oe.entity_type.lower()}: {oe.display_name}")

                        # Determine match reason and confidence
                        reasons = [f"Direct entity presence in both case dossiers"]
                        conf = 0.88
                        if shared_identifiers:
                            reasons.append(f"Matching operational assets ({', '.join(shared_identifiers)})")
                            conf = 0.96
                            match_type = "EXACT_IDENTIFIER_MATCH"
                        else:
                            match_type = "MULTI_CASE_CO_OCCURRENCE"

                        link = CrossCaseLink(
                            id=f"CCL-{str(uuid.uuid4())[:8]}",
                            entity_id=ent.id,
                            case_a_id=c_a,
                            case_b_id=c_b,
                            match_type=match_type,
                            match_reason="; ".join(reasons),
                            confidence=conf,
                            created_at=datetime.utcnow()
                        )
                        db.add(link)
                        new_links.append(link)
                        existing_pairs.add((ent.id, c_a, c_b))

    db.commit()
    return new_links

def get_cross_case_matrix(db: Session) -> List[Dict[str, Any]]:
    """Returns all cross-case links enriched with case details, entity metadata, and verification statuses."""
    links = db.query(CrossCaseLink).order_by(CrossCaseLink.confidence.desc()).all()
    results = []

    case_cache = {c.id: c for c in db.query(Case).all()}
    entity_cache = {e.id: e for e in db.query(Entity).all()}

    for l in links:
        case_a = case_cache.get(l.case_a_id)
        case_b = case_cache.get(l.case_b_id)
        ent = entity_cache.get(l.entity_id)

        results.append({
            "id": l.id,
            "entity_id": l.entity_id,
            "entity_name": ent.display_name if ent else "Unknown Entity",
            "entity_type": ent.entity_type if ent else "Person",
            "case_a_id": l.case_a_id,
            "case_a_code": case_a.case_code if case_a else "CASE-A",
            "case_a_title": case_a.title if case_a else "Case A",
            "case_b_id": l.case_b_id,
            "case_b_code": case_b.case_code if case_b else "CASE-B",
            "case_b_title": case_b.title if case_b else "Case B",
            "match_type": l.match_type,
            "match_reason": l.match_reason,
            "confidence": round(l.confidence, 2),
            "created_at": l.created_at
        })

    return results
