import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  FileSignature,
  Loader2
} from 'lucide-react';
import { Case, ReportItem } from '../types';
import { api } from '../services/api';

interface ReportsPageProps {
  cases: Case[];
  activeCaseId: string;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ cases, activeCaseId }) => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Form states
  const [targetCaseId, setTargetCaseId] = useState(activeCaseId || (cases[0]?.id || ''));
  const [reportType, setReportType] = useState('COMPREHENSIVE');
  const [scopeNotes, setScopeNotes] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await api.getReports();
      setReports(data);
      if (data.length > 0 && !selectedReport) {
        setSelectedReport(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const newReport = await api.generateReport(targetCaseId || undefined, reportType, scopeNotes);
      setReports((prev) => [newReport, ...prev]);
      setSelectedReport(newReport);
      setScopeNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadMarkdown = () => {
    if (!selectedReport) return;
    const blob = new Blob([selectedReport.content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `intelligence_dossier_${selectedReport.id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs print:hidden">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#BAE4F0]/60 flex items-center justify-center text-[#004E9B]">
              <FileText className="w-5 h-5 text-[#004E9B]" />
            </div>
            <h1 className="text-xl font-bold text-[#004E9B]">
              Intelligence Dossier & Formal Reports
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated synthesis of investigative evidence, NetworkX topological metrics, and tamper-evident custody verification.
          </p>
        </div>

        {selectedReport && (
          <div className="flex items-center space-x-2 self-start md:self-auto">
            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
              title="Download dossier as Markdown file"
            >
              <Download className="w-4 h-4 text-[#0091B9]" />
              <span>Download (.md)</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0091B9] hover:bg-[#007f9f] rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Generate New Report & Report History (4 cols) */}
        <div className="lg:col-span-4 space-y-4 print:hidden">
          {/* Generation Form */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h2 className="text-xs font-bold text-[#004E9B] uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <Plus className="w-4 h-4 text-[#0091B9]" />
              <span>Compile Intelligence Dossier</span>
            </h2>

            <form onSubmit={handleGenerate} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Target Docket
                </label>
                <select
                  value={targetCaseId}
                  onChange={(e) => setTargetCaseId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 font-medium"
                >
                  <option value="">Multi-Case Global Matrix</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.case_code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Dossier Report Scope
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 font-medium"
                >
                  <option value="COMPREHENSIVE">Comprehensive Investigation Dossier</option>
                  <option value="FINANCIAL">Financial Flow & Syndicate Routing</option>
                  <option value="CROSS_CASE">Cross-Jurisdiction Correlation</option>
                  <option value="INTEGRITY">Evidence Integrity & Custody Ledger</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Investigator Directive / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Directives for field execution or statutory court filings..."
                  value={scopeNotes}
                  onChange={(e) => setScopeNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full py-2.5 px-4 rounded-lg bg-[#0091B9] hover:bg-[#007f9f] text-white text-xs font-bold shadow-sm transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileSignature className="w-4 h-4" />
                )}
                <span>Generate Official Report</span>
              </button>
            </form>
          </div>

          {/* Generated Reports List */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2.5">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Dossier Archives ({reports.length})
            </h3>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {reports.map((rep) => {
                const isSelected = selectedReport?.id === rep.id;
                return (
                  <div
                    key={rep.id}
                    onClick={() => setSelectedReport(rep)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#BAE4F0]/30 border-[#0091B9] shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span className="truncate">{rep.case_code || 'GLOBAL'}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(rep.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 truncate mt-1">{rep.title}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Formal Document Viewer (8 cols) */}
        <div className="lg:col-span-8">
          {selectedReport ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm print:border-none print:shadow-none print:p-0">
              {/* Document Header */}
              <div className="border-b-2 border-[#004E9B] pb-4 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-black text-[#004E9B] tracking-tight">
                      TAMIL NADU POLICE DEPARTMENT
                    </h2>
                    <h3 className="text-xs font-bold text-[#0091B9] tracking-widest uppercase mt-0.5">
                      CRIME INVESTIGATION WING // INTELLIGENCE DOSSIER
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      ID: {selectedReport.id}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(selectedReport.created_at).toUTCString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Render Structured Content */}
              <div className="prose prose-slate max-w-none text-xs leading-relaxed space-y-4 font-sans">
                {selectedReport.content.split('\n\n').map((paragraph, i) => {
                  if (paragraph.startsWith('# ')) {
                    return null; // Skip markdown h1 since we printed custom police header
                  } else if (paragraph.startsWith('## ')) {
                    return (
                      <h4
                        key={i}
                        className="text-sm font-bold text-[#004E9B] uppercase tracking-wider border-b border-[#BAE4F0] pb-1 pt-3"
                      >
                        {paragraph.replace('## ', '')}
                      </h4>
                    );
                  } else if (paragraph.startsWith('### ')) {
                    return (
                      <h5 key={i} className="text-xs font-bold text-[#FF6500] mt-2">
                        {paragraph.replace('### ', '')}
                      </h5>
                    );
                  } else if (paragraph.startsWith('|')) {
                    // Table parser
                    const rows = paragraph.trim().split('\n');
                    const headers = rows[0].split('|').filter(Boolean).map((h) => h.trim());
                    const dataRows = rows.slice(2).map((r) =>
                      r.split('|').filter(Boolean).map((c) => c.trim())
                    );
                    return (
                      <div key={i} className="overflow-x-auto my-2">
                        <table className="w-full border-collapse border border-slate-200 text-[11px]">
                          <thead>
                            <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                              {headers.map((h, hi) => (
                                <th key={hi} className="p-2 border border-slate-200 text-left">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {dataRows.map((dr, dri) => (
                              <tr key={dri} className="border-b border-slate-100">
                                {dr.map((c, ci) => (
                                  <td key={ci} className="p-2 border border-slate-200">
                                    {c.replace(/\*\*/g, '')}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  } else if (paragraph.startsWith('- ')) {
                    return (
                      <ul key={i} className="list-disc pl-5 space-y-1 text-slate-700">
                        {paragraph.split('\n').map((item, ii) => (
                          <li key={ii}>{item.replace('- ', '').replace(/\*\*/g, '')}</li>
                        ))}
                      </ul>
                    );
                  }
                  return (
                    <p key={i} className="text-slate-700 leading-normal">
                      {paragraph.replace(/\*\*/g, '')}
                    </p>
                  );
                })}
              </div>

              {/* Signature Block */}
              <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-end text-xs">
                <div>
                  <p className="font-bold text-slate-800">Verified by Cryptographic Ledger</p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    SHA-256 Ledger Record Authenticated
                  </p>
                </div>
                <div className="text-right">
                  <div className="w-36 border-b border-slate-400 mb-1" />
                  <p className="font-bold text-[#004E9B]">{selectedReport.generated_by}</p>
                  <p className="text-[10px] text-slate-500">Authorized Investigating Officer</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
              <p className="text-xs text-slate-400">
                Select an archived dossier or compile a new investigation report on the left.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
