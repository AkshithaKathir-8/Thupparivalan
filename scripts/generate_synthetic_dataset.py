import os
import csv
import hashlib
from datetime import datetime

DATA_DIR = r"C:\Users\91984\.gemini\antigravity\scratch\thupparivalan\data\synthetic"
STORAGE_DIR = r"C:\Users\91984\.gemini\antigravity\scratch\thupparivalan\storage\evidence"
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(STORAGE_DIR, exist_ok=True)

# 1. CASES
cases = [
    {
        "id": "c1111111-1111-4111-8111-111111111101",
        "case_code": "CASE-001",
        "title": "Industrial Equipment Heist & Smuggling",
        "description": "Theft of specialized machinery from Guindy Industrial Estate and illicit transport via coordinated logistics.",
        "district": "Chennai South",
        "status": "ACTIVE",
        "priority": "HIGH",
        "created_by": "investigator@chaintrace.local",
        "created_at": "2026-09-12 10:30:00",
        "updated_at": "2026-09-12 10:30:00"
    },
    {
        "id": "c2222222-2222-4222-8222-222222222202",
        "case_code": "CASE-002",
        "title": "Hawala Remittance & Shell Accounts Syndicate",
        "description": "Suspicious structured shell bank accounts funneling large volumes through Coimbatore commercial outlets.",
        "district": "Coimbatore City",
        "status": "ACTIVE",
        "priority": "HIGH",
        "created_by": "investigator@chaintrace.local",
        "created_at": "2026-09-15 14:15:00",
        "updated_at": "2026-09-15 14:15:00"
    },
    {
        "id": "c3333333-3333-4333-8333-333333333303",
        "case_code": "CASE-003",
        "title": "Port Container Contraband Interception",
        "description": "Intelligence report on unmanifested high-value electronic consignments at V.O. Chidambaranar Port.",
        "district": "Thoothukudi",
        "status": "PENDING_REVIEW",
        "priority": "MEDIUM",
        "created_by": "investigator@chaintrace.local",
        "created_at": "2026-09-18 09:00:00",
        "updated_at": "2026-09-18 09:00:00"
    },
    {
        "id": "c4444444-4444-4444-8444-444444444404",
        "case_code": "CASE-005",
        "title": "Counterfeit Invoice & GST Diversion Ring",
        "description": "Bogus manufacturing entities issuing fake bills and routing payments across multiple non-existent firms.",
        "district": "Madurai Central",
        "status": "ACTIVE",
        "priority": "MEDIUM",
        "created_by": "investigator@chaintrace.local",
        "created_at": "2026-09-22 11:45:00",
        "updated_at": "2026-09-22 11:45:00"
    },
    {
        "id": "c5555555-5555-4555-8555-555555555505",
        "case_code": "CASE-006",
        "title": "Highway Cargo Hijacking & Fenced Logistics",
        "description": "Armed truck intercept on NH-48 corridor between Kanchipuram and Sriperumbudur carrying copper cathode coils.",
        "district": "Kanchipuram",
        "status": "ACTIVE",
        "priority": "CRITICAL",
        "created_by": "investigator@chaintrace.local",
        "created_at": "2026-09-25 03:20:00",
        "updated_at": "2026-09-25 03:20:00"
    },
    {
        "id": "c6666666-6666-4666-8666-666666666606",
        "case_code": "CASE-007",
        "title": "Interstate Vehicle Theft & Chassis Tampering",
        "description": "Coordinated auto theft ring using false registration plates and repainting garages near Salem hub.",
        "district": "Salem North",
        "status": "ACTIVE",
        "priority": "MEDIUM",
        "created_by": "investigator@chaintrace.local",
        "created_at": "2026-09-28 16:10:00",
        "updated_at": "2026-09-28 16:10:00"
    },
    {
        "id": "c7777777-7777-4777-8777-777777777707",
        "case_code": "CASE-008",
        "title": "Procurement Kickback & Shadow Banking Operation",
        "description": "Shadow financial transfers tied to unauthorized municipal equipment clearing and contractor payoffs.",
        "district": "Tiruchirappalli",
        "status": "PENDING_REVIEW",
        "priority": "HIGH",
        "created_by": "investigator@chaintrace.local",
        "created_at": "2026-10-01 08:45:00",
        "updated_at": "2026-10-01 08:45:00"
    }
]

