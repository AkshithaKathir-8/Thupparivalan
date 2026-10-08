# Thupparivalan Architecture & System Design

## 1. Executive Overview
**Thupparivalan** is an investigator-facing criminal intelligence platform that connects raw case files, telecommunications records, transaction manifests, and vehicle logs into a unified, evidence-grounded knowledge graph.

It provides an analytical intelligence layer connecting:
```
Case Docket ➔ Evidence Intake ➔ Entity Extraction (NLP/Regex) ➔ Entity Resolution
  ➔ Relationship Extraction ➔ NetworkX Topological Graph ➔ Cross-Case Correlator
  ➔ Intelligence Rules Engine ➔ Grounded AI / RAG ➔ Tamper-Evident Evidence Ledger
  ➔ Intelligence Dossier Reports
```

---

## 2. High-Level System Architecture

```
                             ┌─────────────────────────────────┐
                             │    INVESTIGATING OFFICER        │
                             │  React + TypeScript + Tailwind  │
                             └────────────────┬────────────────┘
                                              │ JWT / HTTPS
                                              ▼
                             ┌─────────────────────────────────┐
                             │       FASTAPI BACKEND API       │
                             │  Uvicorn • Pydantic • SQLAlchemy│
                             └────────┬───────────────┬────────┘
                                      │               │
                 ┌────────────────────┴──────┐        │
                 ▼                           ▼        ▼
       ┌──────────────────┐        ┌──────────────────┐
       │ PostgreSQL /     │        │ Cryptographic    │
       │ Supabase DB      │        │ Evidence Storage │
       │ (16 Normalized   │        │ (SHA-256 Chained │
       │  Tables)         │        │  Local / Bucket) │
       └─────────┬────────┘        └─────────┬────────┘
                 │                           │
                 ├───────────────────────────┤
                 ▼                           ▼
       ┌──────────────────────────────────────────────┐
       │        EVIDENCE PROCESSING PIPELINE          │
       │  • Multi-Format Parser (PDF, CSV, TXT, DOCX) │
       │  • Schema-Agnostic Column Normalizer         │
       │  • Heuristic NLP & Regex Entity Extractor    │
       │  • Deduplication & Entity Resolution         │
       └──────────────────────┬───────────────────────┘
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
       ┌──────────────────┐      ┌──────────────────┐
       │ NetworkX Graph   │      │ Cross-Case       │
       │ Topology Engine  │      │ Correlation      │
       │ (Degree/Between) │      │ Matrix           │
       └─────────┬────────┘      └─────────┬────────┘
                 │                         │
                 └────────────┬────────────┘
                              ▼
       ┌──────────────────────────────────────────────┐
       │        GROUNDED INVESTIGATION RAG ENGINE     │
       │  • Zero-Hallucination Guardrails             │
       │  • Document Chunks + Relational Context      │
       │  • FACT / INFERENCE / INSUFFICIENT EVIDENCE  │
       │  • Strict Evidence Citations ([EVD-xxx])     │
       └──────────────────────┬───────────────────────┘
                              ▼
       ┌──────────────────────────────────────────────┐
       │        INTELLIGENCE DOSSIER REPORTS          │
       │  12-Section Formal Court & Police Document   │
       └──────────────────────────────────────────────┘
```

---

## 3. Data Ingestion & Schema-Agnostic Understanding
The platform does not rely on hardcoded column schemas. When tabular files (CSV/XLSX) are deposited, the schema understanding engine normalizes columns dynamically:
* **Persons:** `suspect`, `person`, `name`, `driver`, `contractor`, `individual`, `agent`
* **Phones:** `phone`, `mobile`, `contact`, `msisdn`, `caller number`, `cell`
* **Vehicles:** `vehicle`, `reg no`, `registration`, `truck`, `car`, `van`, `chassis`
* **Locations:** `location`, `tower`, `district`, `city`, `yard`, `estate`, `address`
* **Financials:** `amount`, `inr`, `sum`, `value`, `price`, `transfer`

---

## 4. Cryptographic Tamper-Evident Evidence Ledger
To prevent evidence repudiation and demonstrate unauthorized manipulation:
1. Every file receives an immutable **SHA-256** hash upon deposit.
2. The hash is cryptographically linked to the **previous block hash** forming a tamper-evident chain:
   $$\text{Block}_n = \mathcal{H}(\text{Data}_n \parallel \mathcal{H}_{n-1})$$
3. Verification recalculates the binary hash of the physical file on disk and compares it with the immutable ledger record.
4. Any byte deviation triggers an **INTEGRITY VIOLATION** security alert.

---

## 5. Topological Network Analytics
Using **NetworkX**, the system computes mathematical graph metrics directly from relational records:
* **Degree Centrality:** Direct operational contacts.
* **Betweenness Centrality:** Communication bridges and logistics bottlenecks through Brandes' algorithm:
  $$C_B(v) = \sum_{s \neq v \neq t} \frac{\sigma_{st}(v)}{\sigma_{st}}$$
* Nodes with $C_B(v) > 0.15$ are automatically flagged as key network coordinators.

---

## 6. Grounded RAG & Zero-Hallucination Safeguards
The AI Investigation engine synthesizes answers exclusively from corroborating database records, document chunks, and graph topology:
* Every response is classified into:
  * **FACT:** Grounded in primary documents or corroborated ledger records.
  * **INFERENCE:** Derived through topological co-occurrence.
  * **INSUFFICIENT EVIDENCE:** Returned whenever available evidence is inadequate.
