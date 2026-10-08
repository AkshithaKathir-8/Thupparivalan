import os
import re
import csv
import io
import uuid
import json
from datetime import datetime
from typing import List, Dict, Any, Tuple
import pandas as pd
from sqlalchemy.orm import Session
from app.models.all_models import (
    Entity, EntityAlias, CaseEntity, Relationship, Transaction, Location, DocumentChunk
)

# Regex Patterns for Investigative Entity Extraction
PHONE_REGEX = re.compile(r'(?:\+?91[-.\s]?)?[6-9]\d{4}[-.\s]?\d{5}')
VEHICLE_REGEX = re.compile(r'\b[A-Z]{2}[- ]?\d{1,2}[- ]?[A-Z]{1,2}[- ]?\d{4}\b', re.IGNORECASE)
AMOUNT_REGEX = re.compile(r'(?:Rs\.?|INR)\s*([\d,]+(?:\.\d{2})?)|\b([\d,]{4,})\s*(?:rupees|INR)?\b', re.IGNORECASE)

# Standard Investigation Keywords
LOCATION_KEYWORDS = [
    'station', 'estate', 'port', 'yard', 'wharf', 'hub', 'warehouse', 'bypass', 'toll',
    'checkpoint', 'junction', 'flyover', 'circle', 'nagar', 'colony', 'street', 'road'
]

def normalize_text(text: str) -> str:
    return re.sub(r'\s+', ' ', text).strip()

def normalize_phone(phone: str) -> str:
    digits = re.sub(r'\D', '', phone)
    if len(digits) == 10:
        return f"+91-{digits[:5]}-{digits[5:]}"
    elif len(digits) == 12 and digits.startswith("91"):
        return f"+91-{digits[2:7]}-{digits[7:]}"
    return phone.strip()

def normalize_vehicle(reg: str) -> str:
    cleaned = re.sub(r'[\s\-]+', '-', reg.upper().strip())
    return cleaned

def extract_text_from_file(file_path: str, mime_type: str = "") -> str:
    """Extracts raw text content from TXT, CSV, JSON, PDF, DOCX."""
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext in ['.txt', '.log']:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
            
    elif ext == '.csv':
        try:
            df = pd.read_csv(file_path)
            return df.to_string()
        except Exception:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()

    elif ext == '.json':
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            data = json.load(f)
            return json.dumps(data, indent=2)

    elif ext == '.pdf':
        try:
            import pypdf
            reader = pypdf.PdfReader(file_path)
            pages_text = [page.extract_text() or "" for page in reader.pages]
            return "\n".join(pages_text)
        except Exception as e:
            return f"[PDF text extraction: {str(e)}]"

    elif ext in ['.docx', '.doc']:
        try:
            import docx
            doc = docx.Document(file_path)
            return "\n".join([p.text for p in doc.paragraphs])
        except Exception as e:
            return f"[DOCX text extraction: {str(e)}]"

    elif ext in ['.xlsx', '.xls']:
        try:
            df = pd.read_excel(file_path)
            return df.to_string()
        except Exception as e:
            return f"[Excel text extraction: {str(e)}]"

    # Fallback
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    except Exception:
        return ""

def identify_csv_column_mapping(df_columns: List[str]) -> Dict[str, str]:
    """
    Intelligently maps arbitrary column names to semantic investigation categories:
    person, phone, vehicle, location, amount, receiver, caller, timestamp.
    """
    mapping = {}
    cols_lower = {c: c.lower().strip().replace('_', ' ').replace('-', ' ') for c in df_columns}

    for original, normalized in cols_lower.items():
        if any(w in normalized for w in ['caller', 'origin entity', 'source']):
            mapping['caller_or_source'] = original
        elif any(w in normalized for w in ['receiver', 'beneficiary', 'target']):
            mapping['receiver_or_target'] = original
        elif any(w in normalized for w in ['suspect', 'person', 'driver', 'name', 'contractor', 'individual', 'agent']):
            mapping.setdefault('person', original)
        elif any(w in normalized for w in ['phone', 'mobile', 'contact', 'msisdn', 'caller number', 'cell']):
            mapping.setdefault('phone', original)
        elif any(w in normalized for w in ['vehicle', 'reg no', 'registration', 'truck', 'car', 'van', 'chassis']):
            mapping.setdefault('vehicle', original)
        elif any(w in normalized for w in ['location', 'tower', 'district', 'city', 'yard', 'estate', 'address', 'place']):
            mapping.setdefault('location', original)
        elif any(w in normalized for w in ['amount', 'inr', 'sum', 'value', 'price', 'transfer']):
            mapping.setdefault('amount', original)
        elif any(w in normalized for w in ['time', 'date', 'timestamp']):
            mapping.setdefault('timestamp', original)

    return mapping