# 2. PERSONS (Entities)
persons = [
    {"id": "e001-per", "code": "PER-001", "name": "Ravi Kumar", "role_desc": "Logistics Coordinator & Warehouse Manager", "confidence": 0.96},
    {"id": "e002-per", "code": "PER-002", "name": "Arun Prakash", "role_desc": "Transport Contractor", "confidence": 0.91},
    {"id": "e003-per", "code": "PER-003", "name": "Dinesh Babu", "role_desc": "Security Supervisor Guindy", "confidence": 0.88},
    {"id": "e004-per", "code": "PER-004", "name": "Suresh Raina", "role_desc": "Driver Associate", "confidence": 0.84},
    {"id": "e010-per", "code": "PER-010", "name": "Manoj K", "role_desc": "Commercial Broker & Account Holder", "confidence": 0.94},
    {"id": "e011-per", "code": "PER-011", "name": "Karthik Raja", "role_desc": "Trade Representative", "confidence": 0.87},
    {"id": "e012-per", "code": "PER-012", "name": "Gopalakrishnan V", "role_desc": "Salem Garage Mechanic", "confidence": 0.89},
    {"id": "e018-per", "code": "PER-018", "name": "Mohan R", "role_desc": "GST Billing Consultant", "confidence": 0.93},
    {"id": "e019-per", "code": "PER-019", "name": "Selvam Murugan", "role_desc": "Warehouse Handler Trichy", "confidence": 0.85},
    {"id": "e020-per", "code": "PER-020", "name": "Vigneshwaran S", "role_desc": "Port Clearance Agent", "confidence": 0.86}
]

# 3. PHONES
phones = [
    {"id": "e101-ph", "code": "PH-001", "number": "+91-98401-22441", "provider": "Airtel", "entity_type": "Phone", "name": "+91-98401-22441"},
    {"id": "e102-ph", "code": "PH-002", "number": "+91-98402-99882", "provider": "Jio", "entity_type": "Phone", "name": "+91-98402-99882"},
    {"id": "e103-ph", "code": "PH-003", "number": "+91-94431-77110", "provider": "BSNL", "entity_type": "Phone", "name": "+91-94431-77110"},
    {"id": "e104-ph", "code": "PH-010", "number": "+91-94422-55010", "provider": "Vodafone", "entity_type": "Phone", "name": "+91-94422-55010"},
    {"id": "e105-ph", "code": "PH-018", "number": "+91-98940-11018", "provider": "Airtel", "entity_type": "Phone", "name": "+91-98940-11018"}
]

# 4. VEHICLES
vehicles = [
    {"id": "e201-veh", "code": "VEH-001", "reg_no": "TN-09-BE-4491", "make": "Tata 407 Cargo Van", "entity_type": "Vehicle", "name": "TN-09-BE-4491 (Tata 407)"},
    {"id": "e202-veh", "code": "VEH-002", "reg_no": "TN-22-CZ-1109", "make": "Mahindra Bolero Pickup", "entity_type": "Vehicle", "name": "TN-22-CZ-1109 (Bolero)"},
    {"id": "e203-veh", "code": "VEH-003", "reg_no": "TN-38-DA-9921", "make": "Ashok Leyland Ecomet", "entity_type": "Vehicle", "name": "TN-38-DA-9921 (Leyland)"},
    {"id": "e204-veh", "code": "VEH-010", "reg_no": "TN-54-E-8810", "make": "Maruti Omni Van", "entity_type": "Vehicle", "name": "TN-54-E-8810 (Omni)"}
]

