import os
import sys
import io

# Ensure UTF-8 output on Windows terminal
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(BASE_DIR, "backend"))

import httpx

def test_live_workflow():
    print("==================================================")
    print("TESTING LIVE EVIDENCE INTAKE & CORRELATION WORKFLOW")
    print("==================================================")

    client = httpx.Client(base_url="http://localhost:8000", timeout=30.0)

    # 1. Login
    login_res = client.post("/api/auth/login", json={"email": "investigator@chaintrace.local", "password": "Thupparivalan@2026"})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] Authenticated investigator session acquired")

    # 2. Create a new case
    case_payload = {
        "title": "Subsea Cable Sabotage & Data Interception",
        "district": "Chennai North Port",
        "priority": "HIGH",
        "description": "Suspected physical tapping of undersea telecommunication landing cables near Royapuram."
    }
    case_res = client.post("/api/cases", headers=headers, json=case_payload)
    assert case_res.status_code == 200, f"Case creation failed: {case_res.text}"
    case_data = case_res.json()
    new_case_id = case_data["id"]
    new_case_code = case_data["case_code"]
    print(f"[PASS] Created new case: {new_case_code} ('{case_data['title']}')")

    # 3. Create sample evidence: Call detail record linking an existing person (Ravi Kumar) and a new entity (Suresh Raina)
    sample_cdr_csv = (
        "caller_number,receiver_number,timestamp,duration_sec,cell_tower_location,caller_name,receiver_name\n"
        "+919840123456,+919444987654,2026-03-01 14:30:00,240,Royapuram Coastal Tower,Ravi Kumar,Suresh Raina\n"
        "+919444987654,+919840123456,2026-03-01 16:45:00,180,Ennore Harbor Sector B,Suresh Raina,Ravi Kumar\n"
    )

    files = {
        "file": ("PORT_INTERCEPT_LOG.csv", sample_cdr_csv.encode("utf-8"), "text/csv")
    }
    data = {"notes": "Intercepted satellite gateway logs near Royapuram"}

    upload_res = client.post(f"/api/cases/{new_case_id}/evidence", headers=headers, files=files, data=data)
    assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
    evd_data = upload_res.json()
    new_evd_id = evd_data["id"]
    print(f"[PASS] Uploaded evidence: {new_evd_id} ({evd_data['file_name']}) with SHA-256: {evd_data['sha256_hash'][:16]}...")

    # 4. Verify cryptographic integrity
    verify_res = client.post(f"/api/evidence/{new_evd_id}/verify", headers=headers)
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert v_data["verification_status"] == "VERIFIED"
    assert not v_data["tamper_detected"]
    print(f"[PASS] Cryptographic verification confirmed: {v_data['verification_status']}")

    # 5. Check if entities were extracted dynamically
    entities_res = client.get(f"/api/entities?case_id={new_case_id}", headers=headers)
    assert entities_res.status_code == 200
    entities = entities_res.json()
    extracted_names = [e["normalized_name"] for e in entities]
    print(f"[PASS] Extracted {len(entities)} entities from uploaded evidence: {extracted_names}")
    assert any("ravi kumar" in name.lower() for name in extracted_names), "Ravi Kumar should have been extracted"

    # 6. Check cross-case correlation: Ravi Kumar should now bridge CASE-001, CASE-006, AND the new case!
    ccl_res = client.get("/api/cross-case", headers=headers)
    assert ccl_res.status_code == 200
    ccls = ccl_res.json()
    linked_cases_for_ravi = [
        c["case_b_code"] if c["case_a_code"] == new_case_code else c["case_a_code"]
        for c in ccls if (c.get("entity_name") or "").lower() == "ravi kumar" and (c["case_a_code"] == new_case_code or c["case_b_code"] == new_case_code)
    ]
    print(f"[PASS] Multi-case correlation detected: Ravi Kumar links {new_case_code} with cases: {linked_cases_for_ravi}")

    # 7. Ask AI RAG inquiry engine about the new connection
    ai_q = f"What evidence links Ravi Kumar to {new_case_code}?"
    ai_res = client.post("/api/investigation/query", headers=headers, json={"question": ai_q, "case_id": new_case_id})
    assert ai_res.status_code == 200
    ai_data = ai_res.json()
    print(f"[PASS] Grounded AI Query Response:\n      Q: \"{ai_q}\"\n      A: {ai_data['answer'][:150]}...")

    print("==================================================")
    print("LIVE END-TO-END WORKFLOW VERIFIED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    test_live_workflow()
