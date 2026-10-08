# Thupparivalan — Criminal Investigation Intelligence Platform

![Thupparivalan Badge](https://img.shields.io/badge/Platform-Thupparivalan-0091B9?style=for-the-badge)
![Security Badge](https://img.shields.io/badge/Ledger-Tamper--Evident%20SHA--256-004E9B?style=for-the-badge)
![Status Badge](https://img.shields.io/badge/Status-Production--Ready-0091B9?style=for-the-badge)

**Thupparivalan** is an investigator-facing criminal intelligence platform that connects raw case files, telecommunications CDRs, financial transaction ledgers, and logistics surveillance into an interconnected intelligence knowledge graph.

It functions as an advanced intelligence layer connecting:
```
Case Docket ➔ Evidence Intake ➔ Entity Extraction (NLP/Regex) ➔ Entity Resolution
  ➔ Relationship Extraction ➔ NetworkX Topological Graph ➔ Cross-Case Correlator
  ➔ Intelligence Rules Engine ➔ Grounded AI / RAG ➔ Tamper-Evident Evidence Ledger
  ➔ Intelligence Dossier Reports
```

---

## Visual Design Specification
* **Background:** Clean White Canvas (`#FFFFFF`) with subtle neutral borders and shadows.
* **Palette:**
  * **Primary Teal (`#0091B9`):** Primary actions, active navigation, links, key indicators.
  * **Light Cyan (`#BAE4F0`):** Soft selections, hover states, contextual analytical backgrounds.
  * **Deep Blue (`#004E9B`):** Brand headings, secondary buttons, strong analytical accents.
  * **Orange (`#FF6500`):** High/Critical alerts, security warnings, integrity violations only.
  * **Yellow (`#FFD500`):** Caution, pending reviews, non-critical alerts.
* **Typography:** Modern clean sans-serif (`Inter`).

---

## The 7 Core Modules
1. **Command Center:** Operational hub showing real-time tallies, active case selector, new case registration, AI executive summary, and recent custody activity.
2. **Intelligence Alerts:** Evidence-backed investigative leads with severity levels, reason breakdowns, and direct action triggers.
3. **AI Investigation Workspace:** Bounded, zero-hallucination RAG assistant categorizing outputs into `FACT`, `INFERENCE`, or `INSUFFICIENT EVIDENCE` with exact primary evidence citations.
4. **Network Graph:** Cytoscape.js interactive visualization with NetworkX centrality calculations (Degree, Betweenness, Closeness) and slide-out Entity Dossiers.
5. **Cross-Case Intelligence:** Multi-jurisdictional correlator detecting common entities, shared phones, and shared vehicles across distinct case dockets.
6. **Evidence & Integrity:** Tamper-Evident Evidence Ledger utilizing SHA-256 hash chaining, live cryptographic re-verification, and simulated tampering detection.
7. **Intelligence Reports:** Formal 12-section law enforcement dossier generator with PDF export and print styling.

---

## Quick Start on Windows

### 1. Start Backend API
```cmd
start_backend.bat
```
*(Runs FastAPI on `http://localhost:8000` with docs at `http://localhost:8000/docs`)*

### 2. Start Frontend UI
```cmd
start_frontend.bat
```
*(Runs Vite React application on `http://localhost:5173`)*

### 3. Log In
* **Email:** `investigator@chaintrace.local`
* **Password:** `Thupparivalan@2026`
*(Or click the "Load Demonstration Account" button)*

---

## Automated Verification Suite
Run the full regression test suite covering all 10 grounded AI test inquiries, case operations, graph calculations, and tamper alerts:
```cmd
python tests\test_full_system.py
```

---

## Documentation Links
* [Architecture & System Design](docs/architecture.md)
* [API Endpoint Reference](docs/api.md)
* [Local Setup & Demonstration Flow](docs/setup.md)
