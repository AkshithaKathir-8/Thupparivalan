from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

# User & Auth
class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    last_login: Optional[datetime] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Cases
class CaseCreate(BaseModel):
    case_code: Optional[str] = None
    title: str
    description: Optional[str] = None
    district: Optional[str] = "Chennai South"
    priority: Optional[str] = "HIGH"
    status: Optional[str] = "ACTIVE"
    notes: Optional[str] = None

class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    district: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None

class CaseResponse(BaseModel):
    id: str
    case_code: str
    title: str
    description: Optional[str] = None
    district: Optional[str] = None
    status: str
    priority: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    entity_count: Optional[int] = 0
    relationship_count: Optional[int] = 0
    evidence_count: Optional[int] = 0
    alert_count: Optional[int] = 0

# Entities
class EntityResponse(BaseModel):
    id: str
    entity_type: str
    display_name: str
    normalized_name: str
    confidence: float
    details: Optional[str] = None
    degree_centrality: Optional[float] = 0.0
    betweenness_centrality: Optional[float] = 0.0
    cases: Optional[List[str]] = []
    connection_count: Optional[int] = 0
    alert_count: Optional[int] = 0
    evidence_count: Optional[int] = 0

# Relationships
class RelationshipResponse(BaseModel):
    id: str
    source_entity_id: str
    source_name: Optional[str] = None
    target_entity_id: str
    target_name: Optional[str] = None
    relationship_type: str
    case_id: str
    case_code: Optional[str] = None
    evidence_id: Optional[str] = None
    confidence: float

# Alerts
class AlertResponse(BaseModel):
    id: str
    case_id: str
    case_code: Optional[str] = None
    entity_id: str
    entity_name: Optional[str] = None
    severity: str
    title: str
    reason: str
    supporting_evidence: Optional[str] = None
    confidence: float
    status: str
    created_at: datetime

class AlertUpdate(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None

# Cross-Case
class CrossCaseLinkResponse(BaseModel):
    id: str
    entity_id: str
    entity_name: Optional[str] = None
    entity_type: Optional[str] = "Person"
    case_a_id: str
    case_a_code: Optional[str] = None
    case_b_id: str
    case_b_code: Optional[str] = None
    match_type: str
    match_reason: str
    confidence: float
    created_at: datetime

# Evidence & Integrity
class EvidenceRecordResponse(BaseModel):
    id: str
    case_id: str
    case_code: Optional[str] = None
    file_name: str
    storage_path: str
    mime_type: Optional[str] = None
    file_size: int
    sha256_hash: str
    previous_hash: str
    uploaded_by: str
    uploaded_at: datetime
    verification_status: str
    last_verified_at: datetime

class EvidenceVerifyResponse(BaseModel):
    evidence_id: str
    file_name: str
    stored_hash: str
    computed_hash: str
    verification_status: str
    tamper_detected: bool
    verified_at: datetime
    message: str

# Audit
class AuditLedgerResponse(BaseModel):
    id: str
    timestamp: datetime
    actor_id: str
    action: str
    target_type: str
    target_id: str
    details: Optional[str] = None
    result: str
    previous_hash: str
    record_hash: str

# AI / RAG Investigation
class AIQueryRequest(BaseModel):
    question: str
    case_id: Optional[str] = None
    investigation_id: Optional[str] = None

class AIQueryResponse(BaseModel):
    question: str
    answer: str
    reasoning_summary: str
    classification: str # FACT, INFERENCE, INSUFFICIENT EVIDENCE
    confidence: float
    supporting_entities: List[str]
    supporting_relationships: List[str]
    supporting_evidence: List[str]
    supporting_cases: List[str]
    references: List[Dict[str, str]]

# Reports
class ReportGenerateRequest(BaseModel):
    case_id: Optional[str] = None
    report_type: Optional[str] = "COMPREHENSIVE" # COMPREHENSIVE, FINANCIAL, CROSS_CASE, INTEGRITY
    scope_notes: Optional[str] = None

class ReportResponse(BaseModel):
    id: str
    case_id: str
    case_code: Optional[str] = None
    title: str
    report_type: str
    content: str
    generated_by: str
    created_at: datetime