# 5. LOCATIONS
locations = [
    {"id": "e301-loc", "name": "Guindy Industrial Estate", "district": "Chennai", "state": "Tamil Nadu", "lat": 13.0067, "lng": 80.2025},
    {"id": "e302-loc", "name": "Sriperumbudur Hub", "district": "Kanchipuram", "state": "Tamil Nadu", "lat": 12.9699, "lng": 79.9404},
    {"id": "e303-loc", "name": "Gandhipuram Market", "district": "Coimbatore", "state": "Tamil Nadu", "lat": 11.0168, "lng": 76.9658},
    {"id": "e304-loc", "name": "V.O.C Port Warehouse 4", "district": "Thoothukudi", "state": "Tamil Nadu", "lat": 8.7642, "lng": 78.1348},
    {"id": "e305-loc", "name": "Shevapet Commercial Yard", "district": "Salem", "state": "Tamil Nadu", "lat": 11.6643, "lng": 78.1460},
    {"id": "e306-loc", "name": "Thillai Nagar Commercial Unit", "district": "Tiruchirappalli", "state": "Tamil Nadu", "lat": 10.8286, "lng": 78.6868}
]

# 6. TRANSACTIONS
transactions = [
    {"id": "tx-001", "case_code": "CASE-001", "from_entity": "PER-001", "to_entity": "PER-002", "amount": 250000.0, "method": "NEFT Transfer", "status": "FLAGGED", "timestamp": "2026-09-12 18:20:00"},
    {"id": "tx-002", "case_code": "CASE-002", "from_entity": "PER-010", "to_entity": "PER-011", "amount": 840000.0, "method": "RTGS Hawala Mirror", "status": "HIGH_RISK", "timestamp": "2026-09-14 11:15:00"},
    {"id": "tx-003", "case_code": "CASE-002", "from_entity": "PER-010", "to_entity": "PER-001", "amount": 420000.0, "method": "Immediate Cash Deposit", "status": "SUSPICIOUS", "timestamp": "2026-09-15 15:45:00"},
    {"id": "tx-004", "case_code": "CASE-005", "from_entity": "PER-018", "to_entity": "PER-019", "amount": 615000.0, "method": "Fake GST Invoice Payout", "status": "FLAGGED", "timestamp": "2026-09-22 13:00:00"},
    {"id": "tx-005", "case_code": "CASE-006", "from_entity": "PER-001", "to_entity": "PER-004", "amount": 180000.0, "method": "UPI Staged Payout", "status": "FLAGGED", "timestamp": "2026-09-25 08:30:00"},
    {"id": "tx-006", "case_code": "CASE-008", "from_entity": "PER-018", "to_entity": "PER-010", "amount": 530000.0, "method": "Subcontract Routing", "status": "HIGH_RISK", "timestamp": "2026-10-01 10:10:00"}
]

