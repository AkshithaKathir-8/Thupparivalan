import {
  Case, Entity, Alert, CrossCaseLink, EvidenceRecord,
  AuditRecord, AIResponse, ReportItem, DashboardStats, User
} from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('thupparivalan_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('thupparivalan_token');
    localStorage.removeItem('thupparivalan_user');
    window.dispatchEvent(new Event('auth-expired'));
    throw new Error('Authentication expired. Please log in.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Network request failed' }));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  login: async (credentials: { email: string; password: string }) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Authentication failed' }));
      throw new Error(err.detail || 'Login failed');
    }
    return res.json() as Promise<{ access_token: string; user: User }>;
  },

  getMe: () => request<User>('/api/auth/me'),

  // Dashboard Stats
  getDashboardStats: (caseId?: string) =>
    request<DashboardStats>(`/api/dashboard/stats${caseId ? `?case_id=${caseId}` : ''}`),

  // Cases
  getCases: () => request<Case[]>('/api/cases'),
  getCase: (caseId: string) =>
  request<Case>(`/api/cases/${caseId}`),

updateCase: (
  caseId: string,
  payload: {
    title?: string;
    description?: string;
    district?: string;
    priority?: string;
    status?: string;
  }
) =>
  request<Case>(`/api/cases/${caseId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  }),

  createCase: (payload: { title: string; description?: string; district?: string; priority?: string; notes?: string }) =>
    request<Case>('/api/cases', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Evidence & Integrity
  getEvidence: (caseId?: string) =>
    request<EvidenceRecord[]>(`/api/evidence${caseId ? `?case_id=${caseId}` : ''}`),
  
  uploadEvidence: async (caseId: string, file: File, notes?: string): Promise<EvidenceRecord> => {
    const formData = new FormData();
    formData.append('file', file);
    if (notes) formData.append('notes', notes);

    const token = localStorage.getItem('thupparivalan_token');
    const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

    const res = await fetch(`${API_BASE_URL}/api/cases/${caseId}/evidence`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  verifyEvidence: (evidenceId: string) =>
    request<{
      evidence_id: string;
      file_name: string;
      stored_hash: string;
      computed_hash: string;
      verification_status: string;
      tamper_detected: boolean;
      verified_at: string;
      message: string;
    }>(`/api/evidence/${evidenceId}/verify`, { method: 'POST' }),

  simulateTamper: (evidenceId: string) =>
    request<{
      evidence_id: string;
      file_name: string;
      stored_hash: string;
      computed_hash: string;
      verification_status: string;
      tamper_detected: boolean;
      verified_at: string;
      message: string;
    }>(`/api/evidence/${evidenceId}/simulate-tamper`, { method: 'POST' }),

  restoreEvidence: (evidenceId: string) =>
    request<{
      evidence_id: string;
      file_name: string;
      stored_hash: string;
      computed_hash: string;
      verification_status: string;
      tamper_detected: boolean;
      verified_at: string;
      message: string;
    }>(`/api/evidence/${evidenceId}/restore`, { method: 'POST' }),

  // Entities & Dossier
  getEntities: (caseId?: string, entityType?: string) => {
    const params = new URLSearchParams();
    if (caseId) params.append('case_id', caseId);
    if (entityType) params.append('entity_type', entityType);
    const qs = params.toString();
    return request<Entity[]>(`/api/entities${qs ? `?${qs}` : ''}`);
  },

  getEntityDossier: (entityId: string) =>
    request<any>(`/api/entities/${entityId}/dossier`),

  // Graph
  getGraph: (caseId?: string) =>
    request<{
      elements: any[];
      metrics: {
        total_nodes: number;
        total_edges: number;
        connected_components: number;
        average_degree: number;
      };
    }>(`/api/graph${caseId ? `?case_id=${caseId}` : ''}`),

  // Alerts
  getAlerts: (caseId?: string, severity?: string, status?: string) => {
    const params = new URLSearchParams();
    if (caseId) params.append('case_id', caseId);
    if (severity) params.append('severity', severity);
    if (status) params.append('status', status);
    const qs = params.toString();
    return request<Alert[]>(`/api/alerts${qs ? `?${qs}` : ''}`);
  },

  updateAlert: (alertId: string, payload: { status?: string; severity?: string }) =>
    request<Alert>(`/api/alerts/${alertId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),

  refreshAlerts: () => request<{ message: string }>('/api/alerts/refresh', { method: 'POST' }),

  // Cross-Case
  getCrossCaseLinks: () => request<CrossCaseLink[]>('/api/cross-case'),
  triggerCrossCaseScan: () => request<{ message: string; new_links_count: number }>('/api/cross-case/analyze', { method: 'POST' }),

  // AI Investigation RAG
  queryAI: (question: string, caseId?: string) =>
    request<AIResponse>('/api/investigation/query', {
      method: 'POST',
      body: JSON.stringify({ question, case_id: caseId })
    }),

  // Reports
  getReports: (caseId?: string) =>
    request<ReportItem[]>(`/api/reports${caseId ? `?case_id=${caseId}` : ''}`),
  generateReport: (caseId?: string, reportType?: string, scopeNotes?: string) =>
    request<ReportItem>('/api/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ case_id: caseId, report_type: reportType, scope_notes: scopeNotes })
    }),
  getReport: (reportId: string) => request<ReportItem>(`/api/reports/${reportId}`),

  // Audit
  getAuditTrail: () => request<AuditRecord[]>('/api/audit')
};
