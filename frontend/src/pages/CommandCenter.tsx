import React, { useState } from 'react';
import {
  Users,
  Phone,
  Truck,
  MapPin,
  CreditCard,
  Share2,
  FileText,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  FolderPlus,
  Upload,
  Brain,
  GitMerge,
  BriefcaseBusiness,
  Eye,
  Pencil,
  Activity
} from 'lucide-react';
import { DashboardStats, Case } from '../types';
import { CaseDetailsModal } from '../components/CaseDetailsModal';

interface CommandCenterProps {
  stats: DashboardStats | null;
  cases: Case[];
  activeCaseId: string;
  setActiveCaseId: (id: string) => void;
  onOpenCreateCase: () => void;
  onOpenUploadEvidence: () => void;
  onNavigateToModule: (mod: number, param?: string) => void;
  onVerifyEvidence: (evidenceId: string) => void;

  // Kept optional so existing App.tsx functionality does not break.
  // We will connect this to refreshGlobalData in App.tsx.
  onDataRefresh?: () => Promise<void>;

  // Kept because it already existed in your original component.
  onCreateCase?: () => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  stats,
  cases,
  activeCaseId,
  setActiveCaseId,
  onOpenCreateCase,
  onOpenUploadEvidence,
  onNavigateToModule,
  onVerifyEvidence,
  onDataRefresh
}) => {
  const [caseDetailsOpen, setCaseDetailsOpen] = useState(false);
  const [caseDetailsMode, setCaseDetailsMode] = useState<'view' | 'edit'>('view');

  const currentCase = cases.find(
    (c) => c.id === activeCaseId || c.case_code === activeCaseId
  );

  const openCaseDetails = (mode: 'view' | 'edit') => {
    if (!currentCase) return;

    setCaseDetailsMode(mode);
    setCaseDetailsOpen(true);
  };

  const handleCaseUpdated = async () => {
    if (onDataRefresh) {
      await onDataRefresh();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">

      {/* Top Banner / Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0091B9] animate-pulse" />
            <h1 className="text-xl font-bold text-[#004E9B]">
              Investigative Command Center
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time evidence ingestion, topological network analytics, and multi-jurisdictional intelligence synthesis.
          </p>
        </div>

<div className="flex items-center space-x-2.5">
  <button
    onClick={onOpenUploadEvidence}
    className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-[#004E9B] bg-white hover:bg-slate-50 rounded-lg border border-[#004E9B] transition-colors"
  >
    <Upload className="w-4 h-4 text-[#0091B9]" />
    <span>Deposit Evidence</span>
  </button>
</div>
      </div>

      {/* ========================================================= */}
      {/* CASE MANAGEMENT */}
      {/* ========================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">

        {/* Case Management Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">

            <div className="w-9 h-9 rounded-lg bg-[#BAE4F0]/60 flex items-center justify-center">
              <BriefcaseBusiness className="w-4 h-4 text-[#0091B9]" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-[#004E9B]">
                Case Management
              </h2>

              <p className="text-[10px] text-slate-400">
                View and manage investigation case details
              </p>
            </div>

          </div>
        </div>

        <div className="p-5">

          {currentCase ? (
            <>
              {/* Active Case Information */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                      Active Case
                    </span>

                    <span className="text-[10px] font-mono font-bold text-[#0091B9] px-2 py-0.5 rounded bg-[#BAE4F0]/40">
                      {currentCase.case_code}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 mt-1 truncate">
                    {currentCase.title}
                  </h3>

                  <p className="text-[11px] text-slate-500 mt-1">
                    {currentCase.district || 'District not specified'}
                  </p>
                </div>

                {/* View / Edit Buttons */}
                <div className="flex items-center gap-2 shrink-0">

                  <button
                    type="button"
                    onClick={() => openCaseDetails('view')}
                    className="px-3 py-2 text-[11px] font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#0091B9]" />
                    View Case
                  </button>

                  <button
                    type="button"
                    onClick={() => openCaseDetails('edit')}
                    className="px-3 py-2 text-[11px] font-semibold text-white bg-[#0091B9] hover:bg-[#007f9f] rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit Case
                  </button>

                </div>
              </div>

              {/* Case Status / Priority */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4">

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">
                    Priority
                  </span>

                  <span
                    className={`px-2 py-1 rounded-md text-[10px] font-semibold ${
                      currentCase.priority === 'CRITICAL'
                        ? 'bg-red-50 text-red-700'
                        : currentCase.priority === 'HIGH'
                        ? 'bg-orange-50 text-orange-700'
                        : currentCase.priority === 'MEDIUM'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {currentCase.priority}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">
                    Status
                  </span>

                  <span className="px-2 py-1 rounded-md bg-emerald-50 text-[10px] font-semibold text-emerald-700">
                    {currentCase.status}
                  </span>
                </div>

              </div>
            </>
          ) : (
            /* No Active Case */
            <div className="text-center py-5">

              <BriefcaseBusiness className="w-7 h-7 text-slate-300 mx-auto mb-2" />

              <p className="text-xs font-semibold text-slate-500">
                No active case selected
              </p>

              <p className="text-[10px] text-slate-400 mt-1">
                Select a case from the Active Docket or create a new case.
              </p>

            </div>
          )}

          {/* Create New Case */}
          <div className="mt-4 pt-4 border-t border-slate-100">

            <button
              type="button"
              onClick={onOpenCreateCase}
              className="w-full px-4 py-2.5 text-xs font-semibold text-[#004E9B] bg-[#BAE4F0]/30 hover:bg-[#BAE4F0]/50 rounded-lg border border-[#BAE4F0] flex items-center justify-center gap-2 transition-colors"
            >
              <FolderPlus className="w-4 h-4 text-[#0091B9]" />
              Create New Case
            </button>

          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* CASE DETAILS MODAL */}
      {/* ========================================================= */}
      {currentCase && (
        <CaseDetailsModal
          isOpen={caseDetailsOpen}
          caseId={currentCase.id}
          mode={caseDetailsMode}
          onClose={() => setCaseDetailsOpen(false)}
          onUpdated={handleCaseUpdated}
        />
      )}

      {/* Case Overview Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <Users className="w-4 h-4 text-[#0091B9]" />
            <span className="text-[10px] font-bold uppercase">Persons</span>
          </div>
          <p className="text-lg font-bold text-slate-800">
            {stats?.counts.persons ?? 0}
          </p>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <Phone className="w-4 h-4 text-[#004E9B]" />
            <span className="text-[10px] font-bold uppercase">Phones</span>
          </div>
          <p className="text-lg font-bold text-slate-800">
            {stats?.counts.phones ?? 0}
          </p>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <Truck className="w-4 h-4 text-[#FF6500]" />
            <span className="text-[10px] font-bold uppercase">Vehicles</span>
          </div>
          <p className="text-lg font-bold text-slate-800">
            {stats?.counts.vehicles ?? 0}
          </p>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <MapPin className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-bold uppercase">Locations</span>
          </div>
          <p className="text-lg font-bold text-slate-800">
            {stats?.counts.locations ?? 0}
          </p>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <CreditCard className="w-4 h-4 text-[#004E9B]" />
            <span className="text-[10px] font-bold uppercase">Transactions</span>
          </div>
          <p className="text-lg font-bold text-slate-800">
            {stats?.counts.transactions ?? 0}
          </p>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <Share2 className="w-4 h-4 text-[#0091B9]" />
            <span className="text-[10px] font-bold uppercase">Edges</span>
          </div>
          <p className="text-lg font-bold text-slate-800">
            {stats?.counts.relationships ?? 0}
          </p>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <FileText className="w-4 h-4 text-[#0091B9]" />
            <span className="text-[10px] font-bold uppercase">Evidence</span>
          </div>
          <p className="text-lg font-bold text-slate-800">
            {stats?.counts.evidence ?? 0}
          </p>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <AlertTriangle className="w-4 h-4 text-[#FF6500]" />
            <span className="text-[10px] font-bold uppercase">Alerts</span>
          </div>
          <p className="text-lg font-bold text-[#FF6500]">
            {stats?.counts.alerts ?? 0}
          </p>
        </div>

      </div>

      {/* AI Investigation Intelligence Summary Panel */}
      <div className="bg-[#BAE4F0]/30 border border-[#BAE4F0] rounded-xl p-5 shadow-xs">
        <div className="flex items-start justify-between">

          <div className="flex items-start space-x-3">

            <div className="w-9 h-9 rounded-lg bg-[#0091B9] text-white flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-[#004E9B]">
                  Analytical Intelligence Assessment
                </h2>

                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-[#0091B9] border border-[#BAE4F0]">
                  Grounded Evidence Synthesis
                </span>
              </div>

              <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                {stats?.summary}
              </p>
            </div>

          </div>

          <button
            onClick={() => onNavigateToModule(3)}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#004E9B] hover:bg-[#BAE4F0]/50 transition-colors shrink-0"
          >
            <span>Open AI Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

        </div>
      </div>

      {/* Main Two-Column Investigative Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Active Intelligence Alerts */}
        <div className="lg:col-span-2 space-y-4">

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">

            <div className="flex items-center justify-between mb-4">

              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-[#FF6500]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Active Intelligence Leads & Anomalies
                </h3>
              </div>

              <button
                onClick={() => onNavigateToModule(2)}
                className="text-xs font-semibold text-[#0091B9] hover:underline flex items-center space-x-1"
              >
                <span>View All Alerts</span>
                <ArrowRight className="w-3 h-3" />
              </button>

            </div>

            <div className="space-y-3">

              {stats?.recent_alerts && stats.recent_alerts.length > 0 ? (
                stats.recent_alerts.map((alt) => (

                  <div
                    key={alt.id}
                    className="p-3.5 rounded-lg border border-slate-200/80 hover:border-[#BAE4F0] bg-slate-50/50 hover:bg-[#BAE4F0]/10 transition-colors"
                  >

                    <div className="flex items-start justify-between gap-2">

                      <div>

                        <div className="flex items-center space-x-2">

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              alt.severity === 'CRITICAL' || alt.severity === 'HIGH'
                                ? 'bg-[#FF6500]/10 text-[#FF6500] border border-[#FF6500]/30'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {alt.severity}
                          </span>

                          <span className="text-xs font-bold text-slate-800">
                            {alt.title}
                          </span>

                        </div>

                        <p className="text-xs text-slate-600 mt-1.5 leading-snug">
                          {alt.reason}
                        </p>

                      </div>

                      <button
                        onClick={() => onNavigateToModule(3, alt.title)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-[#0091B9] hover:bg-[#BAE4F0]/40 rounded border border-[#0091B9]/30 shrink-0 transition-colors"
                      >
                        Investigate
                      </button>

                    </div>

                    {alt.supporting_evidence && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center space-x-2">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">
                          Corroborating Evidence:
                        </span>

                        {alt.supporting_evidence.split(',').map((ev, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-white text-[#004E9B] font-mono border border-slate-200"
                          >
                            {ev.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                  </div>

                ))
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No active high-priority alerts recorded.
                </p>
              )}

            </div>
          </div>

          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

            <button
              onClick={() => onNavigateToModule(4)}
              className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-[#0091B9] text-left transition-colors group shadow-xs"
            >
              <Share2 className="w-5 h-5 text-[#0091B9] mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-bold text-slate-800">
                Network Graph
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Explore topological edges
              </p>
            </button>

            <button
              onClick={() => onNavigateToModule(5)}
              className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-[#0091B9] text-left transition-colors group shadow-xs"
            >
              <GitMerge className="w-5 h-5 text-[#004E9B] mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-bold text-slate-800">
                Cross-Case
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Shared entity matching
              </p>
            </button>

            <button
              onClick={() => onNavigateToModule(6)}
              className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-[#0091B9] text-left transition-colors group shadow-xs"
            >
              <ShieldCheck className="w-5 h-5 text-[#0091B9] mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-bold text-slate-800">
                Evidence Ledger
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                SHA-256 chain verification
              </p>
            </button>

            <button
              onClick={() => onNavigateToModule(7)}
              className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-[#0091B9] text-left transition-colors group shadow-xs"
            >
              <FileText className="w-5 h-5 text-[#004E9B] mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-bold text-slate-800">
                Dossier Reports
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Export structured findings
              </p>
            </button>

          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">

          {/* Top Network Influencers */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">

            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-[#004E9B] uppercase tracking-wider flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-[#0091B9]" />
                <span>Network Influencers (Betweenness)</span>
              </h3>
            </div>

            <div className="space-y-2">

              {stats?.top_influencers && stats.top_influencers.length > 0 ? (
                stats.top_influencers.map((inf) => (

                  <div
                    key={inf.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs"
                  >

                    <div>
                      <p className="font-bold text-slate-800">
                        {inf.name}
                      </p>

                      <p className="text-[10px] text-slate-500 font-mono">
                        {inf.type} • {inf.connections} edges
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-mono font-bold text-[#004E9B]">
                        {inf.betweenness}
                      </span>

                      <p className="text-[9px] text-slate-400">
                        Betweenness
                      </p>
                    </div>

                  </div>

                ))
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">
                  Calculating topology...
                </p>
              )}

            </div>
          </div>

          {/* Tamper-Evident Ledger Integrity Snapshot */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">

            <div className="flex items-center justify-between mb-3">

              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0091B9]" />
                <span>Evidence Custody Integrity</span>
              </h3>

              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#BAE4F0]/60 text-[#004E9B]">
                SHA-256
              </span>

            </div>

            <div className="space-y-2 text-xs">

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">
                  Verified Evidence Artifacts:
                </span>

                <span className="font-bold text-[#0091B9]">
                  {stats?.counts.integrity_verified ?? 0}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">

                <span className="text-slate-500">
                  Integrity Violations Detected:
                </span>

                <span
                  className={`font-bold ${
                    (stats?.counts.integrity_violations ?? 0) > 0
                      ? 'text-[#FF6500]'
                      : 'text-slate-700'
                  }`}
                >
                  {stats?.counts.integrity_violations ?? 0}
                </span>

              </div>

            </div>

            <button
              onClick={() => onNavigateToModule(6)}
              className="w-full mt-3 py-2 text-xs font-semibold text-[#0091B9] hover:bg-[#BAE4F0]/30 rounded-lg border border-[#0091B9]/30 transition-colors"
            >
              Inspect Evidence Ledger & Chains
            </button>

          </div>

          {/* Recent Cryptographic Audit Actions */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">

            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Recent Custody Audit Entries
            </h3>

            <div className="space-y-2">

              {stats?.recent_audits && stats.recent_audits.length > 0 ? (
                stats.recent_audits.map((ad) => (

                  <div
                    key={ad.id}
                    className="text-[11px] border-b border-slate-100 pb-1.5"
                  >

                    <div className="flex justify-between items-center text-slate-400 text-[10px]">
                      <span>
                        {new Date(ad.timestamp).toLocaleTimeString()}
                      </span>

                      <span className="font-mono text-[#004E9B]">
                        {ad.action}
                      </span>
                    </div>

                    <p className="text-slate-700 truncate mt-0.5">
                      {ad.details}
                    </p>

                  </div>

                ))
              ) : (
                <p className="text-xs text-slate-400 py-2 text-center">
                  No recent audit logs.
                </p>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};