# 7. RELATIONSHIPS
relationships = [
    # CASE-001
    {"source": "PER-001", "target": "PH-001", "rel": "USED", "case_code": "CASE-001", "conf": 0.98},
    {"source": "PER-001", "target": "VEH-001", "rel": "OWNED", "case_code": "CASE-001", "conf": 0.95},
    {"source": "PER-001", "target": "PER-002", "rel": "CONNECTED_TO", "case_code": "CASE-001", "conf": 0.92},
    {"source": "PER-002", "target": "PH-002", "rel": "USED", "case_code": "CASE-001", "conf": 0.94},
    {"source": "PER-001", "target": "LOC-001", "rel": "LOCATED_AT", "case_code": "CASE-001", "conf": 0.89},
    {"source": "PER-002", "target": "VEH-002", "rel": "OPERATED", "case_code": "CASE-001", "conf": 0.90},
    {"source": "PER-003", "target": "PER-001", "rel": "CALLED", "case_code": "CASE-001", "conf": 0.91},
    {"source": "PER-001", "target": "PER-002", "rel": "TRANSFERRED_TO", "case_code": "CASE-001", "conf": 0.96},

    # CASE-006 (Direct cross-over with CASE-001 via Ravi Kumar, PH-001, VEH-001)
    {"source": "PER-001", "target": "PH-001", "rel": "USED", "case_code": "CASE-006", "conf": 0.99},
    {"source": "PER-001", "target": "VEH-001", "rel": "OWNED", "case_code": "CASE-006", "conf": 0.97},
    {"source": "PER-001", "target": "PER-004", "rel": "CONNECTED_TO", "case_code": "CASE-006", "conf": 0.93},
    {"source": "PER-001", "target": "LOC-002", "rel": "LOCATED_AT", "case_code": "CASE-006", "conf": 0.91},
    {"source": "PER-001", "target": "PER-010", "rel": "CALLED", "case_code": "CASE-006", "conf": 0.88},
    {"source": "PER-004", "target": "VEH-001", "rel": "OPERATED", "case_code": "CASE-006", "conf": 0.92},

    # CASE-002 & CASE-007 (Manoj K across CASE-002, CASE-006, CASE-007)
    {"source": "PER-010", "target": "PH-010", "rel": "USED", "case_code": "CASE-002", "conf": 0.98},
    {"source": "PER-010", "target": "PER-011", "rel": "TRANSFERRED_TO", "case_code": "CASE-002", "conf": 0.95},
    {"source": "PER-010", "target": "LOC-003", "rel": "LOCATED_AT", "case_code": "CASE-002", "conf": 0.90},
    {"source": "PER-010", "target": "PER-012", "rel": "CONNECTED_TO", "case_code": "CASE-007", "conf": 0.92},
    {"source": "PER-012", "target": "VEH-010", "rel": "OWNED", "case_code": "CASE-007", "conf": 0.94},
    {"source": "PER-010", "target": "LOC-005", "rel": "LOCATED_AT", "case_code": "CASE-007", "conf": 0.87},

    # CASE-005 & CASE-008 (Mohan R across CASE-005 and CASE-008)
    {"source": "PER-018", "target": "PH-018", "rel": "USED", "case_code": "CASE-005", "conf": 0.97},
    {"source": "PER-018", "target": "PER-019", "rel": "TRANSFERRED_TO", "case_code": "CASE-005", "conf": 0.93},
    {"source": "PER-018", "target": "LOC-006", "rel": "LOCATED_AT", "case_code": "CASE-008", "conf": 0.89},
    {"source": "PER-018", "target": "PER-010", "rel": "CONNECTED_TO", "case_code": "CASE-008", "conf": 0.91}
]

# 8. CROSS-CASE LINKS
cross_case_links = [
    {
        "id": "ccl-001",
        "entity_code": "PER-001",
        "entity_name": "Ravi Kumar",
        "case_a": "CASE-001",
        "case_b": "CASE-006",
        "match_type": "EXACT_IDENTIFIER_MATCH",
        "match_reason": "Same Person (Ravi Kumar), identical phone (+91-98401-22441), matching transport vehicle (TN-09-BE-4491)",
        "confidence": 0.96,
        "created_at": "2026-09-25 04:00:00"
    },
    {
        "id": "ccl-002",
        "entity_code": "PER-010",
        "entity_name": "Manoj K",
        "case_a": "CASE-002",
        "case_b": "CASE-006",
        "match_type": "COMMUNICATION_LINK",
        "match_reason": "Direct telecommunication log and shared intermediary contact linking hawala ring to highway cargo syndicate",
        "confidence": 0.91,
        "created_at": "2026-09-26 12:15:00"
    },
    {
        "id": "ccl-003",
        "entity_code": "PER-010",
        "entity_name": "Manoj K",
        "case_a": "CASE-002",
        "case_b": "CASE-007",
        "match_type": "CO-OCCURRENCE_FINANCIAL",
        "match_reason": "Linked through garage workshop accounts in Salem and recurring phone contact with vehicle broker",
        "confidence": 0.89,
        "created_at": "2026-09-29 14:00:00"
    },
    {
        "id": "ccl-004",
        "entity_code": "PER-018",
        "entity_name": "Mohan R",
        "case_a": "CASE-005",
        "case_b": "CASE-008",
        "match_type": "TRANSACTION_AND_IDENTITY",
        "match_reason": "Same GST consultant identity and direct bank wire between shadow subcontract accounts in Madurai and Trichy",
        "confidence": 0.93,
        "created_at": "2026-10-01 11:30:00"
    }
]

