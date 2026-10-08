# Thupparivalan Local Setup & Execution Guide

## 1. Prerequisites
* **Operating System:** Windows 10/11
* **Python:** 3.10+ (tested on Python 3.13)
* **Node.js:** v18+ (tested on Node v22)
* **Package Manager:** `npm` (included with Node)

---

## 2. Fast Start (Automated Scripts)
From the project root `thupparivalan`:

1. **Start Backend Server:**
   Double-click `start_backend.bat` or run:
   ```cmd
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   * Backend will be available at: `http://localhost:8000`
   * Interactive OpenAPI docs: `http://localhost:8000/docs`

2. **Start Frontend Development Server:**
   Double-click `start_frontend.bat` or run:
   ```cmd
   cd frontend
   npm run dev
   ```
   * Frontend will be accessible at: `http://localhost:5173`

---

## 3. Database Configuration
The application is pre-configured with a dual-database layer:
* **Zero-Setup Out-of-the-Box Mode (Default):**
  Uses the local embedded SQLite database `thupparivalan.db`. It auto-creates and auto-seeds all cases, entities, evidence, and audit logs on first run. No separate database server installation is required.
* **Production PostgreSQL / Supabase Mode:**
  To connect to a live Supabase or PostgreSQL instance, edit `backend/.env`:
  ```ini
  DATABASE_URL=postgresql+psycopg://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
  SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
  SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
  ```
  Run the schema migration:
  ```cmd
  psql -U postgres -d postgres -f database/schema.sql
  ```

---

## 4. Demo Authentication Credentials
* **Investigator Email:** `investigator@chaintrace.local`
* **Access Password:** `Thupparivalan@2026`
*(A convenient "Load Demonstration Account" button is available directly on the login screen).*

---

## 5. Live Demonstration Flow
To demonstrate the full end-to-end investigative capabilities:

1. **Authentication:** Log in as Investigator.
2. **Command Center:** Observe live statistics (Persons: 10, Phones: 5, Vehicles: 4, Evidence: 8, Alerts: 4). Click **CASE-001** to inspect the equipment heist docket.
3. **Intelligence Alerts:** Inspect the high-priority alert for **Ravi Kumar** showing multi-case recurrence and high betweenness centrality. Click **Investigate**.
4. **AI Investigation Workspace:**
   * Run the prompt: *"Why was Ravi Kumar flagged?"* ➔ Observe grounded evidence explanation with Fact badge and [EVD-001] [EVD-006] citations.
   * Run the prompt: *"Are there potential common entities between CASE-005 and CASE-008?"* ➔ Observe cross-case identification of Mohan R.
5. **Topological Network Graph:**
   * Explore the interactive Cytoscape canvas with color-coded nodes.
   * Click **Ravi Kumar** ➔ Observe the sliding Entity Dossier with degree=11, betweenness=0.695, and connected phone/vehicle assets.
6. **Cross-Case Intelligence:**
   * Review the correlation between **CASE-001** and **CASE-006** (Ravi Kumar with matching phone `+91-98401-22441` and vehicle `TN-09-BE-4491` at 96% confidence).
7. **Evidence & Cryptographic Integrity Ledger:**
   * Locate **EVD-001** (`FIR_CASE001.txt`).
   * Click **Verify Hash** ➔ Confirms `✓ INTEGRITY VERIFIED`.
   * Click **Simulate Tamper** ➔ Immediately triggers `🚨 INTEGRITY VIOLATION` with cryptographic hash mismatch and custodial alert.
   * Click **Verify Hash** again after automatic cleanup to return to clean custody.
8. **Intelligence Reports:**
   * Select **CASE-001** and click **Generate Official Report**.
   * Review the 12-section formal police dossier.
   * Click **Print / Save as PDF** to generate an official document.

---

## 6. Running the Automated Test Suite
To execute the automated regression and verification suite:
```cmd
python tests\test_full_system.py
```
This tests all 10 AI inquiries, case creation, graph centrality calculation, cross-case analysis, and tamper-evident verification.
