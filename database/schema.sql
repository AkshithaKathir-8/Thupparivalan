-- Thupparivalan / ChainTrace Database Schema
-- Production-style normalized intelligence investigation schema

-- Enable UUID extension and pgvector if PostgreSQL
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS vector;

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'INVESTIGATOR',
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- 2. CASES
CREATE TABLE IF NOT EXISTS cases (
    id VARCHAR(64) PRIMARY KEY,
    case_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    district VARCHAR(100),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    priority VARCHAR(50) DEFAULT 'HIGH',
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. CASE DOCUMENTS
CREATE TABLE IF NOT EXISTS case_documents (
    id VARCHAR(64) PRIMARY KEY,
    case_id VARCHAR(64) REFERENCES cases(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100),
    file_size BIGINT,
    processing_status VARCHAR(50) DEFAULT 'COMPLETED',
    uploaded_by VARCHAR(255),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. LOCATIONS
CREATE TABLE IF NOT EXISTS locations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    district VARCHAR(100),
    state VARCHAR(100),
    latitude FLOAT,
    longitude FLOAT
);

-- 5. ENTITIES
CREATE TABLE IF NOT EXISTS entities (
    id VARCHAR(64) PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- Person, Phone, Vehicle, Location, Organization, Account, Document
    display_name VARCHAR(255) NOT NULL,
    normalized_name VARCHAR(255) NOT NULL,
    confidence FLOAT DEFAULT 0.95,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. ENTITY ALIASES
CREATE TABLE IF NOT EXISTS entity_aliases (
    id VARCHAR(64) PRIMARY KEY,
    entity_id VARCHAR(64) REFERENCES entities(id) ON DELETE CASCADE,
    alias VARCHAR(255) NOT NULL,
    source VARCHAR(100),
    confidence FLOAT DEFAULT 0.90
);

-- 7. CASE ENTITIES
CREATE TABLE IF NOT EXISTS case_entities (
    id VARCHAR(64) PRIMARY KEY,
    case_id VARCHAR(64) REFERENCES cases(id) ON DELETE CASCADE,
    entity_id VARCHAR(64) REFERENCES entities(id) ON DELETE CASCADE,
    first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confidence FLOAT DEFAULT 0.95
);

-- 8. RELATIONSHIPS
CREATE TABLE IF NOT EXISTS relationships (
    id VARCHAR(64) PRIMARY KEY,
    source_entity_id VARCHAR(64) REFERENCES entities(id) ON DELETE CASCADE,
    target_entity_id VARCHAR(64) REFERENCES entities(id) ON DELETE CASCADE,
    relationship_type VARCHAR(100) NOT NULL, -- USED, OWNED, CALLED, LOCATED_AT, CONNECTED_TO, TRANSFERRED_TO, MENTIONED_IN, APPEARS_IN, OPERATED
    case_id VARCHAR(64) REFERENCES cases(id) ON DELETE CASCADE,
    evidence_id VARCHAR(64),
    confidence FLOAT DEFAULT 0.90,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(64) PRIMARY KEY,
    case_id VARCHAR(64) REFERENCES cases(id) ON DELETE CASCADE,
    from_entity_id VARCHAR(64) REFERENCES entities(id) ON DELETE CASCADE,
    to_entity_id VARCHAR(64) REFERENCES entities(id) ON DELETE CASCADE,
    amount FLOAT NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    method VARCHAR(100),
    location_id VARCHAR(64) REFERENCES locations(id),
    status VARCHAR(50) DEFAULT 'VERIFIED',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. ALERTS
CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(64) PRIMARY KEY,
    case_id VARCHAR(64) REFERENCES cases(id) ON DELETE CASCADE,
    entity_id VARCHAR(64) REFERENCES entities(id) ON DELETE CASCADE,
    severity VARCHAR(50) NOT NULL, -- CRITICAL, HIGH, MEDIUM, LOW
    title VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    supporting_evidence TEXT,
    confidence FLOAT DEFAULT 0.90,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, INVESTIGATING, RESOLVED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. INVESTIGATIONS (RAG history)
CREATE TABLE IF NOT EXISTS investigations (
    id VARCHAR(64) PRIMARY KEY,
    case_id VARCHAR(64) REFERENCES cases(id) ON DELETE CASCADE,
    investigator_id VARCHAR(64) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sources TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. CROSS-CASE LINKS
CREATE TABLE IF NOT EXISTS cross_case_links (
    id VARCHAR(64) PRIMARY KEY,
    entity_id VARCHAR(64) REFERENCES entities(id) ON DELETE CASCADE,
    case_a_id VARCHAR(64) REFERENCES cases(id) ON DELETE CASCADE,
    case_b_id VARCHAR(64) REFERENCES cases(id) ON DELETE CASCADE,
    match_type VARCHAR(100) NOT NULL,
    match_reason TEXT NOT NULL,
    confidence FLOAT DEFAULT 0.90,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. EVIDENCE RECORDS (Tamper-evident ledger)
CREATE TABLE IF NOT EXISTS evidence_records (
    id VARCHAR(64) PRIMARY KEY,
    case_id VARCHAR(64) REFERENCES cases(id) ON DELETE CASCADE,
    case_code VARCHAR(50),
    file_name VARCHAR(255) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100),
    file_size BIGINT,
    sha256_hash VARCHAR(64) NOT NULL,
    previous_hash VARCHAR(64) NOT NULL,
    uploaded_by VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verification_status VARCHAR(50) DEFAULT 'VERIFIED',
    last_verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. AUDIT LEDGER (Append-only)
CREATE TABLE IF NOT EXISTS audit_ledger (
    id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actor_id VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id VARCHAR(64) NOT NULL,
    details TEXT,
    result VARCHAR(50) DEFAULT 'SUCCESS',
    previous_hash VARCHAR(64) NOT NULL,
    record_hash VARCHAR(64) NOT NULL
);

-- 15. REPORTS
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(64) PRIMARY KEY,
    case_id VARCHAR(64) REFERENCES cases(id) ON DELETE CASCADE,
    case_code VARCHAR(50),
    generated_by VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) DEFAULT 'COMPREHENSIVE',
    content TEXT NOT NULL,
    file_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. DOCUMENT CHUNKS (For RAG)
CREATE TABLE IF NOT EXISTS document_chunks (
    id VARCHAR(64) PRIMARY KEY,
    document_id VARCHAR(64),
    case_id VARCHAR(64) REFERENCES cases(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    embedding_vector TEXT,
    metadata_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cases_code ON cases(case_code);
CREATE INDEX IF NOT EXISTS idx_entities_name ON entities(display_name);
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_relationships_case ON relationships(case_id);
CREATE INDEX IF NOT EXISTS idx_relationships_source ON relationships(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON relationships(target_entity_id);
CREATE INDEX IF NOT EXISTS idx_alerts_case ON alerts(case_id);
CREATE INDEX IF NOT EXISTS idx_cross_case_entity ON cross_case_links(entity_id);
CREATE INDEX IF NOT EXISTS idx_evidence_case ON evidence_records(case_id);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_ledger(target_id);
