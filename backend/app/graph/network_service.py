from typing import Dict, List, Any, Optional
import networkx as nx
from sqlalchemy.orm import Session
from app.models.all_models import Entity, Relationship, Case, CaseEntity, Alert, EvidenceRecord

# Palette constants for Cytoscape nodes
NODE_COLORS = {
    "Person": "#0091B9",        # Primary Teal
    "Phone": "#004E9B",         # Deep Blue
    "Vehicle": "#FF6500",       # Orange (Investigative focus/movement)
    "Location": "#FFD500",      # Yellow (Caution/Spatial)
    "Case": "#0091B9",          # Teal
    "Transaction": "#004E9B",   # Deep Blue
    "Organization": "#BAE4F0",  # Light Cyan
    "Evidence": "#0091B9",      # Teal
    "Default": "#64748B"
}

def build_networkx_graph(db: Session, case_id: Optional[str] = None) -> nx.Graph:
    """Constructs a NetworkX graph from database entities and relationships."""
    G = nx.Graph()

    query = db.query(Relationship)
    if case_id:
        query = query.filter(Relationship.case_id == case_id)
    relationships = query.all()

    # Collect entity IDs
    entity_ids = set()
    for rel in relationships:
        entity_ids.add(rel.source_entity_id)
        entity_ids.add(rel.target_entity_id)

    # Fetch entity records
    entities = db.query(Entity).filter(Entity.id.in_(entity_ids)).all() if entity_ids else []
    entity_map = {e.id: e for e in entities}

    # Add nodes
    for e in entities:
        G.add_node(
            e.id,
            label=e.display_name,
            entity_type=e.entity_type,
            color=NODE_COLORS.get(e.entity_type, NODE_COLORS["Default"])
        )

    # Add edges
    for rel in relationships:
        if G.has_node(rel.source_entity_id) and G.has_node(rel.target_entity_id):
            G.add_edge(
                rel.source_entity_id,
                rel.target_entity_id,
                id=rel.id,
                label=rel.relationship_type,
                weight=rel.confidence or 1.0,
                case_id=rel.case_id
            )

    return G

def get_graph_data_for_cytoscape(db: Session, case_id: Optional[str] = None) -> Dict[str, Any]:
    """Calculates NetworkX metrics and formats graph elements for Cytoscape.js."""
    G = build_networkx_graph(db, case_id)

    if len(G) == 0:
        return {
            "elements": [],
            "metrics": {
                "total_nodes": 0,
                "total_edges": 0,
                "connected_components": 0
            }
        }

    # Calculate real NetworkX Centrality Metrics
    degree_centrality = nx.degree_centrality(G)
    betweenness_centrality = nx.betweenness_centrality(G)
    closeness_centrality = nx.closeness_centrality(G)
    num_components = nx.number_connected_components(G)

    elements = []

    # Format nodes
    for node_id, data in G.nodes(data=True):
        deg = G.degree(node_id)
        bet = round(betweenness_centrality.get(node_id, 0.0), 3)
        clo = round(closeness_centrality.get(node_id, 0.0), 3)

        elements.append({
            "group": "nodes",
            "data": {
                "id": node_id,
                "label": data.get("label", node_id),
                "type": data.get("entity_type", "Entity"),
                "color": data.get("color", "#0091B9"),
                "degree": deg,
                "betweenness": bet,
                "closeness": clo,
                "size": max(28, min(65, 28 + deg * 5))
            }
        })

    # Format edges
    for u, v, data in G.edges(data=True):
        elements.append({
            "group": "edges",
            "data": {
                "id": data.get("id", f"{u}-{v}"),
                "source": u,
                "target": v,
                "label": data.get("label", "CONNECTED_TO"),
                "case_id": data.get("case_id", "")
            }
        })

    return {
        "elements": elements,
        "metrics": {
            "total_nodes": len(G.nodes()),
            "total_edges": len(G.edges()),
            "connected_components": num_components,
            "average_degree": round(sum(dict(G.degree()).values()) / max(len(G), 1), 2)
        }
    }

def get_entity_dossier(db: Session, entity_id: str) -> Dict[str, Any]:
    """Returns deep investigative dossier for an entity including NetworkX metrics and case occurrences."""
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if not entity:
        return {"error": "Entity not found"}

    # Build global graph to calculate true centrality
    G = build_networkx_graph(db)

    deg = G.degree(entity_id) if G.has_node(entity_id) else 0
    betweenness = round(nx.betweenness_centrality(G).get(entity_id, 0.0), 4) if G.has_node(entity_id) else 0.0
    closeness = round(nx.closeness_centrality(G).get(entity_id, 0.0), 4) if G.has_node(entity_id) else 0.0

    # Fetch associated cases
    case_links = db.query(CaseEntity).filter(CaseEntity.entity_id == entity_id).all()
    case_ids = [cl.case_id for cl in case_links]
    cases = db.query(Case).filter(Case.id.in_(case_ids)).all() if case_ids else []

    # Fetch direct relationships
    rels = db.query(Relationship).filter(
        (Relationship.source_entity_id == entity_id) | (Relationship.target_entity_id == entity_id)
    ).all()

    # Fetch alerts for this entity
    alerts = db.query(Alert).filter(Alert.entity_id == entity_id).all()

    # Fetch neighbors
    connected_entities = []
    if G.has_node(entity_id):
        neighbor_ids = list(G.neighbors(entity_id))
        neighbors = db.query(Entity).filter(Entity.id.in_(neighbor_ids)).all()
        connected_entities = [{"id": n.id, "name": n.display_name, "type": n.entity_type} for n in neighbors]

    return {
        "id": entity.id,
        "name": entity.display_name,
        "entity_type": entity.entity_type,
        "confidence": entity.confidence,
        "details": entity.details,
        "metrics": {
            "degree": deg,
            "betweenness": betweenness,
            "closeness": closeness,
            "total_connections": len(rels)
        },
        "cases": [{"id": c.id, "case_code": c.case_code, "title": c.title} for c in cases],
        "alerts": [{"id": a.id, "title": a.title, "severity": a.severity, "reason": a.reason} for a in alerts],
        "connected_entities": connected_entities,
        "relationships": [
            {
                "id": r.id,
                "type": r.relationship_type,
                "source_id": r.source_entity_id,
                "target_id": r.target_entity_id,
                "case_id": r.case_id,
                "confidence": r.confidence
            }
            for r in rels
        ]
    }