def get_or_create_entity(
    db: Session,
    entity_type: str,
    name: str,
    details: str = "",
    case_id: str = None,
    confidence: float = 0.95
) -> Entity:
    """Finds existing entity by normalized name or creates a new one, linking to case."""
    normalized = normalize_text(name.lower())
    entity = db.query(Entity).filter(
        Entity.entity_type == entity_type,
        Entity.normalized_name == normalized
    ).first()

    if not entity:
        entity = Entity(
            id=f"ENT-{str(uuid.uuid4())[:8]}",
            entity_type=entity_type,
            display_name=name.strip(),
            normalized_name=normalized,
            confidence=confidence,
            details=details
        )
        db.add(entity)
        db.flush()

    if case_id:
        case_link = db.query(CaseEntity).filter(
            CaseEntity.case_id == case_id,
            CaseEntity.entity_id == entity.id
        ).first()
        if not case_link:
            case_link = CaseEntity(
                id=f"CE-{str(uuid.uuid4())[:8]}",
                case_id=case_id,
                entity_id=entity.id,
                confidence=confidence
            )
            db.add(case_link)
            db.flush()

    return entity

def add_relationship_if_not_exists(
    db: Session,
    source_id: str,
    target_id: str,
    rel_type: str,
    case_id: str,
    evidence_id: str = None,
    confidence: float = 0.90
):
    """Creates a directed relationship between two entities if not already present."""
    if source_id == target_id:
        return
    existing = db.query(Relationship).filter(
        Relationship.source_entity_id == source_id,
        Relationship.target_entity_id == target_id,
        Relationship.relationship_type == rel_type,
        Relationship.case_id == case_id
    ).first()
    if not existing:
        rel = Relationship(
            id=f"REL-{str(uuid.uuid4())[:8]}",
            source_entity_id=source_id,
            target_entity_id=target_id,
            relationship_type=rel_type,
            case_id=case_id,
            evidence_id=evidence_id,
            confidence=confidence
        )
        db.add(rel)
        db.flush()