# 9. EVIDENCE FILES & METADATA
evidence_files = [
    {
        "id": "EVD-001",
        "filename": "FIR_CASE001.txt",
        "case_code": "CASE-001",
        "mime_type": "text/plain",
        "uploader": "investigator@chaintrace.local",
        "timestamp": "2026-09-12 11:00:00",
        "content": """STATE POLICE DEPARTMENT - CRIME INVESTIGATION WING
FIRST INFORMATION REPORT (FIR COPY - SYNTHETIC RECORD FOR DEMO PURPOSES)
FIR No: CR-2026-0912-001
Police Station: Guindy Industrial Security Division
Date & Time of Registration: 12-Sep-2026 10:45 AM
Complainant: Works Manager, Precision Heavy Equipments Pvt Ltd, Guindy Estate

BRIEF SUMMARY OF COMPLAINT:
Between 02:00 hrs and 04:30 hrs on 12-Sep-2026, unauthorized entry occurred at Warehouse Bay 4.
Two industrial hydraulic servo pumps and three precision copper gear assemblies valued at Rs. 24,50,000/- were removed.
Security supervisor Dinesh Babu (PER-003) noted suspicious movements of a commercial mini-truck bearing registration TN-09-BE-4491.
Preliminary inquiry revealed warehouse coordinator Ravi Kumar (PER-001), mobile +91-98401-22441, deactivated internal CCTV cameras 4 and 7 at 02:15 hrs.
Vehicle logs indicate the cargo was transported under false delivery slip signed by transport contractor Arun Prakash (PER-002), phone +91-98402-99882.
Investigative teams are directed to trace the vehicle TN-09-BE-4491 and interview Ravi Kumar regarding the disposition of seized materials.
"""
    },
    {
        "id": "EVD-002",
        "filename": "CDR_CASE001.csv",
        "case_code": "CASE-001",
        "mime_type": "text/csv",
        "uploader": "investigator@chaintrace.local",
        "timestamp": "2026-09-12 14:30:00",
        "content": """call_id,caller_number,receiver_number,caller_entity,receiver_entity,call_time,duration_seconds,tower_location
CDR-0101,+91-98401-22441,+91-98402-99882,Ravi Kumar (PER-001),Arun Prakash (PER-002),2026-09-12 01:45:10,210,Guindy Industrial BTS-3
CDR-0102,+91-98401-22441,+91-98402-99882,Ravi Kumar (PER-001),Arun Prakash (PER-002),2026-09-12 04:12:05,185,Kathipara Flyover BTS-1
CDR-0103,+91-94431-77110,+91-98401-22441,Dinesh Babu (PER-003),Ravi Kumar (PER-001),2026-09-12 04:35:20,95,Guindy Industrial BTS-3
CDR-0104,+91-98401-22441,+91-94422-55010,Ravi Kumar (PER-001),Manoj K (PER-010),2026-09-12 05:10:44,340,Alandur South BTS-2
"""
    },
    {
        "id": "EVD-003",
        "filename": "TRANSACTIONS_CASE002.csv",
        "case_code": "CASE-002",
        "mime_type": "text/csv",
        "uploader": "investigator@chaintrace.local",
        "timestamp": "2026-09-15 16:00:00",
        "content": """txn_id,origin_account,beneficiary_account,origin_entity,beneficiary_entity,amount_inr,channel,timestamp,status
TXN-201,AC-778841001,AC-990021443,Manoj K (PER-010),Karthik Raja (PER-011),840000.00,RTGS Commercial,2026-09-14 11:15:00,HIGH_RISK
TXN-202,AC-778841001,AC-112233445,Manoj K (PER-010),Ravi Kumar (PER-001),420000.00,Immediate Transfer,2026-09-15 15:45:00,SUSPICIOUS
TXN-203,AC-990021443,AC-445566778,Karthik Raja (PER-011),Trade Apex Ltd,350000.00,NEFT Settlement,2026-09-16 09:20:00,VERIFIED
"""
    },
    {
        "id": "EVD-004",
        "filename": "INTELLIGENCE_NOTE_CASE003.txt",
        "case_code": "CASE-003",
        "mime_type": "text/plain",
        "uploader": "investigator@chaintrace.local",
        "timestamp": "2026-09-18 10:15:00",
        "content": """SPECIAL INTELLIGENCE MEMORANDUM - STRICTLY CONFIDENTIAL
Report ID: INT-TN-2026-003
Subject: V.O. Chidambaranar Port Unmanifested Freight Consignment

Source briefing indicates that a logistics intermediary designated as Trade Apex Ltd received multiple container manifests via clearance agent Vigneshwaran S (PER-020).
Cross-verification with financial trails reveals secondary payments routed through Coimbatore commercial brokers linked with Manoj K (PER-010).
Field units are alerted to inspect container CFS yard 4 and cross-check shipping airway bills with electronic manifest ledgers.
"""
    },
    {
        "id": "EVD-005",
        "filename": "TRANSACTIONS_CASE005.csv",
        "case_code": "CASE-005",
        "mime_type": "text/csv",
        "uploader": "investigator@chaintrace.local",
        "timestamp": "2026-09-22 14:00:00",
        "content": """txn_id,origin_entity,beneficiary_entity,invoice_ref,amount_inr,bank_channel,timestamp,audit_flag
TXN-501,Mohan R (PER-018),Selvam Murugan (PER-019),INV-MAD-881,615000.00,IMPS Fast,2026-09-22 13:00:00,SHELL_COMPANY_INVOICE
TXN-502,Mohan R (PER-018),Alpha Metal Supplies,INV-MAD-889,280000.00,NEFT,2026-09-22 14:30:00,CIRCULAR_TRANSACTION
"""
    },
    {
        "id": "EVD-006",
        "filename": "CDR_CASE006.csv",
        "case_code": "CASE-006",
        "mime_type": "text/csv",
        "uploader": "investigator@chaintrace.local",
        "timestamp": "2026-09-25 09:00:00",
        "content": """call_id,caller_number,receiver_number,caller_entity,receiver_entity,call_time,duration_seconds,tower_location
CDR-0601,+91-98401-22441,+91-98402-99882,Ravi Kumar (PER-001),Suresh Raina (PER-004),2026-09-25 02:40:12,310,Sriperumbudur Toll BTS-4
CDR-0602,+91-98401-22441,+91-94422-55010,Ravi Kumar (PER-001),Manoj K (PER-010),2026-09-25 04:15:22,190,Kanchipuram East BTS-2
CDR-0603,+91-98401-22441,+91-98402-99882,Ravi Kumar (PER-001),Arun Prakash (PER-002),2026-09-25 06:10:05,145,Tambaram By-Pass BTS-1
"""
    },
    {
        "id": "EVD-007",
        "filename": "VEHICLE_LOG_CASE007.csv",
        "case_code": "CASE-007",
        "mime_type": "text/csv",
        "uploader": "investigator@chaintrace.local",
        "timestamp": "2026-09-28 17:30:00",
        "content": """entry_id,registration_no,vehicle_type,driver_operator,garage_location,timestamp,surveillance_note
VLOG-701,TN-54-E-8810,Maruti Omni,Gopalakrishnan V (PER-012),Salem Shevapet Yard,2026-09-28 14:10:00,Chassis plate undergoing buffing
VLOG-702,TN-09-BE-4491,Tata 407 Cargo,Unidentified Associate,Salem Outer Checkpost,2026-09-28 15:45:00,Vehicle matches CASE-001 and CASE-006 transport description
"""
    },
    {
        "id": "EVD-008",
        "filename": "INTELLIGENCE_NOTE_CASE008.txt",
        "case_code": "CASE-008",
        "mime_type": "text/plain",
        "uploader": "investigator@chaintrace.local",
        "timestamp": "2026-10-01 10:00:00",
        "content": """CONFIDENTIAL FIELD REPORT - SPECIAL SURVEILLANCE UNIT TRICHY
Note Ref: INT-TR-2026-008
Date: 01-Oct-2026
Subject: Suspicious Subcontract Clearance & Financial Interlocking

Inquiry into municipal equipment distribution revealed Mohan R (PER-018), billing consultant based in Madurai, authorized subcontract disbursements exceeding Rs. 53,00,000/-.
Wire transfer records trace Rs. 5,30,000/- directly deposited into commercial intermediary account held by Manoj K (PER-010).
This transaction establishes cross-jurisdictional linkage between CASE-005 (GST fake billing) and CASE-008 (Trichy procurement routing).
Investigator recommendations:
1. Issue formal query on beneficiary accounts.
2. Synchronize digital network analysis between Madurai and Trichy field cells.
"""
    }
]

