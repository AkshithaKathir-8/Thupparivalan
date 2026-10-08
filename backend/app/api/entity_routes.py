from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.all_models import Entity, CaseEntity, Case, Relationship, Alert, EvidenceRecord, User
from app.schemas.all_schemas import EntityResponse
from app.security.auth import get_current_investigator
from app.graph.network_service import build_networkx_graph, get_entity_dossier
import networkx as nx

router = APIRouter(prefix="/api", tags=["Entities"])

@router.get("/entities", response_model=List[EntityResponse])
def list_entities(
    case_id: Optional[str] = None,
    entity_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_investigator)
):
    query = db.query(Entity)
    if entity_type:
        query = query.filter(Entity.entity_type == entity_type)

    if case_id:
        case = db.query(Case).filter((Case.id == case_id) | (Case.case_code == case_id)).first()
        if case:
            c_links = db.query(CaseEntity).filter(CaseEntity.case_id == case.id).all()
            ent_ids = [cl.entity_id for cl in c_links]
            query = query.filter(Entity.id.in_(ent_ids))

    entities = query.all()

    # NetworkX metrics
    G = build_networkx_graph(db)
    betweenness = nx.betweenness_centrality(G) if len(G) > 0 else {}
    degree = nx.degree_centrality(G) if len(G) > 0 else {}

    results = []
    for e in entities:
        c_links = db.query(CaseEntity).filter(CaseEntity.entity_id == e.id).all()
        cases = [cl.case_id for cl in c_links]
        conn_count = db.query(Relationship).filter(
            (Relationship.source_entity_id == e.id) | (Relationship.target_entity_id == e.id)
        ).count()
        alt_count = db.query(Alert).filter(Alert.entity_id == e.id).count()

        results.append({
            "id": e.id,
            "entity_type": e.entity_type,
            "display_name": e.display_name,
            "normalized_name": e.normalized_name,
            "confidence": e.confidence,
            "details": e.details,
            "degree_centrality": round(degree.get(e.id, 0.0), 3),
            "betweenness_centrality": round(betweenness.get(e.id, 0.0), 3),
            "cases": cases,
            "connection_count": conn_count,
            "alert_count": alt_count,
            "evidence_count": 0
        })

    return results

@router.get("/cases/{case_id}/entities", response_model=List[EntityResponse])
def list_case_entities(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_investigator)
):
    return list_entities(case_id=case_id, entity_type=None, db=db, current_user=current_user)

@router.get("/entities/{entity_id}/dossier")
def get_dossier(
    entity_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_investigator)
):
    dossier = get_entity_dossier(db, entity_id)
    if "error" in dossier:
        raise HTTPException(status_code=404, detail="Entity not found")
    return dossier
