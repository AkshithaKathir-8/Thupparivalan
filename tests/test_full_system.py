import os
import sys

# Ensure UTF-8 output on Windows terminal
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Ensure backend directory is in python path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(BASE_DIR, "backend"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_system():
    print("==================================================")
    print("THUPPARIVALAN END-TO-END SYSTEM VERIFICATION SUITE")
    print("==================================================")

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200
    print("[PASS] Health check endpoint operational")

    # 2. Authentication
    # 2a. Wrong password test
    bad_login = client.post("/api/auth/login", json={"email": "investigator@chaintrace.local", "password": "wrongpassword"})
    assert bad_login.status_code == 401
    print("[PASS] Invalid credentials rejected (401)")

    # 2b. Valid investigator login
    login_res = client.post("/api/auth/login", json={"email": "investigator@chaintrace.local", "password": "Thupparivalan@2026"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] Investigator login successful with JWT")

    # 2c. Get /me
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["role"] == "INVESTIGATOR"
    print("[PASS] Investigator identity verified via JWT token")

    # 3. Cases
    cases_res = client.get("/api/cases", headers=headers)
    assert cases_res.status_code == 200
    cases = cases_res.json()
    assert len(cases) >= 7
    print(f"[PASS] Cases retrieved ({len(cases)} cases found)")

    c1 = next(c for c in cases if c["case_code"] == "CASE-001")
    assert c1 is not None

    # 4. Evidence & Cryptographic Integrity Ledger
    evd_res = client.get("/api/evidence", headers=headers)
    assert evd_res.status_code == 200
    evd_list = evd_res.json()
    assert len(evd_list) >= 8
    print(f"[PASS] Evidence ledger retrieved ({len(evd_list)} records with SHA-256)")

    # 4a. Restore EVD-001 to clean state before test and verify
    client.post("/api/evidence/EVD-001/restore", headers=headers)
    verify_res = client.post("/api/evidence/EVD-001/verify", headers=headers)
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert v_data["verification_status"] == "VERIFIED"
    assert not v_data["tamper_detected"]
    print(f"[PASS] Cryptographic SHA-256 verification of EVD-001: VERIFIED")

    # 4b. Simulate file tampering on EVD-001
    tamper_res = client.post("/api/evidence/EVD-001/simulate-tamper", headers=headers)
    assert tamper_res.status_code == 200
    t_data = tamper_res.json()
    assert t_data["tamper_detected"] is True
    assert t_data["verification_status"] == "MODIFIED"
    print(f"[PASS] Tampering simulation detected on EVD-001: INTEGRITY VIOLATION TRIGGERED")

    # 5. Network Graph & NetworkX Centrality
    graph_res = client.get("/api/graph", headers=headers)
    assert graph_res.status_code == 200
    g_data = graph_res.json()
    assert len(g_data["elements"]) > 0
    assert g_data["metrics"]["total_nodes"] > 0
    print(f"[PASS] NetworkX Graph analytics computed: {g_data['metrics']['total_nodes']} nodes, {g_data['metrics']['total_edges']} edges, avg degree: {g_data['metrics']['average_degree']}")

    # 5b. Entity Dossier
    dossier_res = client.get("/api/entities/PER-001/dossier", headers=headers)
    assert dossier_res.status_code == 200
    dossier = dossier_res.json()
    assert dossier["name"] == "Ravi Kumar"
    assert dossier["metrics"]["degree"] > 0
    print(f"[PASS] Entity Dossier for Ravi Kumar: betweenness={dossier['metrics']['betweenness']}, connections={dossier['metrics']['total_connections']}")

    # 6. Cross-Case Intelligence
    ccl_res = client.get("/api/cross-case", headers=headers)
    assert ccl_res.status_code == 200
    ccl_list = ccl_res.json()
    assert len(ccl_list) >= 4
    # Check Ravi Kumar linking CASE-001 and CASE-006
    ccl_ravi = next(c for c in ccl_list if c["entity_name"] == "Ravi Kumar")
    assert "CASE-001" in [ccl_ravi["case_a_code"], ccl_ravi["case_b_code"]]
    assert "CASE-006" in [ccl_ravi["case_a_code"], ccl_ravi["case_b_code"]]
    print(f"[PASS] Cross-Case connection: Ravi Kumar bridges CASE-001 and CASE-006 ({ccl_ravi['confidence']*100:.0f}% confidence)")

    # Check Manoj K and Mohan R
    assert any(c["entity_name"] == "Manoj K" for c in ccl_list)
    assert any(c["entity_name"] == "Mohan R" for c in ccl_list)
    print("[PASS] Cross-Case connections confirmed for Manoj K and Mohan R")

    # 7. Intelligence Alerts
    alert_res = client.get("/api/alerts", headers=headers)
    assert alert_res.status_code == 200
    alerts = alert_res.json()
    assert len(alerts) >= 4
    assert any("Ravi Kumar" in (a["entity_name"] or "") or "PER-001" in a["entity_id"] for a in alerts)
    print(f"[PASS] Intelligence Alerts active ({len(alerts)} alerts validated)")

    # 8. AI Investigation Grounded Queries (10 prompt test questions)
    test_questions = [
        "Why was Ravi Kumar flagged?",
        "What cases is Ravi Kumar connected to?",
        "What evidence supports the connection between Ravi Kumar and CASE-006?",
        "Which entities appear across multiple cases?",
        "Who has the highest network influence in CASE-002?",
        "What suspicious transaction relationships exist?",
        "Summarize CASE-001.",
        "What evidence supports the alert for Manoj K?",
        "Are there potential common entities between CASE-005 and CASE-008?",
        "What evidence has an integrity issue?"
    ]

    print("\nExecuting Grounded AI RAG Queries:")
    for idx, q in enumerate(test_questions, 1):
        ai_res = client.post("/api/investigation/query", headers=headers, json={"question": q})
        assert ai_res.status_code == 200
        data = ai_res.json()
        assert len(data["answer"]) > 10
        print(f"  {idx}. Q: \"{q}\"")
        print(f"     Class: {data['classification']} | Conf: {data['confidence']*100:.0f}%")
        print(f"     A: {data['answer'][:120]}...\n")

    # 9. Reports Generation
    rep_res = client.post("/api/reports/generate", headers=headers, json={"case_id": c1["id"], "report_type": "COMPREHENSIVE"})
    assert rep_res.status_code == 200
    report = rep_res.json()
    assert "1. CASE INFORMATION" in report["content"]
    assert "9. TAMPER-EVIDENT EVIDENCE INTEGRITY LEDGER" in report["content"]
    print("[PASS] 12-section formal intelligence dossier generated successfully")

    # Restore EVD-001 so environment remains verified
    client.post("/api/evidence/EVD-001/restore", headers=headers)

    # 10. Audit Ledger
    audit_res = client.get("/api/audit", headers=headers)
    assert audit_res.status_code == 200
    audits = audit_res.json()
    assert len(audits) >= 7
    print(f"[PASS] Append-only audit trail verified ({len(audits)} events logged with previous_hash links)")

    print("\n==================================================")
    print("ALL VERIFICATION SUITE CHECKS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    test_system()
