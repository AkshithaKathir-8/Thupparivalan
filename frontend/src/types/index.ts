export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  last_login?: string;
}

export interface Case {
  id: string;
  case_code: string;
  title: string;
  description: string;
  district: string;
  status: string;
  priority: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  entity_count?: number;
  relationship_count?: number;
  evidence_count?: number;
  alert_count?: number;
}

export interface Entity {
  id: string;
  entity_type: 'Person' | 'Phone' | 'Vehicle' | 'Location' | 'Organization' | 'Account' | 'Document' | string;
  display_name: string;
  normalized_name: string;
  confidence: number;
  details?: string;
  degree_centrality?: number;
  betweenness_centrality?: number;
  cases?: string[];
  connection_count?: number;
  alert_count?: number;
}

export interface Relationship {
  id: string;
  source_entity_id: string;
  source_name?: string;
  target_entity_id: string;
  target_name?: string;
  relationship_type: string;
  case_id: string;
  case_code?: string;
  evidence_id?: string;
  confidence: number;
}

export interface Alert {
  id: string;
  case_id: string;
  case_code?: string;
  entity_id: string;
  entity_name?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  reason: string;
  supporting_evidence?: string;
  confidence: number;
  status: 'ACTIVE' | 'REVIEW_REQUIRED' | 'INVESTIGATING' | 'RESOLVED';
  created_at: string;
}

export interface CrossCaseLink {
  id: string;
  entity_id: string;
  entity_name: string;
  entity_type: string;
  case_a_id: string;
  case_a_code: string;
  case_a_title: string;
  case_b_id: string;
  case_b_code: string;
  case_b_title: string;
  match_type: string;
  match_reason: string;
  confidence: number;
  created_at: string;
}

export interface EvidenceRecord {
  id: string;
  case_id: string;
  case_code?: string;
  file_name: string;
  storage_path: string;
  mime_type?: string;
  file_size: number;
  sha256_hash: string;
  previous_hash: string;
  uploaded_by: string;
  uploaded_at: string;
  verification_status: 'VERIFIED' | 'MODIFIED' | 'MISSING' | 'ERROR';
  last_verified_at: string;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  actor_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: string;
  result: string;
  previous_hash: string;
  record_hash: string;
}

export interface AIResponse {
  question: string;
  answer: string;
  reasoning_summary: string;
  classification: 'FACT' | 'INFERENCE' | 'INSUFFICIENT EVIDENCE';
  confidence: number;
  supporting_entities: string[];
  supporting_relationships: string[];
  supporting_evidence: string[];
  supporting_cases: string[];
  references: Array<{ type: string; id: string; label: string }>;
}

export interface ReportItem {
  id: string;
  case_id: string;
  case_code?: string;
  title: string;
  report_type: string;
  content: string;
  generated_by: string;
  created_at: string;
}

export interface DashboardStats {
  counts: {
    cases: number;
    persons: number;
    phones: number;
    vehicles: number;
    locations: number;
    transactions: number;
    relationships: number;
    evidence: number;
    alerts: number;
    high_alerts: number;
    cross_case_links: number;
    integrity_verified: number;
    integrity_violations: number;
  };
  summary: string;
  top_influencers: Array<{
    id: string;
    name: string;
    type: string;
    betweenness: number;
    connections: number;
  }>;
  recent_alerts: Alert[];
  recent_audits: AuditRecord[];
}
