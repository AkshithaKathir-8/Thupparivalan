from datetime import datetime
from sqlalchemy import Column, String, Text, Float, Integer, BigInteger, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base

class User(Base):
    __tablename__ = "users"
    id = Column(String(64), primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="INVESTIGATOR")
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

class Case(Base):
    __tablename__ = "cases"
    id = Column(String(64), primary_key=True, index=True)
    case_code = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    district = Column(String(100), nullable=True)
    status = Column(String(50), default="ACTIVE")
    priority = Column(String(50), default="HIGH")
    created_by = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    documents = relationship("CaseDocument", back_populates="case", cascade="all, delete-orphan")
    evidence_records = relationship("EvidenceRecord", back_populates="case", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="case", cascade="all, delete-orphan")
    relationships = relationship("Relationship", back_populates="case", cascade="all, delete-orphan")
    case_entities = relationship("CaseEntity", back_populates="case", cascade="all, delete-orphan")

class CaseDocument(Base):
    __tablename__ = "case_documents"
    id = Column(String(64), primary_key=True, index=True)
    case_id = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    storage_path = Column(String(500), nullable=False)
    mime_type = Column(String(100), nullable=True)
    file_size = Column(BigInteger, default=0)
    processing_status = Column(String(50), default="COMPLETED") # UPLOADING, PROCESSING, EXTRACTING, ANALYZING, COMPLETED, FAILED
    uploaded_by = Column(String(255), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="documents")

class Location(Base):
    __tablename__ = "locations"
    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    district = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

class Entity(Base):
    __tablename__ = "entities"
    id = Column(String(64), primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False, index=True) # Person, Phone, Vehicle, Location, Organization, Account, Document
    display_name = Column(String(255), nullable=False, index=True)
    normalized_name = Column(String(255), nullable=False, index=True)
    confidence = Column(Float, default=0.95)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    aliases = relationship("EntityAlias", back_populates="entity", cascade="all, delete-orphan")
    case_links = relationship("CaseEntity", back_populates="entity", cascade="all, delete-orphan")

class EntityAlias(Base):
    __tablename__ = "entity_aliases"
    id = Column(String(64), primary_key=True, index=True)
    entity_id = Column(String(64), ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    alias = Column(String(255), nullable=False)
    source = Column(String(100), nullable=True)
    confidence = Column(Float, default=0.90)

    entity = relationship("Entity", back_populates="aliases")

class CaseEntity(Base):
    __tablename__ = "case_entities"
    id = Column(String(64), primary_key=True, index=True)
    case_id = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    entity_id = Column(String(64), ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    first_seen_at = Column(DateTime, default=datetime.utcnow)
    last_seen_at = Column(DateTime, default=datetime.utcnow)
    confidence = Column(Float, default=0.95)

    case = relationship("Case", back_populates="case_entities")
    entity = relationship("Entity", back_populates="case_links")

class Relationship(Base):
    __tablename__ = "relationships"
    id = Column(String(64), primary_key=True, index=True)
    source_entity_id = Column(String(64), ForeignKey("entities.id", ondelete="CASCADE"), nullable=False, index=True)
    target_entity_id = Column(String(64), ForeignKey("entities.id", ondelete="CASCADE"), nullable=False, index=True)
    relationship_type = Column(String(100), nullable=False, index=True) # USED, OWNED, CALLED, LOCATED_AT, CONNECTED_TO, TRANSFERRED_TO, MENTIONED_IN, APPEARS_IN, OPERATED
    case_id = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    evidence_id = Column(String(64), nullable=True)
    confidence = Column(Float, default=0.90)
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="relationships")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(String(64), primary_key=True, index=True)
    case_id = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    from_entity_id = Column(String(64), ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    to_entity_id = Column(String(64), ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    method = Column(String(100), nullable=True)
    location_id = Column(String(64), ForeignKey("locations.id"), nullable=True)
    status = Column(String(50), default="VERIFIED") # VERIFIED, FLAGGED, HIGH_RISK, SUSPICIOUS
    timestamp = Column(DateTime, default=datetime.utcnow)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(String(64), primary_key=True, index=True)
    case_id = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    entity_id = Column(String(64), ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    severity = Column(String(50), nullable=False) # CRITICAL, HIGH, MEDIUM, LOW
    title = Column(String(255), nullable=False)
    reason = Column(Text, nullable=False)
    supporting_evidence = Column(Text, nullable=True) # Comma-separated EVD IDs
    confidence = Column(Float, default=0.90)
    status = Column(String(50), default="ACTIVE") # ACTIVE, REVIEW_REQUIRED, RESOLVED
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="alerts")

class CrossCaseLink(Base):
    __tablename__ = "cross_case_links"
    id = Column(String(64), primary_key=True, index=True)
    entity_id = Column(String(64), ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    case_a_id = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    case_b_id = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    match_type = Column(String(100), nullable=False)
    match_reason = Column(Text, nullable=False)
    confidence = Column(Float, default=0.90)
    created_at = Column(DateTime, default=datetime.utcnow)

class EvidenceRecord(Base):
    __tablename__ = "evidence_records"
    id = Column(String(64), primary_key=True, index=True)
    case_id = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    case_code = Column(String(50), nullable=True)
    file_name = Column(String(255), nullable=False)
    storage_path = Column(String(500), nullable=False)
    mime_type = Column(String(100), nullable=True)
    file_size = Column(BigInteger, default=0)
    sha256_hash = Column(String(64), nullable=False)
    previous_hash = Column(String(64), nullable=False)
    uploaded_by = Column(String(255), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    verification_status = Column(String(50), default="VERIFIED") # VERIFIED, MODIFIED, MISSING, ERROR
    last_verified_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="evidence_records")

class AuditLedger(Base):
    __tablename__ = "audit_ledger"
    id = Column(String(64), primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    actor_id = Column(String(255), nullable=False)
    action = Column(String(100), nullable=False)
    target_type = Column(String(50), nullable=False)
    target_id = Column(String(64), nullable=False)
    details = Column(Text, nullable=True)
    result = Column(String(50), default="SUCCESS")
    previous_hash = Column(String(64), nullable=False)
    record_hash = Column(String(64), nullable=False)

class Investigation(Base):
    __tablename__ = "investigations"
    id = Column(String(64), primary_key=True, index=True)
    case_id = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    investigator_id = Column(String(64), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    sources = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Report(Base):
    __tablename__ = "reports"
    id = Column(String(64), primary_key=True, index=True)
    case_id = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    case_code = Column(String(50), nullable=True)
    generated_by = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    report_type = Column(String(50), default="COMPREHENSIVE")
    content = Column(Text, nullable=False)
    file_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    id = Column(String(64), primary_key=True, index=True)
    document_id = Column(String(64), nullable=True)
    case_id = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, default=0)
    content = Column(Text, nullable=False)
    embedding_vector = Column(Text, nullable=True) # Serialized vector floats
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
