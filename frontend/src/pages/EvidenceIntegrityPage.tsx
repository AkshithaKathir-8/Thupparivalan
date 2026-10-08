import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Upload,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  History,
  Lock,
  ArrowDown,
  FileSignature,
  Download,
  RotateCcw
} from 'lucide-react';
import { EvidenceRecord, AuditRecord } from '../types';
import { api } from '../services/api';

interface EvidenceIntegrityPageProps {
  onOpenUploadModal: () => void;
  targetEvidenceId?: string;
}

export const EvidenceIntegrityPage: React.FC<EvidenceIntegrityPageProps> = ({
  onOpenUploadModal,
  targetEvidenceId
}) => {
  const [evidenceList, setEvidenceList] = useState<EvidenceRecord[]>([]);
  const [auditList, setAuditList] = useState<AuditRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'LEDGER' | 'AUDIT'>('LEDGER');
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [tamperingId, setTamperingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ id: string; msg: string; violation: boolean } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [evds, audits] = await Promise.all([
        api.getEvidence(),
        api.getAuditTrail()
      ]);
      setEvidenceList(evds);
      setAuditList(audits);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerify = async (evdId: string) => {
    setVerifyingId(evdId);
    setStatusMessage(null);
    try {
      const result = await api.verifyEvidence(evdId);
      setStatusMessage({
        id: evdId,
        msg: result.message,
        violation: result.tamper_detected
      });
      await fetchData();
    } catch (err: any) {
      console.error(err);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleSimulateTamper = async (evdId: string) => {
    setTamperingId(evdId);
    setStatusMessage(null);
    try {
      const result = await api.simulateTamper(evdId);
      setStatusMessage({
        id: evdId,
        msg: result.message,
        violation: result.tamper_detected
      });
      await fetchData();
    } catch (err: any) {
      console.error(err);
    } finally {
      setTamperingId(null);
    }
  };

  const handleRestore = async (evdId: string) => {
    setRestoringId(evdId);
    setStatusMessage(null);
    try {
      const result = await api.restoreEvidence(evdId);
      setStatusMessage({
        id: evdId,
        msg: result.message || 'Evidence restored to original state and verified.',
        violation: false
      });
      await fetchData();
    } catch (err: any) {
      console.error(err);
    } finally {
      setRestoringId(null);
    }
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportLedgerCSV = () => {
    const headers = ['Evidence ID', 'File Name', 'Case Docket', 'SHA-256 Hash', 'Previous Hash', 'Custody Status', 'File Size (Bytes)', 'Created At'];
    const rows = evidenceList.map((e) => [
      `"${e.id}"`,
      `"${e.file_name}"`,
      `"${e.case_code || e.case_id}"`,
      `"${e.sha256_hash}"`,
      `"${e.previous_hash}"`,
      `"${e.verification_status}"`,
      e.file_size || 0,
      `"${e.uploaded_at || ''}"`
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadFile(csv, `evidence_ledger_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
  };

  const exportLedgerJSON = () => {
    const json = JSON.stringify(evidenceList, null, 2);
    downloadFile(json, `evidence_ledger_${Date.now()}.json`, 'application/json');
  };

  const exportAuditCSV = () => {
    const headers = ['Timestamp', 'Officer / Actor', 'Action', 'Target ID', 'Details', 'Record Hash', 'Previous Hash'];
    const rows = auditList.map((a) => [
      `"${a.timestamp}"`,
      `"${a.actor_id}"`,
      `"${a.action}"`,
      `"${a.target_id || ''}"`,
      `"${(a.details || '').replace(/"/g, '""')}"`,
      `"${a.record_hash}"`,
      `"${a.previous_hash}"`
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadFile(csv, `audit_ledger_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
  };

  const exportAuditJSON = () => {
    const json = JSON.stringify(auditList, null, 2);
    downloadFile(json, `audit_ledger_${Date.now()}.json`, 'application/json');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#BAE4F0]/60 flex items-center justify-center text-[#004E9B]">
              <ShieldCheck className="w-5 h-5 text-[#0091B9]" />
            </div>
            <h1 className="text-xl font-bold text-[#004E9B]">
              Tamper-Evident Evidence Ledger
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cryptographic SHA-256 hash chaining, immutable custody audit trail, and unauthorized modification verification.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchData}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Ledger</span>
          </button>
          <button
            onClick={onOpenUploadModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0091B9] hover:bg-[#007f9f] rounded-lg shadow-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Deposit New Evidence</span>
          </button>
        </div>
      </div>

      {/* Verification Status Toast / Notification Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between animate-in slide-in-from-top-2 duration-150 ${
            statusMessage.violation
              ? 'bg-[#FF6500]/10 border-[#FF6500] text-[#FF6500]'
              : 'bg-[#BAE4F0]/40 border-[#0091B9] text-[#004E9B]'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {statusMessage.violation ? (
              <ShieldAlert className="w-5 h-5 text-[#FF6500] shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-[#0091B9] shrink-0" />
            )}
            <div>
              <p className="text-xs font-bold">{statusMessage.msg}</p>
              <p className="text-[11px] opacity-80 mt-0.5">
                Target Artifact: {statusMessage.id} • Live physical disk recalculation compared with database ledger.
              </p>
            </div>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-bold hover:underline px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center space-x-2 ${
            activeTab === 'LEDGER'
              ? 'bg-[#BAE4F0] text-slate-900'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-[#0091B9]" />
          <span>Evidence Artifact Ledger ({evidenceList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center space-x-2 ${
            activeTab === 'AUDIT'
              ? 'bg-[#BAE4F0] text-slate-900'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-3.5 h-3.5 text-[#004E9B]" />
          <span>Immutable Custody Audit Log ({auditList.length})</span>
        </button>
      </div>

      {activeTab === 'LEDGER' ? (
        <div className="space-y-6">
          {/* Evidence Records Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-bold text-[#004E9B] uppercase tracking-wider">
                  Cryptographic Evidence Register
                </h2>
                <span className="text-[11px] text-slate-400">
                  Algorithm: SHA-256 with linked previous block hash
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={exportLedgerCSV}
                  className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors"
                  title="Export complete evidence register as CSV"
                >
                  <Download className="w-3 h-3 text-[#0091B9]" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={exportLedgerJSON}
                  className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors"
                  title="Export complete evidence register as JSON"
                >
                  <Download className="w-3 h-3 text-[#004E9B]" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200/80">
                  <tr>
                    <th className="px-4 py-3">Evidence ID</th>
                    <th className="px-4 py-3">File Name</th>
                    <th className="px-4 py-3">Docket</th>
                    <th className="px-4 py-3">SHA-256 Hash</th>
                    <th className="px-4 py-3">Previous Hash Link</th>
                    <th className="px-4 py-3">Custody Status</th>
                    <th className="px-4 py-3 text-right">Verification Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {evidenceList.map((evd) => {
                    const isTampered = evd.verification_status === 'MODIFIED';
                    return (
                      <tr
                        key={evd.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          targetEvidenceId === evd.id ? 'bg-[#BAE4F0]/20' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          {evd.id}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {evd.file_name}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          {evd.case_code || evd.case_id}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-[#004E9B] max-w-xs truncate" title={evd.sha256_hash}>
                          {evd.sha256_hash.slice(0, 16)}...
                        </td>
                        <td className="px-4 py-3 font-mono text-[10px] text-slate-400 max-w-xs truncate" title={evd.previous_hash}>
                          {evd.previous_hash.slice(0, 14)}...
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                              isTampered
                                ? 'bg-[#FF6500]/10 text-[#FF6500] border border-[#FF6500]/30 animate-pulse'
                                : 'bg-[#BAE4F0]/60 text-[#004E9B]'
                            }`}
                          >
                            {isTampered ? (
                              <>
                                <ShieldAlert className="w-3 h-3 text-[#FF6500]" />
                                <span>INTEGRITY VIOLATION</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-3 h-3 text-[#0091B9]" />
                                <span>VERIFIED INTACT</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => handleVerify(evd.id)}
                            disabled={verifyingId === evd.id}
                            className="px-2.5 py-1 text-[11px] font-semibold text-white bg-[#0091B9] hover:bg-[#007f9f] rounded shadow-2xs transition-colors disabled:opacity-50"
                          >
                            {verifyingId === evd.id ? 'Hashing...' : 'Verify Hash'}
                          </button>

                          {isTampered ? (
                            <button
                              onClick={() => handleRestore(evd.id)}
                              disabled={restoringId === evd.id}
                              className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-2xs transition-colors disabled:opacity-50 inline-flex items-center space-x-1"
                              title="Restore file to pristine cryptographic hash on disk"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>{restoringId === evd.id ? 'Restoring...' : 'Restore Pristine'}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSimulateTamper(evd.id)}
                              disabled={tamperingId === evd.id}
                              className="px-2 py-1 text-[10px] font-semibold text-[#FF6500] hover:bg-[#FF6500]/10 rounded border border-[#FF6500]/30 transition-colors"
                              title="Simulate 1-byte file alteration to test tamper-evident alert"
                            >
                              {tamperingId === evd.id ? 'Simulating...' : 'Simulate Tamper'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Visual Cryptographic Hash Chain Diagram */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h2 className="text-xs font-bold text-[#004E9B] uppercase tracking-wider mb-4 flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-[#0091B9]" />
              <span>Visual Cryptographic Hash Chain</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {evidenceList.slice(0, 4).map((evd, idx) => (
                <div
                  key={evd.id}
                  className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 relative space-y-2"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-800">{evd.id}</span>
                    <span className="font-mono text-slate-400">Block #{idx + 1}</span>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-400 font-mono block">PREV HASH</span>
                    <p className="text-[10px] font-mono text-slate-600 truncate">
                      {evd.previous_hash.slice(0, 18)}...
                    </p>
                  </div>

                  <div className="pt-1 border-t border-slate-200/80">
                    <span className="text-[9px] text-[#0091B9] font-mono font-bold block">
                      CURRENT SHA-256
                    </span>
                    <p className="text-[10px] font-mono font-bold text-[#004E9B] truncate">
                      {evd.sha256_hash.slice(0, 18)}...
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Custody Audit Trail Tab */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-bold text-[#004E9B] uppercase tracking-wider">
                Append-Only Custodial Event Ledger
              </h2>
              <span className="text-[11px] text-slate-400">
                Each record cryptographically binds to prior event hash
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={exportAuditCSV}
                className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors"
                title="Export complete custody audit trail as CSV"
              >
                <Download className="w-3 h-3 text-[#0091B9]" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={exportAuditJSON}
                className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors"
                title="Export complete custody audit trail as JSON"
              >
                <Download className="w-3 h-3 text-[#004E9B]" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Officer / Actor</th>
                  <th className="px-4 py-3">Operation</th>
                  <th className="px-4 py-3">Target ID</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3">Record Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {auditList.map((ad) => (
                  <tr key={ad.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(ad.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-sans">{ad.actor_id}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[#004E9B]">
                        {ad.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{ad.target_id}</td>
                    <td className="px-4 py-3 font-sans text-slate-600 max-w-sm">{ad.details}</td>
                    <td className="px-4 py-3 text-slate-400">{ad.record_hash.slice(0, 16)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