# Write synthetic files to disk and calculate SHA-256
evidence_records = []
previous_hash = "GENESIS-000000000000000000000000000000000000000000000000000000000000"

for evd in evidence_files:
    file_path = os.path.join(STORAGE_DIR, evd["filename"])
    content_bytes = evd["content"].encode("utf-8")
    with open(file_path, "wb") as f:
        f.write(content_bytes)
    
    # Calculate SHA256
    sha256 = hashlib.sha256(content_bytes).hexdigest()
    evd_rec = {
        "evidence_id": evd["id"],
        "case_code": evd["case_code"],
        "file_name": evd["filename"],
        "storage_path": f"case/{evd['case_code']}/{evd['id']}/{evd['filename']}",
        "mime_type": evd["mime_type"],
        "file_size": len(content_bytes),
        "sha256_hash": sha256,
        "previous_hash": previous_hash,
        "uploaded_by": evd["uploader"],
        "uploaded_at": evd["timestamp"],
        "verification_status": "VERIFIED",
        "last_verified_at": evd["timestamp"]
    }
    evidence_records.append(evd_rec)
    previous_hash = sha256

# 10. ALERTS
alerts = [
    {
        "id": "ALT-001",
        "case_code": "CASE-001",
        "entity_code": "PER-001",
        "entity_name": "Ravi Kumar",
        "severity": "HIGH",
        "title": "High Network Centrality & Multi-Case Recurrence",
        "reason": "Appears across 3 distinct cases (CASE-001, CASE-006, CASE-007 log), connected with 17 network edges, high betweenness centrality (0.37), shared phone (+91-98401-22441) and vehicle (TN-09-BE-4491)",
        "supporting_evidence": "EVD-001,EVD-002,EVD-006,EVD-007",
        "confidence": 0.96,
        "status": "ACTIVE",
        "created_at": "2026-09-25 09:30:00"
    },
    {
        "id": "ALT-002",
        "case_code": "CASE-002",
        "entity_code": "PER-010",
        "entity_name": "Manoj K",
        "severity": "HIGH",
        "title": "Cross-Syndicate Intermediary & Hawala Flow",
        "reason": "Entity links Hawala syndicate (CASE-002), Highway robbery calls (CASE-006), and vehicle alteration yard (CASE-007). Received Rs. 4,20,000 from Ravi Kumar and transferred Rs. 8,40,000.",
        "supporting_evidence": "EVD-002,EVD-003,EVD-006,EVD-008",
        "confidence": 0.94,
        "status": "ACTIVE",
        "created_at": "2026-09-26 14:00:00"
    },
    {
        "id": "ALT-003",
        "case_code": "CASE-005",
        "entity_code": "PER-018",
        "entity_name": "Mohan R",
        "severity": "MEDIUM",
        "title": "Dual-Case GST Diversion & Financial Bridge",
        "reason": "Entity appears across CASE-005 and CASE-008 with structured subcontract routing and Rs. 5,30,000 direct payout to intermediary Manoj K",
        "supporting_evidence": "EVD-005,EVD-008",
        "confidence": 0.93,
        "status": "ACTIVE",
        "created_at": "2026-10-01 11:45:00"
    },
    {
        "id": "ALT-004",
        "case_code": "CASE-001",
        "entity_code": "PER-002",
        "entity_name": "Arun Prakash",
        "severity": "MEDIUM",
        "title": "Immediate Pre-Heist Telecommunication Cluster",
        "reason": "Exchanged 210-second and 185-second calls with Ravi Kumar immediately prior to equipment departure from Guindy estate",
        "supporting_evidence": "EVD-001,EVD-002",
        "confidence": 0.89,
        "status": "REVIEW_REQUIRED",
        "created_at": "2026-09-12 15:00:00"
    }
]