def process_evidence_file(
    db: Session,
    file_path: str,
    case_id: str,
    evidence_id: str,
    file_name: str
) -> Dict[str, Any]:
    """
    Ingests and dynamically processes ANY investigation evidence file.
    Extracts text, chunks it, extracts entities and relationships, updates knowledge graph.
    """
    raw_text = extract_text_from_file(file_path)
    ext = os.path.splitext(file_name)[1].lower()

    entities_created = 0
    relationships_created = 0

    # 1. Document Chunking for Grounded RAG
    chunk_size = 500
    words = raw_text.split()
    chunks = []
    for i in range(0, len(words), 350):
        chunk_content = " ".join(words[i:i + chunk_size])
        if chunk_content.strip():
            chunks.append(chunk_content)

    for idx, c in enumerate(chunks):
        doc_chunk = DocumentChunk(
            id=f"CHK-{str(uuid.uuid4())[:8]}",
            document_id=evidence_id,
            case_id=case_id,
            chunk_index=idx,
            content=c,
            metadata_json=json.dumps({"file_name": file_name, "chunk_index": idx})
        )
        db.add(doc_chunk)
    db.flush()

    # 2. Structured Extraction for CSV / Tabular datasets
    if ext == '.csv':
        try:
            df = pd.read_csv(file_path)
            col_map = identify_csv_column_mapping(df.columns.tolist())
            
            for _, row in df.iterrows():
                # Check for calls / CDR pattern
                caller = row.get(col_map.get('caller_or_source', ''))
                receiver = row.get(col_map.get('receiver_or_target', ''))
                phone_col = row.get(col_map.get('phone', ''))
                amt_col = row.get(col_map.get('amount', ''))
                veh_col = row.get(col_map.get('vehicle', ''))
                loc_col = row.get(col_map.get('location', ''))

                caller_ent = None
                receiver_ent = None

                if pd.notna(caller) and str(caller).strip():
                    name = str(caller).strip()
                    # Clean PER tags if any
                    clean_name = re.sub(r'\(PER-\d+\)', '', name).strip()
                    caller_ent = get_or_create_entity(db, "Person", clean_name, case_id=case_id)
                    entities_created += 1

                if pd.notna(receiver) and str(receiver).strip():
                    name = str(receiver).strip()
                    clean_name = re.sub(r'\(PER-\d+\)', '', name).strip()
                    receiver_ent = get_or_create_entity(db, "Person", clean_name, case_id=case_id)
                    entities_created += 1

                # If caller & receiver exist
                if caller_ent and receiver_ent:
                    rel_type = "CALLED" if "cdr" in file_name.lower() or "call" in file_name.lower() else "TRANSFERRED_TO"
                    add_relationship_if_not_exists(db, caller_ent.id, receiver_ent.id, rel_type, case_id, evidence_id)
                    relationships_created += 1

                # If vehicle column exists
                if pd.notna(veh_col) and str(veh_col).strip():
                    veh_str = str(veh_col).strip()
                    veh_ent = get_or_create_entity(db, "Vehicle", normalize_vehicle(veh_str), case_id=case_id)
                    entities_created += 1
                    if caller_ent:
                        add_relationship_if_not_exists(db, caller_ent.id, veh_ent.id, "OPERATED", case_id, evidence_id)
                        relationships_created += 1

                # If location column exists
                if pd.notna(loc_col) and str(loc_col).strip():
                    loc_str = str(loc_col).strip()
                    loc_ent = get_or_create_entity(db, "Location", loc_str, case_id=case_id)
                    entities_created += 1
                    if caller_ent:
                        add_relationship_if_not_exists(db, caller_ent.id, loc_ent.id, "LOCATED_AT", case_id, evidence_id)
                        relationships_created += 1

        except Exception as e:
            print(f"Error parsing tabular file {file_name}: {e}")

    # 3. Dynamic NLP & Regex Parsing on raw text
    # Extract phone numbers
    phones = set(PHONE_REGEX.findall(raw_text))
    phone_entities = []
    for p in phones:
        norm_p = normalize_phone(p)
        p_ent = get_or_create_entity(db, "Phone", norm_p, case_id=case_id)
        phone_entities.append(p_ent)
        entities_created += 1

    # Extract vehicles
    vehicles = set(VEHICLE_REGEX.findall(raw_text))
    vehicle_entities = []
    for v in vehicles:
        norm_v = normalize_vehicle(v)
        v_ent = get_or_create_entity(db, "Vehicle", norm_v, case_id=case_id)
        vehicle_entities.append(v_ent)
        entities_created += 1

    # Heuristic Person Name extraction from text
    # Matches patterns like "Manager Ravi Kumar", "contractor Arun Prakash", "Name (PER-XXX)"
    person_matches = re.findall(r'(?:investigate|interview|suspect|manager|contractor|supervisor|coordinator|agent|consultant|mechanic)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+|\s+[A-Z]))', raw_text, re.IGNORECASE)
    # Also extract any explicit "Name (PER-XXX)" patterns
    explicit_persons = re.findall(r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+|\s+[A-Z]))\s*\((?:PER-\d+)\)', raw_text)
    all_person_names = set(person_matches + explicit_persons)

    person_entities = []
    for p_name in all_person_names:
        p_clean = p_name.strip()
        if len(p_clean) > 3 and not any(kw in p_clean.lower() for kw in ['state', 'police', 'department', 'court', 'section']):
            p_ent = get_or_create_entity(db, "Person", p_clean, case_id=case_id)
            person_entities.append(p_ent)
            entities_created += 1

    # Link co-occurring persons with phones and vehicles found in the same document
    for p_ent in person_entities:
        for ph_ent in phone_entities:
            add_relationship_if_not_exists(db, p_ent.id, ph_ent.id, "USED", case_id, evidence_id)
            relationships_created += 1
        for v_ent in vehicle_entities:
            add_relationship_if_not_exists(db, p_ent.id, v_ent.id, "OWNED", case_id, evidence_id)
            relationships_created += 1

    db.commit()

    return {
        "status": "COMPLETED",
        "raw_text_length": len(raw_text),
        "chunks_indexed": len(chunks),
        "entities_extracted": entities_created,
        "relationships_extracted": relationships_created
    }
