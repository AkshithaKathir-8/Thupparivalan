import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Filter,
  RefreshCw,
  Search,
  ExternalLink,
  Brain,
  Share2,
  FileText,
  CheckCircle2,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { Alert } from '../types';
import { api } from '../services/api';

interface AlertsPageProps {
  onNavigateToAI: (query: string) => void;
  onNavigateToGraph: (entityId?: string) => void;
  onNavigateToEvidence: (evidenceId?: string) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  onNavigateToAI,
  onNavigateToGraph,
  onNavigateToEvidence
}) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await api.getAlerts();
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await api.refreshAlerts();
      await fetchAlerts();
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleStatusChange = async (alertId: string, newStatus: string) => {
    try {
      await api.updateAlert(alertId, { status: newStatus });
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: newStatus as any } : a))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.reason.toLowerCase().includes(search.toLowerCase()) ||
      (a.entity_name && a.entity_name.toLowerCase().includes(search.toLowerCase())) ||
      (a.case_code && a.case_code.toLowerCase().includes(search.toLowerCase()));

    const matchesSeverity = severityFilter === 'ALL' || a.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-[#FF6500]" />
            <h1 className="text-xl font-bold text-[#004E9B]">
              Intelligence Alerts & Anomalies
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Algorithmic detection of high-risk network nodes, multi-case co-occurrences, and suspicious transactional conduits.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0091B9] hover:bg-[#007f9f] rounded-lg shadow-sm transition-colors self-start md:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Execute Intelligence Rules Scan</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by entity, case code, or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0091B9]"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 text-slate-700"
            >
              <option value="ALL">All Levels</option>
              <option value="HIGH">High / Critical</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <span className="font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts Feed */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          Querying intelligence alert ledger...
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No Matching Alerts</h3>
          <p className="text-xs text-slate-500 mt-1">
            No intelligence alerts matched the selected filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredAlerts.map((alt) => (
            <div
              key={alt.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-[#BAE4F0] transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 max-w-3xl">
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        alt.severity === 'CRITICAL' || alt.severity === 'HIGH'
                          ? 'bg-[#FF6500]/10 text-[#FF6500] border border-[#FF6500]/30'
                          : alt.severity === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-[#BAE4F0]/60 text-[#004E9B]'
                      }`}
                    >
                      {alt.severity} PRIORITY
                    </span>

                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      Case: {alt.case_code || alt.case_id}
                    </span>

                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#BAE4F0]/50 text-[#004E9B]">
                      Confidence: {(alt.confidence * 100).toFixed(0)}%
                    </span>

                    <span className="text-[11px] text-slate-400 font-mono flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(alt.created_at).toLocaleDateString()}</span>
                    </span>
                  </div>

                  {/* Title & Entity */}
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{alt.title}</h2>
                    <p className="text-xs font-semibold text-[#004E9B] mt-0.5">
                      Subject Entity: {alt.entity_name || alt.entity_id}
                    </p>
                  </div>

                  {/* Reason */}
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {alt.reason}
                  </p>

                  {/* Supporting Evidence Pills */}
                  {alt.supporting_evidence && (
                    <div className="flex items-center space-x-2 pt-1">
                      <span className="text-xs font-bold text-slate-500 uppercase">
                        Corroborating Artifacts:
                      </span>
                      {alt.supporting_evidence.split(',').map((ev, i) => (
                        <button
                          key={i}
                          onClick={() => onNavigateToEvidence(ev.trim())}
                          className="text-xs px-2 py-0.5 rounded bg-slate-100 hover:bg-[#BAE4F0] text-[#004E9B] font-mono border border-slate-200 transition-colors"
                        >
                          {ev.trim()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Action Buttons */}
                <div className="flex flex-row md:flex-col items-center gap-2 shrink-0">
                  <button
                    onClick={() => onNavigateToAI(`Why was ${alt.entity_name || 'this entity'} flagged?`)}
                    className="w-full flex items-center justify-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0091B9] hover:bg-[#007f9f] rounded-lg shadow-xs transition-colors"
                  >
                    <Brain className="w-3.5 h-3.5" />
                    <span>Investigate</span>
                  </button>

                  <button
                    onClick={() => onNavigateToGraph(alt.entity_id)}
                    className="w-full flex items-center justify-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-[#004E9B] bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#0091B9]" />
                    <span>View Network</span>
                  </button>

                  {/* Status Dropdown */}
                  <select
                    value={alt.status}
                    onChange={(e) => handleStatusChange(alt.id, e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 text-slate-700 font-medium"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INVESTIGATING">INVESTIGATING</option>
                    <option value="RESOLVED">RESOLVED</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