# 11. AUDIT LEDGER
audit_entries = [
    {"action": "LOGIN_SUCCESS", "actor": "investigator@chaintrace.local", "target_type": "SESSION", "target_id": "auth-01", "details": "Investigator authenticated via JWT", "result": "SUCCESS", "timestamp": "2026-09-12 10:00:00"},
    {"action": "CASE_CREATED", "actor": "investigator@chaintrace.local", "target_type": "CASE", "target_id": "CASE-001", "details": "Created Industrial Equipment Heist case", "result": "SUCCESS", "timestamp": "2026-09-12 10:30:00"},
    {"action": "EVIDENCE_UPLOADED", "actor": "investigator@chaintrace.local", "target_type": "EVIDENCE", "target_id": "EVD-001", "details": "Uploaded FIR_CASE001.txt; SHA-256 recorded", "result": "SUCCESS", "timestamp": "2026-09-12 11:00:00"},
    {"action": "GRAPH_ANALYSIS", "actor": "investigator@chaintrace.local", "target_type": "CASE", "target_id": "CASE-001", "details": "NetworkX centrality recalculated for CASE-001", "result": "SUCCESS", "timestamp": "2026-09-12 11:15:00"},
    {"action": "EVIDENCE_UPLOADED", "actor": "investigator@chaintrace.local", "target_type": "EVIDENCE", "target_id": "EVD-006", "details": "Uploaded CDR_CASE006.csv for CASE-006", "result": "SUCCESS", "timestamp": "2026-09-25 09:00:00"},
    {"action": "CROSS_CASE_ANALYSIS", "actor": "system", "target_type": "CROSS_CASE", "target_id": "CASE-001:CASE-006", "details": "Discovered common entity PER-001 across CASE-001 and CASE-006 (confidence: 96%)", "result": "SUCCESS", "timestamp": "2026-09-25 09:15:00"},
    {"action": "EVIDENCE_VERIFIED", "actor": "investigator@chaintrace.local", "target_type": "EVIDENCE", "target_id": "EVD-001", "details": "SHA-256 hash verified intact against ledger", "result": "VERIFIED", "timestamp": "2026-10-02 08:30:00"}
]

