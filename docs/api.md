# Thupparivalan API Reference

All requests must include the JWT authentication header (except `/api/auth/login` and `/api/health`):
```http
Authorization: Bearer <access_token>
```

---

## 1. Authentication
### `POST /api/auth/login`
Authenticates the investigating officer and issues a scoped JWT access token.
* **Request Body:**
  ```json
  {
    "email": "investigator@chaintrace.local",
    "password": "Thupparivalan@2026"
  }
  ```
* **Response:**
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": "usr-inv-001",
      "email": "investigator@chaintrace.local",
      "full_name": "K. Vijayakanth IPS (Superintendent)",
      "role": "INVESTIGATOR"
    }
  }
  ```

### `GET /api/auth/me`
Retrieves current session details and verification status.

---

## 2. Case Management
### `GET /api/cases`
Returns all registered investigation case dockets with dynamic entity, evidence, and alert counts.

### `POST /api/cases`
Registers a new investigation docket in the database.
* **Request Body:**
  ```json
  {
    "title": "Port Container Contraband Interception",
    "description": "Unmanifested high-value electronic consignments...",
    "district": "Thoothukudi",
    "priority": "HIGH"
  }
  ```

### `GET /api/cases/{case_id}`
Retrieves single case docket details.

---

## 3. Evidence & Tamper-Evident Ledger
### `GET /api/evidence`
Query evidence records with optional `?case_id=` filter.

### `POST /api/cases/{case_id}/evidence`
Multipart upload for depositing evidence (PDF, CSV, TXT, DOCX, XLSX, JSON). Computes SHA-256, binds to previous hash, chunks document, extracts entities, and triggers rules scan.

### `POST /api/evidence/{evidence_id}/verify`
Recomputes binary SHA-256 of the physical file on disk and compares with the immutable ledger hash.
* **Response:**
  ```json
  {
    "evidence_id": "EVD-001",
    "file_name": "FIR_CASE001.txt",
    "stored_hash": "5f8f0463efac...",
    "computed_hash": "5f8f0463efac...",
    "verification_status": "VERIFIED",
    "tamper_detected": false,
    "message": "✓ INTEGRITY VERIFIED: Cryptographic hash matches immutable ledger record."
  }
  ```

### `POST /api/evidence/{evidence_id}/simulate-tamper`
Appends an unauthorized modification to disk storage to demonstrate live tamper alert generation.

### `POST /api/evidence/{evidence_id}/restore`
Restores the file on disk to its original clean state and re-verifies integrity.

---

## 4. Network Graph & Centrality
### `GET /api/graph`
Returns elements for Cytoscape.js visualization and NetworkX centrality metrics.
* **Parameters:** `?case_id=` (optional)
* **Response:**
  ```json
  {
    "elements": [
      {
        "group": "nodes",
        "data": { "id": "PER-001", "label": "Ravi Kumar", "type": "Person", "degree": 11, "betweenness": 0.695, "color": "#0091B9" }
      }
    ],
    "metrics": {
      "total_nodes": 16,
      "total_edges": 16,
      "average_degree": 2.0
    }
  }
  ```

### `GET /api/entities/{entity_id}/dossier`
Returns deep topological dossier with connected cases, immediate neighbors, and alerts.

---

## 5. Intelligence Alerts
### `GET /api/alerts`
Retrieves intelligence alerts with optional filters `?severity=HIGH&status=ACTIVE`.

### `PATCH /api/alerts/{alert_id}`
Updates alert operational status (`ACTIVE`, `INVESTIGATING`, `RESOLVED`).

### `POST /api/alerts/refresh`
Triggers deterministic rules engine evaluation across all database records.

---

## 6. Cross-Case Intelligence
### `GET /api/cross-case`
Returns cross-case correlation matrix linking distinct case dockets.

### `POST /api/cross-case/analyze`
Executes heuristic correlation scan across all registered cases.

---

## 7. AI Investigation Workspace (RAG)
### `POST /api/investigation/query`
Executes grounded natural language investigation query bounded by verified case records.
* **Request Body:**
  ```json
  {
    "question": "Why was Ravi Kumar flagged?",
    "case_id": "c1111111-1111-4111-8111-111111111101"
  }
  ```
* **Response:**
  ```json
  {
    "question": "Why was Ravi Kumar flagged?",
    "answer": "Ravi Kumar (Person) was flagged due to [HIGH] High Network Centrality...",
    "reasoning_summary": "Derived from validated Intelligence Alert records...",
    "classification": "FACT",
    "confidence": 0.96,
    "supporting_entities": ["Ravi Kumar"],
    "supporting_evidence": ["EVD-001", "EVD-002", "EVD-006", "EVD-007"],
    "references": [
      { "type": "EVIDENCE", "id": "EVD-001", "label": "Evidence EVD-001" }
    ]
  }
  ```

---

## 8. Intelligence Reports
### `POST /api/reports/generate`
Compiles a structured 12-section investigation dossier.
* **Request Body:**
  ```json
  {
    "case_id": "case-uuid",
    "report_type": "COMPREHENSIVE",
    "scope_notes": "Statutory filing summary"
  }
  ```

### `GET /api/reports`
Lists all compiled intelligence dossiers.

---

## 9. Custodial Audit Ledger
### `GET /api/audit`
Returns append-only audit trail with previous hash links and SHA-256 record hashes.