# Calculate audit hash chain
audit_records = []
prev_audit_hash = "GENESIS-AUDIT-0000000000000000000000000000000000000000000000000000"
for i, entry in enumerate(audit_entries):
    data_str = f"{entry['timestamp']}|{entry['actor']}|{entry['action']}|{entry['target_id']}|{prev_audit_hash}"
    rec_hash = hashlib.sha256(data_str.encode("utf-8")).hexdigest()
    audit_rec = {
        "id": f"AUDIT-{1001 + i}",
        "timestamp": entry["timestamp"],
        "actor": entry["actor"],
        "action": entry["action"],
        "target_type": entry["target_type"],
        "target_id": entry["target_id"],
        "details": entry["details"],
        "result": entry["result"],
        "previous_hash": prev_audit_hash,
        "record_hash": rec_hash
    }
    audit_records.append(audit_rec)
    prev_audit_hash = rec_hash

# Write all CSV files
def write_csv(filename, fieldnames, rows):
    path = os.path.join(DATA_DIR, filename)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Generated {filename} ({len(rows)} rows)")

write_csv("cases.csv", list(cases[0].keys()), cases)
write_csv("persons.csv", list(persons[0].keys()), persons)
write_csv("phones.csv", list(phones[0].keys()), phones)
write_csv("vehicles.csv", list(vehicles[0].keys()), vehicles)
write_csv("locations.csv", list(locations[0].keys()), locations)
write_csv("transactions.csv", list(transactions[0].keys()), transactions)
write_csv("relationships.csv", list(relationships[0].keys()), relationships)
write_csv("evidence.csv", list(evidence_records[0].keys()), evidence_records)
write_csv("alerts.csv", list(alerts[0].keys()), alerts)
write_csv("cross_case_links.csv", list(cross_case_links[0].keys()), cross_case_links)
write_csv("audit_ledger.csv", list(audit_records[0].keys()), audit_records)

print("All synthetic files and sample evidence generated successfully!")
